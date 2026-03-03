import { buildCoursePayload } from "./api";

describe("buildCoursePayload", () => {
  it("should return a valid course object", () => {
    const result = buildCoursePayload("React", 123, 5, 4999);

    expect(result).toEqual({
      title: "React",
      courseNumber: 123,
      days: 5,
      price: 4999
    });
  });
});
