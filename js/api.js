const BASE_URL = 'http://localhost:3000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function post(path, data) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

function patch(path, data) {
  return request(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export const getCourses      = ()           => request('/courses');
export const getCourse       = (id)         => request(`/courses/${id}`);
export const getBookings     = ()           => request('/bookings');
export const createCourse    = (course)     => post('/courses', course);
export const updateCourse    = (id, data)   => patch(`/courses/${id}`, data);
export const postBooking     = (booking)    => post('/bookings', booking);