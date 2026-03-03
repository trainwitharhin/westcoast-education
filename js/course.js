import { getCourse, postBooking } from './api.js';

const params   = new URLSearchParams(location.search);
const courseId = params.get('id');
const root     = document.getElementById('course-detail');
const modal    = document.getElementById('booking-modal');
const modalInner = document.getElementById('modal-inner');

if (!courseId) {
  root.innerHTML = '<p class="error-text">No course ID specified.</p>';
}

// ── Type label ────────────────────────────────────────────
function typeLabel(type) {
  const map = { classroom: 'Classroom', distance: 'Distance', ondemand: 'On-Demand' };
  const cls = { classroom: 'tag--classroom', distance: 'tag--distance', ondemand: 'tag--ondemand' };
  const t = type || 'classroom';
  return `<span class="course-tag ${cls[t] || 'tag--classroom'}">${map[t] || 'Classroom'}</span>`;
}

// ── Stars placeholder ─────────────────────────────────────
function stars(rating = 4.5) {
  return `<div class="rating">
    ${'★'.repeat(Math.floor(rating))}${rating % 1 ? '½' : ''} <span class="rating-num">${rating} / 5</span>
  </div>`;
}

// ── Render detail ─────────────────────────────────────────
function renderCourse(c) {
  // Derive capacity status from course data
  const bookedCount = Number(c.bookedCount ?? c.bookings ?? 0);
  const capacity    = Number(c.capacity)  || 0;
  const isFull      = capacity > 0 && bookedCount >= capacity;
  c = { ...c, isFull, bookedCount, capacity };

  document.title = `${c.name ?? c.title} – Westcoast Education`;

  const meta = [
    c.courseNumber  ? `<div class="detail-fact"><span class="fact-label">Course no.</span><span class="fact-val">${c.courseNumber}</span></div>` : '',
    c.days          ? `<div class="detail-fact"><span class="fact-label">Duration</span><span class="fact-val">${c.days} days</span></div>` : '',
    c.price         ? `<div class="detail-fact"><span class="fact-label">Price</span><span class="fact-val">${Number(c.price).toLocaleString('sv-SE')} kr</span></div>` : '',
    c.startDate     ? `<div class="detail-fact"><span class="fact-label">Start date</span><span class="fact-val">${c.startDate}</span></div>` : '',
    c.instructor    ? `<div class="detail-fact"><span class="fact-label">Instructor</span><span class="fact-val">${c.instructor}</span></div>` : '',
  ].filter(Boolean).join('');

  root.innerHTML = `
    <div class="detail-layout">
      <div class="detail-main">
        <div class="detail-tags">${typeLabel(c.type)}</div>
        <h1 class="detail-title">${c.name ?? c.title}</h1>
        ${stars(c.rating || 4.5)}
        <p class="detail-description">${c.description || 'No description available.'}</p>

        <div class="detail-facts">${meta}</div>
      </div>

      <div class="detail-sidebar">
        <div class="detail-card">
          ${c.price ? `<div class="detail-price">${Number(c.price).toLocaleString('sv-SE')} <span>kr</span></div>` : ''}
          ${isFull
            ? `<button class="btn btn-primary btn-full btn--disabled" disabled>Course Full</button>
               <p class="detail-card-note detail-card-note--full">This course has reached maximum capacity.</p>`
            : `<button class="btn btn-primary btn-full" id="open-booking">Book This Course</button>
               <p class="detail-card-note">Secure booking. Cancel up to 3 weeks before start.</p>`
          }
        </div>
      </div>
    </div>

    <!-- Sticky CTA mobile -->
    <div class="sticky-cta">
      <div class="sticky-cta-inner">
        <span class="sticky-cta-title">${c.name ?? c.title}</span>
        ${isFull
              ? `<button class="btn btn-primary btn--disabled" disabled>Full</button>`
              : `<button class="btn btn-primary" id="open-booking-sticky">Book Now</button>`
            }
      </div>
    </div>
  `;

  document.getElementById('open-booking').addEventListener('click', openBooking);
  document.getElementById('open-booking-sticky').addEventListener('click', openBooking);

  function openBooking() {
    showBookingModal(c);
  }
}

