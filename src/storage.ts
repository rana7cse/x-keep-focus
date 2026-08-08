// Thin wrapper over chrome.storage.sync — the single source of truth for the
// extension's persisted shape. Keeping the keys and (de)serialization here means
// the popup and the service worker can't drift apart.

import type { BlockEntry } from "./core/index.js";

export const BLOCKLIST_KEY = "blocklist";
export const ENABLED_KEY = "enabled";

export async function getBlocklist(): Promise<BlockEntry[]> {
  const stored = await chrome.storage.sync.get(BLOCKLIST_KEY);
  const value = stored[BLOCKLIST_KEY];
  return Array.isArray(value) ? (value as BlockEntry[]) : [];
}

export async function setBlocklist(blocklist: BlockEntry[]): Promise<void> {
  await chrome.storage.sync.set({ [BLOCKLIST_KEY]: blocklist });
}

/** Whether blocking is currently on. Defaults to off until the user enables it. */
export async function getEnabled(): Promise<boolean> {
  const stored = await chrome.storage.sync.get(ENABLED_KEY);
  return stored[ENABLED_KEY] === true;
}

export async function setEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.sync.set({ [ENABLED_KEY]: enabled });
}
