import { describe, it, expect } from "vitest";

// Smoke test: proves the Vitest harness is wired up and runs.
// Real behavioral coverage arrives with the core matching module (ticket #3).
describe("test harness", () => {
  it("runs", () => {
    expect(true).toBe(true);
  });
});