// ── Booking modal ─────────────────────────────────────────
function showBookingModal(c) {
  modalInner.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title">Book: ${c.name ?? c.title}</h2>
      <button class="modal-close" id="modal-close">✕</button>
    </div>
    <form id="booking-form" class="booking-form" novalidate>
      <div class="booking-form-grid">
        <div class="field">
          <label class="field-label">Full Name</label>
          <input name="name" placeholder="Your name" required autocomplete="name" />
        </div>
        <div class="field">
          <label class="field-label">Email</label>
          <input name="email" type="email" placeholder="you@email.com" required autocomplete="email" />
        </div>
        <div class="field">
          <label class="field-label">Billing Address</label>
          <input name="billingAddress" placeholder="Street address, city" required autocomplete="street-address" />
        </div>
        <div class="field">
          <label class="field-label">Mobile</label>
          <input name="phone" type="tel" placeholder="070-000 00 00" required autocomplete="tel" />
        </div>
      </div>
      <div id="form-error" class="error-text" style="display:none"></div>
      <button type="submit" class="btn btn-primary btn-full">Confirm Booking</button>
    </form>
  `;

  modal.hidden = false;
  document.body.style.overflow = 'hidden';

  document.getElementById('modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  document.getElementById('booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('[type=submit]');
    const errEl = document.getElementById('form-error');
    const { name, email, billingAddress, phone } = Object.fromEntries(new FormData(e.target));

    btn.textContent = 'Booking…';
    btn.disabled = true;
    errEl.style.display = 'none';

    try {
      await postBooking({ courseId: Number(courseId), name, billingAddress, email, phone });
      showConfirmation(c, name);
    } catch (err) {
      errEl.textContent = 'Booking failed. Please try again.';
      errEl.style.display = 'block';
      btn.textContent = 'Confirm Booking';
      btn.disabled = false;
    }
  });
}

function showConfirmation(c, name) {
  modalInner.innerHTML = `
    <div class="confirmation">
      <div class="confirm-icon">✓</div>
      <h2 class="confirm-title">Booking confirmed!</h2>
      <p class="confirm-body">Thank you, <strong>${name}</strong>. You're booked for <strong>${c.name ?? c.title}</strong>. A confirmation will be sent to your email.</p>
      <button class="btn btn-primary" id="confirm-close">Done</button>
    </div>
  `;
  document.getElementById('confirm-close').addEventListener('click', closeModal);
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
}

// ── Skeleton ──────────────────────────────────────────────
function showDetailSkeleton() {
  root.innerHTML = `
    <div class="detail-layout">
      <div class="detail-main">
        <div class="skeleton skeleton-tag" style="width:80px;height:24px;margin-bottom:16px"></div>
        <div class="skeleton" style="width:60%;height:40px;margin-bottom:16px"></div>
        <div class="skeleton" style="width:30%;height:16px;margin-bottom:32px"></div>
        <div class="skeleton" style="width:100%;height:14px;margin-bottom:8px"></div>
        <div class="skeleton" style="width:90%;height:14px;margin-bottom:8px"></div>
        <div class="skeleton" style="width:75%;height:14px"></div>
      </div>
      <div class="detail-sidebar">
        <div class="detail-card">
          <div class="skeleton" style="width:50%;height:36px;margin-bottom:16px"></div>
          <div class="skeleton skeleton-btn" style="width:100%;height:44px"></div>
        </div>
      </div>
    </div>`;
}

// ── Init ──────────────────────────────────────────────────
if (courseId) {
  showDetailSkeleton();
  try {
    const course = await getCourse(courseId);
    renderCourse(course);
  } catch (err) {
    root.innerHTML = `<p class="error-text">Could not load course. <a href="/index.html">← Back to courses</a></p>`;
  }
}