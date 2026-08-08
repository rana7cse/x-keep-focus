// Service worker: keeps the declarativeNetRequest dynamic rules in sync with the
// blocklist and the global toggle. It owns no logic of its own — the rules come
// from the tested core `buildRules`; this shell only reads storage and hands the
// result to the Chrome API.

import { buildRules, tabsToRedirect, type OpenTab } from "./core/index.js";
import {
  getBlocklist,
  getEnabled,
  BLOCKLIST_KEY,
  ENABLED_KEY,
} from "./storage.js";

/** Rebuild the dynamic rule set from current storage and apply it, replacing whatever is live. */
async function syncRules(): Promise<void> {
  const [blocklist, enabled] = await Promise.all([
    getBlocklist(),
    getEnabled(),
  ]);
  const desired = buildRules(blocklist, enabled);
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((rule) => rule.id),
    addRules: desired as unknown as chrome.declarativeNetRequest.Rule[],
  });
}

/**
 * Redirect any already-open tab currently sitting on a listed site to the block
 * page. declarativeNetRequest only fires on new navigations, so when blocking is
 * turned on the tabs already loaded need an explicit nudge. Core decides which.
 */
async function redirectOpenTabs(): Promise<void> {
  const blocklist = await getBlocklist();
  const openTabs: OpenTab[] = [];
  for (const tab of await chrome.tabs.query({})) {
    if (typeof tab.id === "number" && typeof tab.url === "string") {
      openTabs.push({ id: tab.id, url: tab.url });
    }
  }
  for (const { tabId, path } of tabsToRedirect(openTabs, blocklist)) {
    void chrome.tabs.update(tabId, { url: chrome.runtime.getURL(path) });
  }
}

chrome.runtime.onInstalled.addListener(() => void syncRules());
chrome.runtime.onStartup.addListener(() => void syncRules());

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (BLOCKLIST_KEY in changes || ENABLED_KEY in changes) void syncRules();
  // Only when blocking transitions on: catch tabs already on a listed site.
  // Turning it off leaves open block pages as they are (no force-navigation).
  if (changes[ENABLED_KEY]?.newValue === true) void redirectOpenTabs();
});

// Also run whenever the service worker first spins up, so live rules match
// storage even after the worker has been evicted and restarted.
void syncRules();
