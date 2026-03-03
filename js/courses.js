import { getCourses, getBookings } from './api.js';

const list        = document.getElementById('course-list');
const searchInput = document.getElementById('search-input');
const filterBtns  = document.querySelectorAll('.filter-btn');
const countEl     = document.getElementById('course-count');

let allCourses = [];
let activeFilter = 'all';

// ── Skeleton ───────────────────────────────────────────────
function showSkeleton() {
  list.innerHTML = Array(5).fill(0).map(() => `
    <div class="course-card skeleton-card">
      <div class="skeleton skeleton-tag"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
      <div class="skeleton skeleton-meta"></div>
      <div class="skeleton skeleton-btn"></div>
    </div>`).join('');
}

// ── Type label ─────────────────────────────────────────────
function typeLabel(type) {
  const map = {
    classroom: { label: 'Classroom', cls: 'tag--classroom' },
    distance:  { label: 'Distance',  cls: 'tag--distance'  },
    ondemand:  { label: 'On-Demand', cls: 'tag--ondemand'  }
  };
  const t = map[type] || { label: 'Classroom', cls: 'tag--classroom' };
  return `<span class="course-tag ${t.cls}">${t.label}</span>`;
}

// ── Capacity badge ─────────────────────────────────────────
function capacityBadge(c) {
  const capacity    = Number(c.capacity) || 0;
  const bookedCount = Number(c.bookedCount) || 0;
  if (!capacity) return '';

  const remaining = capacity - bookedCount;
  const fillPct   = Math.min(100, Math.round((bookedCount / capacity) * 100));

  if (remaining <= 0) {
    return `<span class="course-tag tag--full">Full</span>`;
  }
  if (remaining <= 3) {
    return `<span class="seats-left seats-left--urgent">${remaining} seat${remaining !== 1 ? 's' : ''} left</span>`;
  }
  if (fillPct >= 75) {
    return `<span class="seats-left seats-left--warning">${remaining} seats left</span>`;
  }
  return '';
}

// ── Render ─────────────────────────────────────────────────
function renderCourses(courses) {
  if (!courses.length) {
    list.innerHTML = `
      <div class="empty-state">
        <p class="empty-title">No courses found</p>
        <p class="empty-body">Try a different filter or search term.</p>
      </div>`;
    if (countEl) countEl.textContent = '0 courses';
    return;
  }

  if (countEl) countEl.textContent = `${courses.length} course${courses.length !== 1 ? 's' : ''}`;

  list.innerHTML = courses.map((c, i) => {
    const capacity    = Number(c.capacity) || 0;
    const bookedCount = Number(c.bookedCount) || 0;
    const isFull      = capacity > 0 && bookedCount >= capacity;
    const featured    = i === 0 ? 'card--featured' : '';
    const meta        = [
      c.courseNumber,
      c.days   ? `${c.days} days`                           : null,
      c.price  ? `${Number(c.price).toLocaleString('sv-SE')} kr` : null
    ].filter(Boolean).join(' · ');

    // Truncate description: 1 line on small cards, 2 on featured
    const desc = c.description || '';
    const descClass = featured ? 'card-description card-description--featured' : 'card-description';

    return `
      <article class="course-card ${featured} ${isFull ? 'card--full' : ''}" data-type="${c.type || 'classroom'}">
        <div class="card-top">
          <div class="card-tags">
            ${typeLabel(c.type)}
            ${capacityBadge(c)}
            ${isFull ? '<span class="course-tag tag--full">Full</span>' : ''}
          </div>
        </div>
        <div class="card-body">
          <h2 class="card-title">${c.name ?? c.title}</h2>
          ${desc ? `<p class="${descClass}">${desc}</p>` : ''}
          ${meta ? `<p class="card-meta">${meta}</p>` : ''}
        </div>
        <div class="card-footer">
          ${isFull
            ? `<span class="btn btn-disabled" aria-disabled="true">Course Full</span>`
            : `<a href="/course.html?id=${c.id}" class="btn btn-primary">View Course</a>`
          }
        </div>
      </article>`;
  }).join('');
}

// ── Filter + Search ────────────────────────────────────────
function applyFilters() {
  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
  let filtered = allCourses;

  if (activeFilter !== 'all') {
    filtered = filtered.filter(c => (c.type || 'classroom') === activeFilter);
  }
  if (q) {
    filtered = filtered.filter(c =>
      (c.name ?? c.title ?? '').toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q) ||
      (c.courseNumber ?? '').toLowerCase().includes(q)
    );
  }
  renderCourses(filtered);
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('filter-btn--active'));
    btn.classList.add('filter-btn--active');
    activeFilter = btn.dataset.filter;
    applyFilters();
  });
});

if (searchInput) searchInput.addEventListener('input', applyFilters);

// ── Load ───────────────────────────────────────────────────
showSkeleton();
try {
  // Fetch courses + bookings in parallel to compute bookedCount
  const [courses, bookings] = await Promise.all([getCourses(), getBookings()]);

  // Enrich courses with booking counts (mirrors admin logic)
  const countMap = bookings.reduce((acc, b) => {
    acc[b.courseId] = (acc[b.courseId] ?? 0) + 1;
    return acc;
  }, {});

  allCourses = courses.map(c => ({
    ...c,
    bookedCount: countMap[c.id] ?? 0
  }));

  renderCourses(allCourses);
} catch (err) {
  list.innerHTML = `
    <div class="empty-state">
      <p class="empty-title">Could not load courses</p>
      <p class="empty-body">Make sure json-server is running: <code>npm start</code></p>
    </div>`;
  console.error(err);
}