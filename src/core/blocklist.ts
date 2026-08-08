// Pure operations for managing the user's blocklist. Like the rest of core,
// these are browser-independent and return new arrays rather than mutating —
// the popup shell owns reading from and writing to chrome.storage.

import { normalizeHost, type BlockEntry, type Blocklist } from "./matching.js";

/** Why an {@link addEntry} attempt was refused. */
export type AddError = "invalid" | "duplicate";

export interface AddResult {
  /** True when the entry was added; false when refused (see `error`). */
  ok: boolean;
  /** The resulting list — the new list on success, an unchanged copy on refusal. */
  blocklist: BlockEntry[];
  error?: AddError;
}

/**
 * Add `input` (a URL or bare host) to the blocklist. The input is normalized
 * first; empty/garbage input is refused as `"invalid"`, and a host already in
 * the list is refused as `"duplicate"`. Never mutates the input list.
 */
export function addEntry(
  blocklist: Blocklist,
  input: string,
  hostOnly = false,
): AddResult {
  const host = normalizeHost(input);
  if (host === "")
    return { ok: false, blocklist: [...blocklist], error: "invalid" };
  if (blocklist.some((entry) => entry.host === host)) {
    return { ok: false, blocklist: [...blocklist], error: "duplicate" };
  }
  return { ok: true, blocklist: [...blocklist, { host, hostOnly }] };
}

/** Remove the entry with the given host. Never mutates the input list. */
export function removeEntry(blocklist: Blocklist, host: string): BlockEntry[] {
  return blocklist.filter((entry) => entry.host !== host);
}

/**
 * Set the `hostOnly` flag on the entry with the given host. Never mutates the
 * input list or its entries.
 */
export function setHostOnly(
  blocklist: Blocklist,
  host: string,
  hostOnly: boolean,
): BlockEntry[] {
  return blocklist.map((entry) =>
    entry.host === host ? { ...entry, hostOnly } : entry,
  );
}
