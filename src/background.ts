// Service worker: keeps the declarativeNetRequest dynamic rules in sync with the
// blocklist and the global toggle. It owns no logic of its own — the rules come
// from the tested core `buildRules`; this shell only reads storage and hands the
// result to the Chrome API.

import { buildRules } from "./core/index.js";
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

chrome.runtime.onInstalled.addListener(() => void syncRules());
chrome.runtime.onStartup.addListener(() => void syncRules());

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (BLOCKLIST_KEY in changes || ENABLED_KEY in changes) void syncRules();
});

// Also run whenever the service worker first spins up, so live rules match
// storage even after the worker has been evicted and restarted.
void syncRules();
