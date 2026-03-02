const BASE = 'http://localhost:3000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
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

export const getCourses   = () => request('/courses');
export const getBookings  = () => request('/bookings');
export const createCourse = (course)  => post('/courses', course);
export const postBooking  = (booking) => post('/bookings', booking);