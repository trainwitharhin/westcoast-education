// ── Types ──────────────────────────────────────────────────────────

export type CourseType = 'classroom' | 'distance' | 'ondemand';

export interface Course {
  id:           string;
  title:        string;
  name?:        string;         // legacy alias — json-server uses both
  courseNumber: string;
  type:         CourseType;
  days:         number;
  price:        number;
  capacity:     number;         // 0 = unlimited
  description:  string;
}

export interface Booking {
  id:             string;
  courseId:       string | number;
  name:           string;
  email:          string;
  billingAddress: string;
  phone:          string;
}

export interface CoursePayload {
  title:        string;
  name:         string;         // kept for json-server compat
  courseNumber: string;
  type:         CourseType;
  days:         number;
  price:        number;
  capacity:     number;
  description:  string;
}

// ── Validation error ───────────────────────────────────────────────

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ── buildCoursePayload ─────────────────────────────────────────────
/**
 * Validates and normalises raw form input into a CoursePayload
 * ready to POST to the REST API.
 *
 * Throws ValidationError for any invalid input so the caller
 * can surface the message directly in the UI.
 */
export function buildCoursePayload(
  title:        string,
  courseNumber: string,
  type:         CourseType,
  days:         number,
  price:        number,
  capacity:     number  = 0,
  description:  string  = ''
): CoursePayload {

  // ── Validation ────────────────────────────────────────────────
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    throw new ValidationError('Course title is required.');
  }
  if (trimmedTitle.length < 2) {
    throw new ValidationError('Course title must be at least 2 characters.');
  }
  const validTypes = new Set<CourseType>(['classroom', 'distance', 'ondemand']);
  if (!validTypes.has(type)) {
    throw new ValidationError(`Invalid course type: "${type}".`);
  }
  if (!Number.isInteger(days) || days < 1) {
    throw new ValidationError('Duration must be a whole number of at least 1 day.');
  }
  if (!Number.isFinite(price) || price < 0) {
    throw new ValidationError('Price must be a positive number.');
  }
  if (!Number.isInteger(capacity) || capacity < 0) {
    throw new ValidationError('Capacity must be 0 (unlimited) or a positive whole number.');
  }

  // ── Normalisation ─────────────────────────────────────────────
  return {
    title:        trimmedTitle,
    name:         trimmedTitle,
    courseNumber: courseNumber.trim().toUpperCase(),
    type,
    days,
    price,
    capacity,
    description:  description.trim(),
  };
}