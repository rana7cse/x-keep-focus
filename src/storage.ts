// Thin wrapper over chrome.storage.sync — the single source of truth for the
// extension's persisted shape. Keeping the key and (de)serialization here means
// the popup and (later) the service worker can't drift apart.

import type { BlockEntry } from "./core/index.js";

const BLOCKLIST_KEY = "blocklist";

export async function getBlocklist(): Promise<BlockEntry[]> {
  const stored = await chrome.storage.sync.get(BLOCKLIST_KEY);
  const value = stored[BLOCKLIST_KEY];
  return Array.isArray(value) ? (value as BlockEntry[]) : [];
}

export async function setBlocklist(blocklist: BlockEntry[]): Promise<void> {
  await chrome.storage.sync.set({ [BLOCKLIST_KEY]: blocklist });
}
