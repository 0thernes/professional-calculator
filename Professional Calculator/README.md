# Professional Calculator

A keyboard-accessible calculator built with vanilla ES modules — no framework, no build step required. Math logic is a pure, fully-tested module; the DOM layer is kept deliberately dumb.

## Architecture

The app is split into focused ES modules so logic can be tested in isolation from the DOM:

| Module | Responsibility |
|---|---|
| [`engine.js`](engine.js) | Pure arithmetic, formatting, and input rules. No DOM, no side effects. |
| [`state.js`](state.js) | State machine with an enforced transition table. |
| [`history.js`](history.js) | `CircularBuffer` (O(1)) + undo/redo stacks + completed-calculation log. |
| [`view.js`](view.js) | All DOM mutation: displays, error rendering, sidebar, SR announcer. |
| [`controller.js`](controller.js) | Orchestrates engine + state + history + view; input dispatch. |
| [`main.js`](main.js) | Bootstrap; exposes a frozen `window.__calculator` surface. |

`script_Version5.js` is a one-line shim that re-exports `main.js` for any legacy `<script src>` reference.

## Features

- Full keyboard support (digits, operators, `Enter`/`=`, `Backspace`, `Esc`, `%`, `Ctrl+N`)
- Undo / redo — `Ctrl+Z` / `Ctrl+U` to undo, `Ctrl+Y` / `Ctrl+Shift+Z` to redo
- History sidebar with click-to-restore
- Accessibility: `<output>` display, single ARIA live region, error-type classification, reduced-motion / high-contrast / dark-mode support
- Type-checked via JSDoc + `tsconfig.json` (no `.ts` files, no build)

## Develop

ES modules require HTTP (not `file://`):

```bash
npm install
npm run serve        # local static server
npm test             # Jest suite (~70 tests)
npm run test:coverage
npm run typecheck    # tsc --noEmit against JSDoc types
```

> Note: the project lives under a path containing brackets. Some Node tooling
> mishandles `[` / `]` in the working directory — if a command fails with a
> path error, run it from a non-bracketed copy or via a symlink.
