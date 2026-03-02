import { getCourses, postBooking } from './api.js';

const list = document.getElementById('course-list');

function renderForm(courseId) {
  const form = document.createElement('form');
  form.className = 'booking-form';
  form.innerHTML = `
    <input name="name" placeholder="Namn" required />
    <input name="billingAddress" placeholder="Fakturaadress" required />
    <input name="email" type="email" placeholder="E-post" required />
    <input name="phone" type="tel" placeholder="Mobilnummer" required />
    <button type="submit">Skicka bokning</button>
  `;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { name, billingAddress, email, phone } = Object.fromEntries(new FormData(form));
    await postBooking({ courseId, name, billingAddress, email, phone });
    alert('Bokning genomförd');
    form.remove();
  });
  return form;
}

try {
  const courses = await getCourses();
  list.classList.remove('loading');
  list.innerHTML = courses.map(c => `
    <div class="course-card" data-id="${c.id}">
      <h2>${c.name}</h2>
      ${c.description ? `<p>${c.description}</p>` : ''}
      <button class="btn-book">Boka kurs</button>
    </div>
  `).join('');

  list.addEventListener('click', (e) => {
    if (!e.target.matches('.btn-book')) return;
    const card = e.target.closest('.course-card');
    if (card.querySelector('.booking-form')) return;
    card.appendChild(renderForm(Number(card.dataset.id)));
  });
} catch (err) {
  list.classList.replace('loading', 'error');
  console.error(err);
}