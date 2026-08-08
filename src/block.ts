// Block page shell: shows a rotating focus line and the blocked domain (from the
// `blocked` query parameter buildRules attaches), and wires the "Go back" link.
// All copy/selection logic lives in core; this file only touches the DOM.

import { normalizeHost, pickFocusLine } from "./core/index.js";

const focus = document.getElementById("focus");
if (focus) focus.textContent = pickFocusLine();

const domainName = normalizeHost(
  new URLSearchParams(location.search).get("blocked") ?? "",
);
const domain = document.getElementById("domain");
if (domain && domainName !== "") {
  domain.textContent = domainName;
  domain.hidden = false;
}

// "Go back" returns to the previous page — never forward into the blocked site.
const back = document.getElementById("go-back");
back?.addEventListener("click", (event) => {
  event.preventDefault();
  history.back();
});
