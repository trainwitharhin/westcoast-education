import { getCourses, getBookings, createCourse, updateCourse } from './api.js';

// ── DOM refs ───────────────────────────────────────────────────────
const form         = document.getElementById('course-form');
const bookingList  = document.getElementById('booking-list');
const courseListEl = document.getElementById('admin-course-list');
const recentList   = document.getElementById('recent-bookings-list');
const statusMsg    = document.getElementById('status-message');
const kpiCourses   = document.getElementById('kpi-courses');
const kpiBookings  = document.getElementById('kpi-bookings');
const kpiFull      = document.getElementById('kpi-full');
const totalBadge   = document.getElementById('bookings-total-badge');

// ── Helpers ────────────────────────────────────────────────────────
const typeLabel = (type) =>
  ({ classroom: 'Classroom', distance: 'Distance', ondemand: 'On-Demand' }[type] ?? 'Classroom');

function showStatus(msg, isError = false) {
  if (!statusMsg) return;
  statusMsg.textContent = msg;
  statusMsg.style.color = isError ? 'var(--danger)' : 'var(--success)';
  setTimeout(() => { statusMsg.textContent = ''; }, 4000);
}

// ── Capacity logic ─────────────────────────────────────────────────
/**
 * Enriches each course with derived booking data:
 *   bookedCount  — number of confirmed bookings
 *   capacity     — max seats (0 = unlimited)
 *   isFull       — bookedCount >= capacity (only when capacity > 0)
 *   fillPct      — 0–100 for progress bar
 *   status       — 'full' | 'filling' | 'available' | 'unlimited'
 */
function enrichCourses(courses, bookings) {
  const countMap = bookings.reduce((acc, b) => {
    acc[b.courseId] = (acc[b.courseId] ?? 0) + 1;
    return acc;
  }, {});

  return courses.map(c => {
    const bookedCount = countMap[c.id] ?? 0;
    const capacity    = Number(c.capacity) || 0;
    const isFull      = capacity > 0 && bookedCount >= capacity;
    const fillPct     = capacity > 0 ? Math.min(100, Math.round((bookedCount / capacity) * 100)) : 0;

    let status = 'unlimited';
    if (capacity > 0) {
      if (isFull)           status = 'full';
      else if (fillPct >= 75) status = 'filling';
      else                    status = 'available';
    }

    return { ...c, bookedCount, capacity, isFull, fillPct, status };
  });
}

// ── Status badge HTML ──────────────────────────────────────────────
function statusBadge(course) {
  const map = {
    full:      { cls: 'status-badge--full',      label: 'Full'      },
    filling:   { cls: 'status-badge--filling',   label: 'Filling'   },
    available: { cls: 'status-badge--available', label: 'Available' },
    unlimited: { cls: 'status-badge--unlimited', label: 'Open'      },
  };
  const s = map[course.status] ?? map.unlimited;
  return `<span class="status-badge ${s.cls}">${s.label}</span>`;
}

// ── Progress bar HTML ──────────────────────────────────────────────
function progressBar(course) {
  if (!course.capacity) return '';
  const cls = course.status === 'full' ? 'progress-fill--full'
            : course.status === 'filling' ? 'progress-fill--filling'
            : 'progress-fill--ok';
  return `
    <div class="capacity-bar" title="${course.bookedCount} / ${course.capacity} booked">
      <div class="capacity-bar-fill ${cls}" style="width:${course.fillPct}%"></div>
    </div>`;
}

// ── KPIs ───────────────────────────────────────────────────────────
function renderKPIs(enriched, bookings) {
  const fullCount = enriched.filter(c => c.isFull).length;
  if (kpiCourses)  kpiCourses.textContent  = enriched.length;
  if (kpiBookings) kpiBookings.textContent = bookings.length;
  if (kpiFull)     kpiFull.textContent     = fullCount;
  if (totalBadge)  totalBadge.textContent  = `${bookings.length} total`;

  if (window.updateSidebarBadges) {
    window.updateSidebarBadges(enriched.length, bookings.length);
  }
}

