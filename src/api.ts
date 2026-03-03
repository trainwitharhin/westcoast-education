export function buildCoursePayload(
  title: string,
  courseNumber: number,
  days: number,
  price: number
) {
  return {
    title,
    courseNumber,
    days,
    price
  };
}
