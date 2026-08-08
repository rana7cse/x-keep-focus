# Coding Standards

These are the conventions for x-keep-focus. They exist to keep a small,
dependency-free extension simple and correct. Prefer clarity over cleverness;
when a rule and readability genuinely conflict, favour readability and note why.

## Language & tooling

- **Vanilla JS, ES modules.** No framework, no bundler, no transpiler. The
  shipped extension must run as-is when loaded unpacked.
- **No runtime dependencies.** `package.json` may only carry **dev** dependencies
  (the test runner). If you reach for a runtime dependency, stop and reconsider.
- **No build step.** Source files are the deployed files. Don't introduce a
  compile/bundle stage.
- **Node 20+** is the development baseline (used only for tests).

## Architecture: the core seam

- **Keep all testable logic in the Chrome-independent core** under `src/` —
  URL normalization, match semantics, and rule building. This module **must not
  reference `chrome.*`** or any browser global.
- **Chrome shells stay thin.** `background.js`, `popup.js`, and `block.js` read
  storage, call the core module, and pass results to Chrome APIs. Push any logic
  worth testing down into the core rather than growing the shells.
- **Single source of truth.** Blocklist and toggle state live in
  `chrome.storage.sync`. Derive blocking rules from storage on change; don't keep
  a second, separately-mutated copy.

## JavaScript

- Use `const` by default, `let` only when reassigning; never `var`.
- Prefer small pure functions with descriptive names. A name that doesn't reveal
  what the function does is a design smell — rename it.
- Fail loudly on programmer error; handle expected runtime conditions (bad user
  input, missing tab URL) gracefully and predictably.
- No dead code, commented-out blocks, or abstraction added "for later." Add the
  parameter/hook when a real caller needs it, not before.
- Avoid duplication: if the same logic shape appears twice, extract it into the
  core module and call it from both places.

## CSS

- Class naming follows a light **BEM** convention: `block`, `block__element`,
  `block--modifier` (e.g. `popup__title`).
- Theme via CSS custom properties defined on `:root`, with a
  `@media (prefers-color-scheme: dark)` override. Both the popup and block page
  must look correct in light and dark.
- Keep styles scoped to their page; no global element overrides beyond a minimal
  reset.

## HTML

- Semantic elements (`main`, `header`, `button`, `label`) over generic `div`s.
- Every interactive control is keyboard-reachable and labelled.
- No inline `onclick` handlers or inline `<script>`; wire behaviour from the
  page's module script (MV3 CSP forbids inline script anyway).

## Manifest & permissions

- Manifest V3 only.
- Request the **narrowest permissions** that make a feature work, and add a
  permission only in the ticket that first needs it.

## Tests

- Written with **Vitest**. Test **external behaviour** (inputs → outputs), never
  private helpers or internal structure.
- The core module is the primary thing under test; because it has no `chrome.*`
  calls, tests need **no mocks**.
- Cover the interesting cases, including negative and look-alike ones (e.g.
  `notyoutube.com` must not match `youtube.com`), not just the happy path.
- `npm test` must be green before a PR is opened.

## Commits

- Conventional-commit style prefixes: `feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`, `test:`.
- Reference the ticket (`(#12)` in the subject, `Closes #12` in the body when it
  completes the ticket).
- Keep the subject imperative and under ~72 characters.
