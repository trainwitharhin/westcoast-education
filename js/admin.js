import { getCourses, getBookings, createCourse } from './api.js';

const form        = document.getElementById('course-form');
const bookingList = document.getElementById('booking-list');
const status      = document.getElementById('status-message');

function showStatus(msg, isError = false) {
  status.textContent = msg;
  status.style.color = isError ? 'red' : 'green';
}

function renderBookings(courses, bookings) {
  if (!bookings.length) {
    bookingList.textContent = 'Inga bokningar ännu.';
    return;
  }

  bookingList.innerHTML = courses.map(course => {
    const courseBookings = bookings.filter(b => b.courseId == course.id);
    if (!courseBookings.length) return '';

    const rows = courseBookings.map(b => `
      <tr>
        <td>${b.name}</td>
        <td>${b.email}</td>
      </tr>
    `).join('');

    return `
      <div class="course-group">
        <h3>${course.title ?? course.name} (${course.courseNumber ?? ''})</h3>
        <table>
          <tr><th>Namn</th><th>Email</th></tr>
          ${rows}
        </table>
      </div>
    `;
  }).join('');
}

async function loadBookings() {
  try {
    const [courses, bookings] = await Promise.all([getCourses(), getBookings()]);
    renderBookings(courses, bookings);
  } catch (err) {
    bookingList.textContent = 'Kunde inte ladda bokningar.';
    bookingList.style.color = 'red';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { title, courseNumber, days, price } = Object.fromEntries(new FormData(form));
  try {
    await createCourse({ title, courseNumber, days: Number(days), price: Number(price) });
    form.reset();
    showStatus(`Kurs "${title}" skapad!`);
    await loadBookings();
  } catch (err) {
    showStatus('Kunde inte skapa kursen. Försök igen.', true);
  }
});

loadBookings();