// ── Recent bookings (overview) ─────────────────────────────────────
function renderRecentBookings(enriched, bookings) {
  if (!recentList) return;
  const recent = [...bookings].slice(-5).reverse();
  if (!recent.length) {
    recentList.innerHTML = '<p class="empty-body">No bookings yet.</p>';
    return;
  }
  const courseMap = Object.fromEntries(enriched.map(c => [c.id, c.title ?? c.name]));
  recentList.innerHTML = `
    <table>
      <thead><tr><th>Name</th><th>Course</th><th>Email</th></tr></thead>
      <tbody>
        ${recent.map(b => `
          <tr>
            <td>${b.name}</td>
            <td>${courseMap[b.courseId] ?? '—'}</td>
            <td class="td-muted">${b.email}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

// ── Course list (courses view) ─────────────────────────────────────
function renderCourseList(enriched) {
  if (!courseListEl) return;
  if (!enriched.length) {
    courseListEl.innerHTML = '<p class="empty-body">No courses yet. Create one using the form.</p>';
    return;
  }

  courseListEl.innerHTML = enriched.map(c => `
    <div class="admin-course-row ${c.isFull ? 'row--full' : ''}">
      <div class="row-main">
        <div class="row-title-group">
          <span class="admin-course-title">${c.title ?? c.name}</span>
          <span class="admin-course-meta">
            ${[c.courseNumber, c.days ? `${c.days} days` : null].filter(Boolean).join(' · ')}
          </span>
        </div>
        <div class="row-meta-group">
          <span class="course-tag tag--${c.type || 'classroom'}">${typeLabel(c.type)}</span>
          <div class="capacity-cell">
            <span class="capacity-fraction">
              ${c.capacity ? `${c.bookedCount} / ${c.capacity}` : `${c.bookedCount} booked`}
            </span>
            ${statusBadge(c)}
          </div>
          <button
            class="edit-capacity-btn"
            data-id="${c.id}"
            data-capacity="${c.capacity}"
            title="Edit capacity"
            aria-label="Edit capacity for ${c.title ?? c.name}"
          >⊘ Capacity</button>
        </div>
      </div>
      ${progressBar(c)}
    </div>`).join('');

  // Wire capacity edit buttons
  courseListEl.querySelectorAll('.edit-capacity-btn').forEach(btn => {
    btn.addEventListener('click', () => openCapacityEditor(
      Number(btn.dataset.id),
      Number(btn.dataset.capacity)
    ));
  });
}

// ── Inline capacity editor ─────────────────────────────────────────
function openCapacityEditor(courseId, currentCapacity) {
  // Remove any existing editor
  document.getElementById('capacity-editor')?.remove();

  const editor = document.createElement('div');
  editor.id = 'capacity-editor';
  editor.className = 'capacity-editor';
  editor.innerHTML = `
    <div class="capacity-editor-inner">
      <label class="field-label">Max seats <span class="field-hint">(0 = unlimited)</span></label>
      <div class="capacity-editor-row">
        <input
          id="capacity-input"
          type="number"
          min="0"
          value="${currentCapacity}"
          class="capacity-input"
          placeholder="e.g. 20"
          autofocus
        />
        <button class="btn-saas-sm" id="capacity-save">Save</button>
        <button class="btn-ghost-sm" id="capacity-cancel">Cancel</button>
      </div>
      <p id="capacity-status" style="font-size:12px;min-height:16px;margin-top:6px"></p>
    </div>`;

  // Insert after the clicked row
  const row = courseListEl.querySelector(`[data-id="${courseId}"]`)?.closest('.admin-course-row');
  if (row) row.after(editor);
  else courseListEl.appendChild(editor);

  document.getElementById('capacity-cancel').onclick = () => editor.remove();

  document.getElementById('capacity-save').onclick = async () => {
    const val = Number(document.getElementById('capacity-input').value);
    const saveBtn = document.getElementById('capacity-save');
    const capStatus = document.getElementById('capacity-status');
    saveBtn.textContent = 'Saving…';
    saveBtn.disabled = true;
    try {
      await updateCourse(courseId, { capacity: val });
      editor.remove();
      await loadData();
      showStatus('Capacity updated.');
    } catch {
      capStatus.textContent = 'Could not save. Try again.';
      capStatus.style.color = 'var(--danger)';
      saveBtn.textContent = 'Save';
      saveBtn.disabled = false;
    }
  };
}

// ── Bookings grouped by course ─────────────────────────────────────
function renderBookings(enriched, bookings) {
  if (!bookingList) return;
  if (!bookings.length) {
    bookingList.innerHTML = '<p class="empty-body">No bookings yet.</p>';
    return;
  }

  const groups = enriched.map(course => {
    const cb = bookings.filter(b => b.courseId == course.id);
    if (!cb.length) return '';
    return `
      <div class="course-group">
        <div class="course-group-header">
          <div>
            <h3 class="course-group-title">
              ${course.title ?? course.name}
              ${course.courseNumber ? `<span class="course-group-num">${course.courseNumber}</span>` : ''}
            </h3>
          </div>
          <div class="course-group-right">
            <span class="capacity-fraction">${cb.length}${course.capacity ? ` / ${course.capacity}` : ''} booked</span>
            ${statusBadge(course)}
          </div>
        </div>
        ${course.capacity ? progressBar(course) : ''}
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th></tr></thead>
          <tbody>
            ${cb.map(b => `
              <tr>
                <td>${b.name}</td>
                <td class="td-muted">${b.email}</td>
                <td class="td-muted">${b.phone ?? '—'}</td>
                <td class="td-muted">${b.billingAddress ?? '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }).join('');

  bookingList.innerHTML = groups || '<p class="empty-body">No bookings for existing courses.</p>';
}

// ── Load ───────────────────────────────────────────────────────────
async function loadData() {
  try {
    const [courses, bookings] = await Promise.all([getCourses(), getBookings()]);
    const enriched = enrichCourses(courses, bookings);
    renderKPIs(enriched, bookings);
    renderRecentBookings(enriched, bookings);
    renderCourseList(enriched);
    renderBookings(enriched, bookings);

    // Expose to course.html frontend (full-course guard)
    window.__enrichedCourses = enriched;
  } catch (err) {
    console.error('Load error:', err);
    if (bookingList) bookingList.innerHTML =
      '<p class="error-text">Could not load data. Is json-server running?</p>';
  }
}

// ── Form submit ────────────────────────────────────────────────────
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn  = form.querySelector('[type=submit]');
    const data = Object.fromEntries(new FormData(form));
    btn.textContent = 'Creating…';
    btn.disabled = true;
    try {
      await createCourse({
        title:        data.title,
        name:         data.title,
        courseNumber: data.courseNumber,
        days:         Number(data.days),
        price:        Number(data.price),
        capacity:     Number(data.capacity) || 0,
        type:         data.type || 'classroom',
        description:  data.description || ''
      });
      form.reset();
      showStatus(`"${data.title}" created successfully.`);
      await loadData();
    } catch {
      showStatus('Could not create course. Try again.', true);
    } finally {
      btn.textContent = 'Create Course';
      btn.disabled = false;
    }
  });
}

loadData();