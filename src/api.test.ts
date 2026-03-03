import { buildCoursePayload, ValidationError } from './api';

// ── buildCoursePayload ─────────────────────────────────────────────

describe('buildCoursePayload', () => {

  // ── Happy path ──────────────────────────────────────────────────

  it('returns a valid CoursePayload for correct input', () => {
    const result = buildCoursePayload(
      'React Fundamentals',
      're-101',
      'classroom',
      5,
      4999
    );

    expect(result).toEqual({
      title:        'React Fundamentals',
      name:         'React Fundamentals',
      courseNumber: 'RE-101',           // normalised to uppercase
      type:         'classroom',
      days:         5,
      price:        4999,
      capacity:     0,                  // default: unlimited
      description:  '',                 // default: empty
    });
  });

  it('includes optional capacity and description when provided', () => {
    const result = buildCoursePayload(
      'Node.js Backend',
      'nd-301',
      'distance',
      10,
      3500,
      20,
      'Backend development with Node.js and Express.'
    );

    expect(result.capacity).toBe(20);
    expect(result.description).toBe('Backend development with Node.js and Express.');
  });

  it('trims whitespace from title and description', () => {
    const result = buildCoursePayload(
      '  JavaScript Basics  ',
      'js-201',
      'ondemand',
      3,
      1999,
      0,
      '  Intro to modern JS.  '
    );

    expect(result.title).toBe('JavaScript Basics');
    expect(result.description).toBe('Intro to modern JS.');
  });

  it('normalises courseNumber to uppercase', () => {
    const result = buildCoursePayload('TypeScript', 'ts-401', 'classroom', 5, 5000);
    expect(result.courseNumber).toBe('TS-401');
  });

  it('sets name equal to title for json-server compatibility', () => {
    const result = buildCoursePayload('Blockchain', 'bc-501', 'classroom', 20, 4500);
    expect(result.name).toBe(result.title);
  });

  // ── Validation: title ───────────────────────────────────────────

  it('throws ValidationError when title is empty', () => {
    expect(() =>
      buildCoursePayload('', 'js-101', 'classroom', 5, 1000)
    ).toThrow(ValidationError);
  });

  it('throws ValidationError when title is only whitespace', () => {
    expect(() =>
      buildCoursePayload('   ', 'js-101', 'classroom', 5, 1000)
    ).toThrow('Course title is required.');
  });

  it('throws ValidationError when title is a single character', () => {
    expect(() =>
      buildCoursePayload('A', 'js-101', 'classroom', 5, 1000)
    ).toThrow('Course title must be at least 2 characters.');
  });

  // ── Validation: days ────────────────────────────────────────────

  it('throws ValidationError when days is 0', () => {
    expect(() =>
      buildCoursePayload('React', 're-101', 'classroom', 0, 1000)
    ).toThrow('Duration must be a whole number of at least 1 day.');
  });

  it('throws ValidationError when days is negative', () => {
    expect(() =>
      buildCoursePayload('React', 're-101', 'classroom', -3, 1000)
    ).toThrow(ValidationError);
  });

  it('throws ValidationError when days is a decimal', () => {
    expect(() =>
      buildCoursePayload('React', 're-101', 'classroom', 2.5, 1000)
    ).toThrow(ValidationError);
  });

  // ── Validation: price ───────────────────────────────────────────

  it('accepts price of 0 (free course)', () => {
    const result = buildCoursePayload('Free Course', 'fc-001', 'ondemand', 1, 0);
    expect(result.price).toBe(0);
  });

  it('throws ValidationError when price is negative', () => {
    expect(() =>
      buildCoursePayload('React', 're-101', 'classroom', 5, -100)
    ).toThrow('Price must be a positive number.');
  });

  // ── Validation: capacity ────────────────────────────────────────

  it('accepts capacity of 0 (unlimited)', () => {
    const result = buildCoursePayload('React', 're-101', 'classroom', 5, 1000, 0);
    expect(result.capacity).toBe(0);
  });

  it('throws ValidationError when capacity is negative', () => {
    expect(() =>
      buildCoursePayload('React', 're-101', 'classroom', 5, 1000, -5)
    ).toThrow('Capacity must be 0 (unlimited) or a positive whole number.');
  });

  it('throws ValidationError when capacity is a decimal', () => {
    expect(() =>
      buildCoursePayload('React', 're-101', 'classroom', 5, 1000, 10.5)
    ).toThrow(ValidationError);
  });

});