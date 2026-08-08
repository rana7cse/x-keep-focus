import { describe, it, expect } from "vitest";
import {
  normalizeHost,
  matches,
  buildRules,
  BLOCK_PAGE_PATH,
  type BlockEntry,
} from "../src/core/index.js";

const entry = (host: string, hostOnly = false): BlockEntry => ({
  host,
  hostOnly,
});

describe("normalizeHost", () => {
  it("returns an already-clean host unchanged", () => {
    expect(normalizeHost("youtube.com")).toBe("youtube.com");
  });

  it("lowercases", () => {
    expect(normalizeHost("YouTube.COM")).toBe("youtube.com");
  });

  it("strips the scheme", () => {
    expect(normalizeHost("https://youtube.com")).toBe("youtube.com");
    expect(normalizeHost("http://youtube.com")).toBe("youtube.com");
    expect(normalizeHost("ftp://files.example.com")).toBe("files.example.com");
  });

  it("strips a leading www.", () => {
    expect(normalizeHost("www.youtube.com")).toBe("youtube.com");
    expect(normalizeHost("https://www.youtube.com")).toBe("youtube.com");
  });

  it("preserves non-www subdomains", () => {
    expect(normalizeHost("m.youtube.com")).toBe("m.youtube.com");
    expect(normalizeHost("sub.example.co.uk")).toBe("sub.example.co.uk");
  });

  it("removes path, query, and fragment", () => {
    expect(normalizeHost("https://www.youtube.com/feed/subscriptions")).toBe(
      "youtube.com",
    );
    expect(normalizeHost("https://www.youtube.com/watch?v=abc#t=10")).toBe(
      "youtube.com",
    );
  });

  it("strips userinfo and port", () => {
    expect(normalizeHost("https://user:pass@example.com:8443/x")).toBe(
      "example.com",
    );
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeHost("  reddit.com  ")).toBe("reddit.com");
  });

  it("strips a trailing dot", () => {
    expect(normalizeHost("youtube.com.")).toBe("youtube.com");
  });

  it("keeps IP addresses", () => {
    expect(normalizeHost("192.168.1.1")).toBe("192.168.1.1");
  });

  it("returns empty string for invalid/garbage input", () => {
    expect(normalizeHost("")).toBe("");
    expect(normalizeHost("   ")).toBe("");
    expect(normalizeHost("https://")).toBe("");
    expect(normalizeHost("not a valid host")).toBe("");
    expect(normalizeHost("!!!")).toBe("");
    expect(normalizeHost("a..b")).toBe("");
  });
});

describe("matches — default (whole domain + subdomains)", () => {
  const e = entry("youtube.com");

  it("matches the exact host", () => {
    expect(matches("https://youtube.com", e)).toBe(true);
  });

  it("matches www and ignores the path", () => {
    expect(matches("https://www.youtube.com/feed", e)).toBe(true);
  });

  it("matches arbitrary subdomains", () => {
    expect(matches("https://m.youtube.com", e)).toBe(true);
    expect(matches("https://music.youtube.com/playlist?x=1", e)).toBe(true);
  });

  it("does not match look-alike hosts", () => {
    expect(matches("https://notyoutube.com", e)).toBe(false);
  });

  it("does not match when the host is only a suffix trick", () => {
    expect(matches("https://youtube.com.evil.com", e)).toBe(false);
  });

  it("does not match unrelated hosts", () => {
    expect(matches("https://example.com", e)).toBe(false);
  });
});

describe("matches — host only", () => {
  const e = entry("youtube.com", true);

  it("matches the exact host (ignoring path)", () => {
    expect(matches("https://youtube.com/x", e)).toBe(true);
  });

  it("treats www as the apex", () => {
    expect(matches("https://www.youtube.com", e)).toBe(true);
  });

  it("does not match other subdomains", () => {
    expect(matches("https://m.youtube.com", e)).toBe(false);
    expect(matches("https://music.youtube.com", e)).toBe(false);
  });
});

describe("buildRules", () => {
  it("returns no rules when disabled", () => {
    expect(buildRules([entry("youtube.com")], false)).toEqual([]);
  });

  it("returns no rules for an empty blocklist", () => {
    expect(buildRules([], true)).toEqual([]);
  });

  it("skips entries with an empty host", () => {
    expect(buildRules([entry("")], true)).toEqual([]);
  });

  it("builds a domain rule that carries the blocked host to the block page", () => {
    const [rule] = buildRules([entry("youtube.com")], true);
    expect(rule?.id).toBe(1);
    expect(rule?.priority).toBeGreaterThan(0);
    expect(rule?.action.type).toBe("redirect");
    expect(rule?.action.redirect.extensionPath).toBe(
      `${BLOCK_PAGE_PATH}?blocked=youtube.com`,
    );
    expect(rule?.condition.resourceTypes).toEqual(["main_frame"]);
    expect(rule?.condition.requestDomains).toEqual(["youtube.com"]);
    expect(rule?.condition.regexFilter).toBeUndefined();
  });

  it("builds a host-only rule whose regex matches apex + www but not other subdomains", () => {
    const [rule] = buildRules([entry("youtube.com", true)], true);
    expect(rule?.condition.requestDomains).toBeUndefined();
    const re = new RegExp(rule!.condition.regexFilter!);
    expect(re.test("https://youtube.com/")).toBe(true);
    expect(re.test("https://www.youtube.com/feed")).toBe(true);
    expect(re.test("https://m.youtube.com/")).toBe(false);
    expect(re.test("https://notyoutube.com/")).toBe(false);
    expect(re.test("https://youtube.com.evil.com/")).toBe(false);
  });

  it("assigns unique sequential ids across multiple entries", () => {
    const rules = buildRules(
      [entry("youtube.com"), entry("reddit.com", true), entry("x.com")],
      true,
    );
    expect(rules).toHaveLength(3);
    expect(rules.map((r) => r.id)).toEqual([1, 2, 3]);
  });
});
