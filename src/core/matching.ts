// Core matching logic for x-keep-focus.
//
// This module is deliberately browser-independent — it makes no extension-API
// calls and no DOM access — so it can be unit-tested directly with no browser
// mocks. The service worker, popup, and block page are thin shells over it.

/** A single entry in the user's blocklist. */
export interface BlockEntry {
  /** Normalized host, e.g. "youtube.com" (see {@link normalizeHost}). */
  host: string;
  /**
   * When true, match only the exact host (plus its www. form). When false
   * (the default), match the host and all of its subdomains.
   */
  hostOnly: boolean;
}

export type Blocklist = readonly BlockEntry[];

/**
 * A blocking rule, shaped to match the declarativeNetRequest Rule type so the
 * service worker can pass it straight to `updateDynamicRules`. Kept as our own
 * type here to preserve this module's browser-independence.
 */
export interface BlockingRule {
  id: number;
  priority: number;
  action: {
    type: "redirect";
    redirect: { extensionPath: string };
  };
  condition: {
    resourceTypes: ["main_frame"];
    requestDomains?: string[];
    regexFilter?: string;
  };
}

/** Extension-root-relative path of the page shown when a site is blocked. */
export const BLOCK_PAGE_PATH = "/block.html";

const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//;
const HOST_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/g;

/** True when `host` is a syntactically valid hostname (labels a-z0-9-, dot-separated). */
function isValidHost(host: string): boolean {
  if (host.length === 0 || host.length > 253) return false;
  return host.split(".").every((label) => HOST_LABEL.test(label));
}

/**
 * Reduce arbitrary user input or a full URL to a bare, comparable host:
 * lowercased, trimmed, with scheme, userinfo, port, path/query/fragment, a
 * leading `www.`, and a trailing dot removed. Returns "" when no valid host can
 * be extracted, which callers treat as "reject / never matches".
 */
export function normalizeHost(input: string): string {
  let value = input.trim().toLowerCase();
  if (value === "") return "";

  value = value.replace(SCHEME, "");
  value = value.split(/[/?#]/, 1)[0] ?? "";

  const at = value.lastIndexOf("@");
  if (at !== -1) value = value.slice(at + 1);

  value = value.replace(/:\d+$/, ""); // port
  value = value.replace(/^www\./, "");
  value = value.replace(/\.$/, ""); // trailing dot

  return isValidHost(value) ? value : "";
}

/**
 * Does a navigated URL fall under a blocklist entry? Path and query are ignored.
 * In default mode the entry's host and all subdomains match; in host-only mode
 * only the exact host (and its www. form) matches.
 */
export function matches(url: string, entry: BlockEntry): boolean {
  const host = normalizeHost(url);
  if (host === "" || entry.host === "") return false;
  if (host === entry.host) return true;
  if (entry.hostOnly) return false;
  return host.endsWith(`.${entry.host}`);
}

function escapeRegex(value: string): string {
  return value.replace(REGEX_SPECIALS, "\\$&");
}

function blockPath(host: string): string {
  return `${BLOCK_PAGE_PATH}?blocked=${encodeURIComponent(host)}`;
}

/** A redirect rule to the block page, parameterised by its match condition. */
function redirectRule(
  id: number,
  host: string,
  condition: BlockingRule["condition"],
): BlockingRule {
  return {
    id,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: blockPath(host) } },
    condition,
  };
}

function domainRule(id: number, host: string): BlockingRule {
  return redirectRule(id, host, {
    resourceTypes: ["main_frame"],
    requestDomains: [host],
  });
}

function hostOnlyRule(id: number, host: string): BlockingRule {
  // Match scheme://host or scheme://www.host, bounded so that neither a
  // longer subdomain (m.host) nor a suffix trick (host.evil.com) matches.
  const pattern = `^https?:\\/\\/(www\\.)?${escapeRegex(host)}(?:[:\\/?#]|$)`;
  return redirectRule(id, host, {
    resourceTypes: ["main_frame"],
    regexFilter: pattern,
  });
}

/**
 * Turn the blocklist plus the global toggle into declarativeNetRequest rules.
 * Returns no rules when disabled; entries with an empty host are skipped. Rule
 * ids are assigned sequentially from 1 over the rules that are actually emitted.
 */
export function buildRules(
  blocklist: Blocklist,
  enabled: boolean,
): BlockingRule[] {
  if (!enabled) return [];

  const rules: BlockingRule[] = [];
  let id = 1;
  for (const entry of blocklist) {
    if (entry.host === "") continue;
    rules.push(
      entry.hostOnly
        ? hostOnlyRule(id, entry.host)
        : domainRule(id, entry.host),
    );
    id++;
  }
  return rules;
}
