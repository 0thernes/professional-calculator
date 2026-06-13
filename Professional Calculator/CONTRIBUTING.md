# Contributing

Thanks for your interest. This project values **auditable correctness** above
everything — a new numerical routine is not done until it is anchored to a
closed-form value or invariant in the test suite.

---

## Ground rules

1. **Every numerical function ships with a closed-form test.** Compare to an
   exact value (`Γ(1/2)=√π`), an identity (`sin²+cos²=1`), or an invariant
   (`det(AB)=det(A)det(B)`, `A·inv(A)=I`). "It looks right" is not acceptable.
2. **No runtime dependencies.** Dev dependencies (jest, typescript) only.
3. **Strict types.** `npm run typecheck` must be clean. JSDoc all exports.
4. **No `eval`/`Function`** anywhere in the engine.
5. **Pure core.** Nothing in `math/` may touch the DOM, globals, or I/O.

---

## Development workflow

```bash
npm install
npm test               # Jest suite
npm run test:watch     # TDD loop
npm run test:coverage  # coverage + thresholds (85% lines / 80% branches)
npm run typecheck      # tsc --noEmit (strict)
npm run bench          # performance sanity
npm run serve          # local server for the UI
```

### Adding a math module

1. Create `math/yourmodule.js` with `// @ts-check` and JSDoc on every export.
2. Depend only on core modules (`complex`, `rational`, `special`, `constants`).
3. Add `tests/math/yourmodule.test.js` mirroring the source path.
4. Re-export it from `math/index.js` and add a row to `CAPABILITIES`.
5. Add a complexity row to [docs/COMPLEXITY.md](docs/COMPLEXITY.md).
6. Run `npm test && npm run typecheck`.

### Coding conventions

- 4-space indentation, semicolons, single quotes.
- Prefer pure functions returning new values; never mutate inputs.
- Name numerical algorithms by their method in a comment (e.g. "Householder",
  "Lentz continued fraction") and cite accuracy where relevant.
- Throw typed errors (`RangeError`/`TypeError`/`SyntaxError`/`ReferenceError`)
  with actionable messages.

---

## Commit & PR conventions

- Conventional-commits style subject: `feat(math): …`, `fix(parser): …`,
  `docs: …`, `test: …`, `chore: …`.
- Reference the closed-form anchors you added in the body.
- Keep PRs scoped to one concern. CI (typecheck + tests + coverage) must pass.
- Branch off `master`; never commit generated `node_modules` or coverage.

---

## The bracketed-path gotcha (local dev)

This repo may live under a directory containing brackets (`[…]`). Some Node
tooling treats `[`/`]` as glob metacharacters in the working directory. Two
mitigations are already in place / recommended:

- The Jest config uses bracket-safe `**/` globs (don't revert them to
  `<rootDir>/…`).
- For local runs, create a bracket-free junction and run tooling through it:

  ```powershell
  cmd /c mklink /J C:\temp\profcalc "Z:\[Vibe Coded (AI)]\CLAUDECODE\Professional Calculator"
  cd C:\temp\profcalc && npm test
  ```

---

## Reporting issues

Open a GitHub issue using the templates in `.github/ISSUE_TEMPLATE/`. For a
numerical bug, please include the input, the result you got, the result you
expected, and the source (textbook/reference) for the expected value.
