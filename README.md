# x-keep-focus

A minimal [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/) Chrome extension that blocks distracting sites so you can stay focused. Keep a personal blocklist, flip a single toggle to enter "focus mode," and any listed site redirects to a calm block page instead of pulling you in.

> Status: in active development. See the [issues](https://github.com/rana7cse/x-keep-focus/issues) for the current roadmap.

## Features

- **One-toggle focus mode** — a single global on/off switch in the popup.
- **Simple blocklist** — add the current site in one click or type a URL; delete per row.
- **Whole-domain or host-only** matching per entry (subdomains included by default).
- **Calm block page** — a fixed encouraging headline, a rotating focus line, and the blocked domain; auto light/dark.
- **Syncs** across your signed-in Chrome browsers via `chrome.storage.sync`.
- **No build step, no runtime dependencies** — plain HTML/CSS/JS.

## Install (load unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select this repository folder.
4. The target icon appears to the right of the address bar; click it to open the popup.

To pick up local changes, hit the reload ↻ button on the extension card in `chrome://extensions`.

## Development

Requires [Node.js](https://nodejs.org/) 20+. The extension itself ships no dependencies; Node is only used for the test suite.

```bash
npm install      # install dev dependencies (Vitest)
npm test         # run the test suite once
npm run test:watch  # re-run on change
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and [CODING_STANDARDS.md](CODING_STANDARDS.md) for the conventions.

## Project structure

```
manifest.json        MV3 manifest (extension entry point)
popup.html/.css/.js  Toolbar popup: toggle + blocklist management
block.html/.css/.js  The page shown when a site is blocked
background.js        Service worker: builds & applies blocking rules
src/                 Chrome-independent core logic (the tested seam)
icons/               Toolbar icon (SVG source + generated PNGs)
tests/               Vitest suite
```

## Architecture

All of the risky logic — URL normalization, match semantics, and turning the
blocklist into blocking rules — lives in a single **Chrome-independent core
module** under `src/`. It contains no `chrome.*` calls, so it can be unit-tested
directly with no browser mocks. Everything Chrome-specific (the service worker,
popup, and block page) is a thin shell that reads storage, calls the core module,
and hands the result to the Chrome APIs.

This "one seam" design is deliberate: matching bugs are exactly where a site
blocker fails, and concentrating that logic behind one tested boundary keeps it
correct while the shells stay simple.

## License

MIT — see [LICENSE](LICENSE) if present, otherwise all rights reserved by the author.
