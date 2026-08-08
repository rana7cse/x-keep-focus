# Coding Standards

These are the conventions for x-keep-focus. They exist to keep a small,
dependency-free extension simple and correct. Prefer clarity over cleverness;
when a rule and readability genuinely conflict, favour readability and note why.

## Language & tooling

- **TypeScript, ES modules, `strict` mode.** No framework, no bundler. Source
  lives in `src/`; `tsc` compiles it to `dist/`, which is what loads unpacked.
- **No runtime dependencies.** `package.json` may only carry **dev** dependencies
  (TypeScript, the test runner). If you reach for a runtime dependency, stop and
  reconsider.
- **Minimal build only.** `npm run build` = `tsc` + an asset-copy step; no
  bundler, no transpile magic beyond `tsc`. `dist/` is generated and git-ignored
  — never edit or commit it.
- **NodeNext module resolution.** Relative imports in source use the `.js`
  extension (e.g. `import { matches } from "./matching.js"`), which `tsc`
  resolves to the `.ts` file and emits correctly.
- **Type the domain.** Prefer explicit types/interfaces for domain concepts
  (a blocklist entry, a rule) over loose object shapes. Avoid `any`; if
  unavoidable, isolate it and comment why.
- **Node 20+** is the development baseline (used only to build and test).

## Architecture: the core seam

- **Keep all testable logic in the Chrome-independent core** under `src/core/` —
  URL normalization, match semantics, and rule building. This module **must not
  reference `chrome.*`** or any browser global.
- **Chrome shells stay thin.** `background.js`, `popup.js`, and `block.js` read
  storage, call the core module, and pass results to Chrome APIs. Push any logic
  worth testing down into the core rather than growing the shells.
- **Single source of truth.** Blocklist and toggle state live in
  `chrome.storage.sync`. Derive blocking rules from storage on change; don't keep
  a second, separately-mutated copy.

## TypeScript

- Use `const` by default, `let` only when reassigning; never `var`.
- Let inference do the work for locals; annotate function signatures and exported
  types explicitly so the module's contract is readable.
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
- Both `npm test` and `npm run typecheck` must be green before a PR is opened.

## Commits

- Conventional-commit style prefixes: `feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`, `test:`.
- Reference the ticket (`(#12)` in the subject, `Closes #12` in the body when it
  completes the ticket).
- Keep the subject imperative and under ~72 characters.
