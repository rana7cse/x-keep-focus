import { describe, it, expect } from "vitest";
import { FOCUS_LINES, pickFocusLine } from "../src/core/index.js";

describe("FOCUS_LINES", () => {
  it("is a non-empty set of distinct lines", () => {
    expect(FOCUS_LINES.length).toBeGreaterThan(1);
    expect(new Set(FOCUS_LINES).size).toBe(FOCUS_LINES.length);
  });
});

describe("pickFocusLine", () => {
  it("returns the first line at random = 0", () => {
    expect(pickFocusLine(0)).toBe(FOCUS_LINES[0]);
  });

  it("returns the last line just below random = 1", () => {
    expect(pickFocusLine(0.9999)).toBe(FOCUS_LINES[FOCUS_LINES.length - 1]);
  });

  it("maps the middle of the range to a middle line", () => {
    const index = Math.floor(0.5 * FOCUS_LINES.length);
    expect(pickFocusLine(0.5)).toBe(FOCUS_LINES[index]);
  });

  it("clamps out-of-range values instead of returning undefined", () => {
    expect(pickFocusLine(-1)).toBe(FOCUS_LINES[0]);
    expect(pickFocusLine(1)).toBe(FOCUS_LINES[FOCUS_LINES.length - 1]);
    expect(pickFocusLine(2)).toBe(FOCUS_LINES[FOCUS_LINES.length - 1]);
  });

  it("always returns a member of the set (default random)", () => {
    for (let i = 0; i < 50; i++) {
      expect(FOCUS_LINES).toContain(pickFocusLine());
    }
  });
});
