// Popup shell: renders the blocklist and wires the add / delete / host-only
// controls to the pure core operations, persisting every change to storage.
// All list logic lives in src/core; this file only touches the DOM and storage.

import {
  addEntry,
  removeEntry,
  setHostOnly,
  normalizeHost,
  type BlockEntry,
} from "./core/index.js";
import {
  getBlocklist,
  setBlocklist,
  getEnabled,
  setEnabled,
} from "./storage.js";

let state: BlockEntry[] = [];

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (node === null) throw new Error(`Missing element #${id}`);
  return node as T;
}

const listEl = () => el<HTMLUListElement>("list");
const emptyEl = () => el<HTMLParagraphElement>("empty");
const errorEl = () => el<HTMLParagraphElement>("error");
const hostInput = () => el<HTMLInputElement>("host-input");
const enabledInput = () => el<HTMLInputElement>("enabled");
const enabledLabel = () => el<HTMLSpanElement>("enabled-label");

function reflectEnabled(enabled: boolean): void {
  enabledInput().checked = enabled;
  enabledLabel().textContent = enabled ? "On" : "Off";
}

function showError(message: string): void {
  const node = errorEl();
  node.textContent = message;
  node.hidden = false;
}

function clearError(): void {
  const node = errorEl();
  node.textContent = "";
  node.hidden = true;
}

function renderRow(entry: BlockEntry): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "row";

  const host = document.createElement("span");
  host.className = "row__host";
  host.textContent = entry.host;

  const label = document.createElement("label");
  label.className = "row__hostonly";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = entry.hostOnly;
  checkbox.addEventListener("change", () => {
    void commit(setHostOnly(state, entry.host, checkbox.checked));
  });
  label.append(checkbox, document.createTextNode("Host only"));

  const del = document.createElement("button");
  del.type = "button";
  del.className = "row__delete";
  del.textContent = "✕";
  del.setAttribute("aria-label", `Remove ${entry.host}`);
  del.addEventListener("click", () => {
    void commit(removeEntry(state, entry.host));
  });

  li.append(host, label, del);
  return li;
}

function render(): void {
  const list = listEl();
  list.replaceChildren(...state.map(renderRow));
  emptyEl().hidden = state.length > 0;
}

/** Adopt a new blocklist: update state, persist, re-render. */
async function commit(blocklist: BlockEntry[]): Promise<void> {
  state = blocklist;
  await setBlocklist(state);
  render();
}

/** Try to add `input`; returns whether it was added (false shows an error). */
async function add(input: string, hostOnly: boolean): Promise<boolean> {
  const result = addEntry(state, input, hostOnly);
  if (!result.ok) {
    showError(
      result.error === "duplicate"
        ? "That site is already on your block list."
        : "Enter a valid site, like youtube.com.",
    );
    return false;
  }
  clearError();
  await commit(result.blocklist);
  return true;
}

async function currentTabHost(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url ? normalizeHost(tab.url) : "";
}

async function init(): Promise<void> {
  state = await getBlocklist();
  render();
  reflectEnabled(await getEnabled());

  enabledInput().addEventListener("change", () => {
    const enabled = enabledInput().checked;
    reflectEnabled(enabled);
    void setEnabled(enabled);
  });

  el<HTMLButtonElement>("add-current").addEventListener("click", () => {
    void (async () => {
      const host = await currentTabHost();
      if (host === "") {
        showError("This page can't be added to the block list.");
        return;
      }
      await add(host, false);
    })();
  });

  el<HTMLFormElement>("add-form").addEventListener("submit", (event) => {
    event.preventDefault();
    void (async () => {
      if (await add(hostInput().value, false)) {
        hostInput().value = "";
      }
    })();
  });
}

document.addEventListener("DOMContentLoaded", () => void init());
