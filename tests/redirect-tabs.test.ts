import { describe, it, expect } from "vitest";
import {
  blockPagePath,
  tabsToRedirect,
  type Blocklist,
  type OpenTab,
} from "../src/core/index.js";

const list: Blocklist = [
  { host: "youtube.com", hostOnly: false },
  { host: "reddit.com", hostOnly: true },
];

describe("blockPagePath", () => {
  it("builds an extension-relative path carrying the blocked host", () => {
    expect(blockPagePath("youtube.com")).toBe("/block.html?blocked=youtube.com");
  });

  it("url-encodes the host", () => {
    expect(blockPagePath("a b.com")).toBe("/block.html?blocked=a%20b.com");
  });
});

describe("tabsToRedirect", () => {
  it("redirects a tab sitting on a listed site to the block page", () => {
    const tabs: OpenTab[] = [{ id: 7, url: "https://www.youtube.com/watch?v=1" }];
    expect(tabsToRedirect(tabs, list)).toEqual([
      { tabId: 7, path: blockPagePath("youtube.com") },
    ]);
  });

  it("leaves tabs not on a listed site untouched", () => {
    const tabs: OpenTab[] = [
      { id: 1, url: "https://example.com/" },
      { id: 2, url: "https://news.ycombinator.com/" },
    ];
    expect(tabsToRedirect(tabs, list)).toEqual([]);
  });

  it("honors hostOnly — subdomains of a host-only entry are left alone", () => {
    const tabs: OpenTab[] = [
      { id: 1, url: "https://old.reddit.com/" }, // subdomain, host-only → no match
      { id: 2, url: "https://reddit.com/" }, // exact → match
    ];
    expect(tabsToRedirect(tabs, list)).toEqual([
      { tabId: 2, path: blockPagePath("reddit.com") },
    ]);
  });

  it("matches subdomains for a default (domain) entry", () => {
    const tabs: OpenTab[] = [{ id: 3, url: "https://m.youtube.com/" }];
    expect(tabsToRedirect(tabs, list)).toEqual([
      { tabId: 3, path: blockPagePath("youtube.com") },
    ]);
  });

  it("uses only the first matching entry per tab (no duplicate redirects)", () => {
    const overlapping: Blocklist = [
      { host: "youtube.com", hostOnly: false },
      { host: "youtube.com", hostOnly: false },
    ];
    const tabs: OpenTab[] = [{ id: 9, url: "https://youtube.com/" }];
    expect(tabsToRedirect(tabs, overlapping)).toEqual([
      { tabId: 9, path: blockPagePath("youtube.com") },
    ]);
  });

  it("skips tabs whose url has no valid host (e.g. chrome:// pages)", () => {
    const tabs: OpenTab[] = [{ id: 4, url: "chrome://extensions" }];
    expect(tabsToRedirect(tabs, list)).toEqual([]);
  });

  it("emits no redirects for an empty blocklist", () => {
    const tabs: OpenTab[] = [{ id: 1, url: "https://youtube.com/" }];
    expect(tabsToRedirect(tabs, [])).toEqual([]);
  });
});
