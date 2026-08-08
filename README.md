# x-keep-focus

[![CI](https://github.com/rana7cse/x-keep-focus/actions/workflows/ci.yml/badge.svg)](https://github.com/rana7cse/x-keep-focus/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Chrome Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A minimal [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/) Chrome extension that blocks distracting sites so you can stay focused. Keep a personal blocklist, flip a single toggle to enter "focus mode," and any listed site redirects to a calm block page instead of pulling you in.

> Status: in active development. See the [issues](https://github.com/rana7cse/x-keep-focus/issues) for the current roadmap.

## Features

- **One-toggle focus mode** — a single global on/off switch in the popup.
- **Simple blocklist** — add the current site in one click or type a URL; delete per row.
- **Whole-domain or host-only** matching per entry (subdomains included by default).
- **Calm block page** — a fixed encouraging headline, a rotating focus line, and the blocked domain; auto light/dark.
- **Syncs** across your signed-in Chrome browsers via `chrome.storage.sync`.
- **TypeScript, no runtime dependencies** — a lightweight build (`tsc` + an asset copy) compiles `src/` into a loadable `dist/`.

## Install (load unpacked)

1. Build the extension: `npm install && npm run build` (produces `dist/`).
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the **`dist/`** folder.
5. The target icon appears to the right of the address bar; click it to open the popup.

To pick up local changes, re-run `npm run build`, then hit the reload ↻ button on the extension card in `chrome://extensions`.

## Development

Requires [Node.js](https://nodejs.org/) 20+. The shipped extension has no runtime dependencies; Node and the dev dependencies (TypeScript, Vitest) are used only to build and test.

```bash
npm install         # install dev dependencies (TypeScript, Vitest)
npm run build       # compile src/ -> dist/ (the loadable extension)
npm run typecheck   # type-check without emitting
npm test            # run the test suite once
npm run test:watch  # re-run tests on change
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and [CODING_STANDARDS.md](CODING_STANDARDS.md) for the conventions.

## Project structure

```
src/
  manifest.json        MV3 manifest (extension entry point)
  popup.html/.css      Toolbar popup markup + styles
  popup.ts             Popup logic (toggle + blocklist management)
  block.html/.css      Block page markup + styles
  block.ts             Block page logic
  background.ts        Service worker: builds & applies blocking rules
  core/                Chrome-independent core logic (the tested seam)
  icons/               Toolbar icon (SVG source + generated PNGs)
dist/                  Built, loadable extension (generated; git-ignored)
tests/                 Vitest suite
scripts/copy-assets.mjs  Copies static assets from src/ into dist/
tsconfig*.json           TypeScript config (editor/typecheck + build)
```

## Architecture

All of the risky logic — URL normalization, match semantics, and turning the
blocklist into blocking rules — lives in a single **Chrome-independent core
module** under `src/core/`. It contains no `chrome.*` calls, so it can be
unit-tested directly with no browser mocks. Everything Chrome-specific (the
service worker, popup, and block page) is a thin shell that reads storage, calls
the core module, and hands the result to the Chrome APIs.

The build is deliberately minimal: `tsc` compiles the TypeScript in `src/` to
`dist/`, then `scripts/copy-assets.mjs` copies the static files (manifest, HTML,
CSS, icons) alongside it. There is no bundler.

This "one seam" design is deliberate: matching bugs are exactly where a site
blocker fails, and concentrating that logic behind one tested boundary keeps it
correct while the shells stay simple.

## License

[MIT](LICENSE) © rana7cse
