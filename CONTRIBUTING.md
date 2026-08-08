# Contributing

Thanks for helping on x-keep-focus. This project is small and deliberately
simple — the goal of these notes is to keep it that way.

Read [CODING_STANDARDS.md](CODING_STANDARDS.md) first; it defines how code should
be written. This file covers the _workflow_ around it.

## How work is organised

Work is tracked as **GitHub Issues**, sliced into small, self-contained tickets
that each cut a complete path through the extension. A short spec issue describes
the whole feature; individual tickets hang off it with `Blocked by` dependencies.

- Tickets labelled **`ready-for-agent`** are fully specified and ready to pick up.
- A ticket can start only when the issues it is **Blocked by** are closed.
- Pick from the _frontier_ — tickets whose blockers are all done.

See [`docs/agents/`](docs/agents/) for the issue-tracker, triage-label, and
domain-doc conventions this repo follows.

## Development setup

Requires Node.js 20+.

```bash
npm install        # dev dependencies only (TypeScript, Vitest, ESLint, Prettier)
npm run build      # compile src/ -> dist/
npm run typecheck  # type-check without emitting
npm run lint       # ESLint
npm run lint:fix   # ESLint, auto-fixing what it can
npm run format     # rewrite files to Prettier style
npm run format:check # verify Prettier formatting (what CI runs)
npm test           # run the suite
```

The extension is written in TypeScript and compiled to `dist/`. Load the
**`dist/`** folder unpacked from `chrome://extensions` (see the
[README](README.md)); after changing source, re-run `npm run build` and hit the
reload button to pick up changes.

## Making a change

1. **Branch** off `main`. Name it after the ticket, e.g. `ticket-3-core-module`.
2. **Work test-first at the core seam** where practical: put logic in `src/core/`,
   cover it in `tests/`, keep the Chrome shells thin.
3. **Run `npm run typecheck`, `npm run lint`, `npm run format:check`, and
   `npm test`** — all must be green (this is exactly what CI enforces). Use
   `npm run lint:fix` and `npm run format` to fix issues automatically.
4. For UI or blocking changes, **verify manually in Chrome**: `npm run build`,
   load `dist/` unpacked (or reload it), and exercise the behaviour (the popup, a
   blocked navigation, the block page). Note what you checked in the PR.
5. **Commit** using the conventional-commit style from the coding standards, and
   reference the ticket (`Closes #NN`).

## Pull requests

- Open a PR against `main`; keep it scoped to a single ticket.
- In the description, summarise what the ticket delivers, note how you verified
  it (tests + manual steps), and link the issue it closes.
- **CI must be green.** Every PR runs typecheck, ESLint, Prettier's
  `--check`, and the full test suite; a failure in any of them fails the PR.
- Also make sure there are no `chrome://extensions` load errors after
  `npm run build`.
- A two-axis review (standards + spec) is run on the change before merge.

## Reporting issues

Open a GitHub issue describing the problem, the steps to reproduce, and what you
expected. New, unscoped reports start as `needs-triage`.
