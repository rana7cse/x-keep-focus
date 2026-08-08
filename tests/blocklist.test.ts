import { describe, it, expect } from "vitest";
import {
  addEntry,
  removeEntry,
  setHostOnly,
  type BlockEntry,
} from "../src/core/index.js";

const entry = (host: string, hostOnly = false): BlockEntry => ({
  host,
  hostOnly,
});

describe("addEntry", () => {
  it("adds a normalized host", () => {
    const result = addEntry([], "https://www.YouTube.com/feed?x=1");
    expect(result.ok).toBe(true);
    expect(result.blocklist).toEqual([entry("youtube.com")]);
  });

  it("respects the hostOnly flag", () => {
    const result = addEntry([], "reddit.com", true);
    expect(result.ok).toBe(true);
    expect(result.blocklist).toEqual([entry("reddit.com", true)]);
  });

  it("rejects input that normalizes to nothing", () => {
    const result = addEntry([], "not a url");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("invalid");
    expect(result.blocklist).toEqual([]);
  });

  it("rejects a duplicate (compared by normalized host)", () => {
    const existing = [entry("youtube.com")];
    const result = addEntry(existing, "WWW.YouTube.com");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("duplicate");
    expect(result.blocklist).toEqual(existing);
  });

  it("appends to an existing list", () => {
    const result = addEntry([entry("youtube.com")], "reddit.com");
    expect(result.ok).toBe(true);
    expect(result.blocklist).toEqual([
      entry("youtube.com"),
      entry("reddit.com"),
    ]);
  });

  it("does not mutate the input list", () => {
    const existing = [entry("youtube.com")];
    addEntry(existing, "reddit.com");
    expect(existing).toEqual([entry("youtube.com")]);
  });
});

describe("removeEntry", () => {
  it("removes the matching host and leaves the rest", () => {
    const list = [entry("youtube.com"), entry("reddit.com")];
    expect(removeEntry(list, "youtube.com")).toEqual([entry("reddit.com")]);
  });

  it("returns an equivalent list when the host is absent", () => {
    const list = [entry("youtube.com")];
    expect(removeEntry(list, "example.com")).toEqual([entry("youtube.com")]);
  });

  it("does not mutate the input list", () => {
    const list = [entry("youtube.com"), entry("reddit.com")];
    removeEntry(list, "youtube.com");
    expect(list).toEqual([entry("youtube.com"), entry("reddit.com")]);
  });
});

describe("setHostOnly", () => {
  it("updates the flag on the matching entry only", () => {
    const list = [entry("youtube.com", false), entry("reddit.com", false)];
    expect(setHostOnly(list, "youtube.com", true)).toEqual([
      entry("youtube.com", true),
      entry("reddit.com", false),
    ]);
  });

  it("can clear the flag", () => {
    const list = [entry("youtube.com", true)];
    expect(setHostOnly(list, "youtube.com", false)).toEqual([
      entry("youtube.com", false),
    ]);
  });

  it("returns an equivalent list when the host is absent", () => {
    const list = [entry("youtube.com", false)];
    expect(setHostOnly(list, "example.com", true)).toEqual([
      entry("youtube.com", false),
    ]);
  });

  it("does not mutate the input list or its entries", () => {
    const list = [entry("youtube.com", false)];
    setHostOnly(list, "youtube.com", true);
    expect(list).toEqual([entry("youtube.com", false)]);
  });
});
