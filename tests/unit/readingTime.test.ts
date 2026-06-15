import { describe, expect, it } from "bun:test";
import {
  calculateReadingTime,
  formatReadingTime,
} from "../../src/utils/readingTime";

describe("reading time", () => {
  it("returns a minimum one-minute read", () => {
    expect(calculateReadingTime("")).toBe(1);
    expect(calculateReadingTime("short text")).toBe(1);
  });

  it("rounds reading time upward dynamically", () => {
    const words = Array.from({ length: 301 }, (_, index) => `word${index}`).join(
      " ",
    );
    expect(calculateReadingTime(words)).toBe(3);
    expect(formatReadingTime(3)).toBe("~3 min read");
  });
});
