# Graphing & Simulation Lab — 2026-06-16

## Run Context
- **Branch:** `night-run/2026-06-15-terminal-ui` (continuing). **Not pushed.**
- **Run type:** Feature build — interactive graphing + physics/quantum simulation (the TI-CX / Casio-CG50-tier gap).

## Executive Summary
- **What shipped:** four new zero-dep canvas tools — **2D Graphing Calculator**
  (multi-fn, trace, drag-pan, wheel-zoom), **3D Surface Grapher** (z=f(x,y),
  drag-rotate, height shading), **Physics Engine** (RK4 double pendulum, N-body
  velocity-Verlet, projectile+drag), and **Quantum 3D/4D Visualizer** (hydrogen
  |ψ|² orbital clouds, rotating tesseract, Gaussian wave-packet). Files:
  `grapher.js`, `simlab.js`; wired via `main.js`; panels in `index.html`; styles
  in `styles.css`. Built on the existing pure `math/plot.js` primitives
  (rotate3D/project3Dto2D/surfaceGrid/rotate4D/renderTesseract).
- **Verification:** `tests/graphlab.test.js` anchors the new math to closed-form
  physics — RK4 `y′=−y`→e⁻¹, SHO energy conservation, ⟨r⟩₁ₛ=1.5a₀, ⟨r⟩₂ₚ=5a₀,
  2p z-plane node. Live preview confirmed all four canvases render real content
  (curves, heat-mapped surface, pendulum, phase-colored orbital cloud).
- **Honest note:** the headless preview reports `window.innerWidth = 0`, so the
  canvases there measure ~0px and `mkCanvas` falls back to a default width; visual
  layout at full size needs a real browser. The rendering pipeline itself is
  verified (non-background pixels + color variety per canvas) and the math is
  CI-anchored.
- **Status:** typecheck clean · ESLint 0 · **42 suites / 1123 tests** pass · axe
  e2e audit of the new panels green.

## Changes Made
- **Code:** `grapher.js` (new — init2DGrapher, init3DSurface), `simlab.js` (new —
  initPhysicsEngine, initQuantum3D), `main.js` (lazy-import + init the four),
  `index.html` (4 panels), `styles.css` (graphing/sim block).
- **Tests:** `tests/graphlab.test.js` (new, +6) → 1123.
- **Docs:** SPECS benchmark (graphing 🟡→✅ + 3 new ✅ rows), README feature matrix,
  CHANGELOG `[Unreleased]`, count sync 1098→1123 across README/KANBAN/SPECS/DOCUMENTATION.

---

# Calculator Suite Expansion — 2026-06-16

## Run Context
- **Date/time:** 2026-06-16
- **Agent/model:** Claude Opus 4.8 (1M ctx)
- **Branch/checkpoint:** `night-run/2026-06-15-terminal-ui` (continuing). **Not pushed.**
- **Run type:** Feature build — comprehensive mini-calculator suite + docs.

## Executive Summary
- **What shipped:** a data-driven **Calculator Suite** — `suite.js` with a `PAGES`
  registry of **4 pages × 12 tiles = 48 mini-calculators exposing 257 operations**
  across all 25 engine domains, wired into `index.html`/`main.js`/`styles.css` and
  surfaced with tabs + per-tile operation dropdowns. Reactive (click/Enter/change),
  responsive (auto-fill grid), safe (no `eval`).
- **Fixes found while building:** the original draft's `Graph.mst` op passed
  `[u,v,w]` triples where the engine wants `{u,v,w}` objects → it silently returned
  weight 0; `polarToCartesian` returns `[x,y]` not `{x,y}` → `undefined`; the old
  `Rates` and `Electrical Eng.` tiles had defaults that produced `∞`
  (`effectiveRate(1000,2000)`). All corrected; both tiles redesigned with coherent
  inputs.
- **Docs:** authored `SPECS.md` (full 257-op catalog generated from `suiteManifest()`
  + an honest TI/Casio/Android benchmark), `DOCUMENTATION.md` (user manual /
  instructions), and extended `docs/ARCHITECTURE.md` with a Calculator Suite layer
  section. The three cross-link and are linked from the suite header in-app.
- **Current status:** runnable & green — typecheck clean, ESLint 0,
  **38 suites / 1098 tests** pass (incl. `tests/suite.test.js` exercising all 257
  ops on defaults: 0 throwers / NaN / ∞). axe-core e2e audit of the new shell
  passes.

## Changes Made
- **Code:** `suite.js` (new; registry + renderer + `suiteManifest`/count exports);
  `main.js` (already wired `initSuite`); `index.html` (suite section + Instructions/
  Specs/Architecture header links + usage hint); `styles.css` (suite-help/hint).
- **Tests:** `tests/suite.test.js` (new; registry shape + renderer + every-op-runs) → 1098.
- **Docs:** `SPECS.md` (new), `DOCUMENTATION.md` (new), `docs/ARCHITECTURE.md`
  (suite layer), CHANGELOG `[Unreleased]`, count sync 1093→1098 (README/KANBAN/SPECS/DOCUMENTATION).

## Verification Performed
- `npx tsc --noEmit` clean · `npx eslint suite.js tests/suite.test.js` 0 errors ·
  `npm test` → 38/38 suites, **1098/1098**.
- Live preview probe across all 4 tabs / 48 tiles / 257 ops: 0 failures
  (no `⚠`, NaN, undefined, or unintended ∞ on defaults). Graph ops verified against
  hand-computed values (MST=10, Dijkstra 0→4=7, BFS order correct).

## Security & Safety
- No secrets; client-side only; no `eval` (Pratt parser + typed input parsers); no
  new deps. Branched (not `main`); no push/force/delete.

---

# Daily Repo Run Report — 2026-06-16

## Run Context
- **Date/time:** 2026-06-16, night-shift operator pass
- **Agent/model:** Claude Opus 4.8 (1M ctx), Solo Agentic Daily Repo 100-Point Loop
- **Repo/project:** Professional Calculator (vanilla ES-module scientific compute engine)
- **Branch/checkpoint:** `night-run/2026-06-15-terminal-ui` (4 prior commits ahead of `main` @ 2b2fe3f; today's fix committed on top). **Not pushed.**
- **Run type:** Build/Fix/Improve — safe queued P2/P3 items

## Executive Summary
- **What improved:** three correctness/UX fixes from the prior queue — `tTestTwoSample` & `chiSquareGoF` now throw clear `RangeError`s on degenerate input instead of NaN/Infinity; the REPL keeps a failed expression editable. +2 regression tests.
- **What still matters:** bigger queued P2s remain (stats upper-tail precision, AST caching, PWA, `<dialog>` fallback); the branch is still unmerged/unpushed.
- **Current status:** runnable & green — typecheck clean, ESLint 0, **37 suites / 1093 tests** pass.

## Changes Made
- **Code:** `math/stats.js` (two-sample t-test `n≥2` guard; `chiSquareGoF` positive-expected guard); `repl.js` (clear input only on success).
- **Tests:** `tests/math/hypothesis.test.js` (+2 regression tests) → 1093.
- **Docs:** CHANGELOG `[Unreleased]`; count sync 1091→1093 (README/KANBAN/AUDIT/index.html); this handoff.
- **Config/deploy / Deleted:** none.

## Verification Performed
- `npm run typecheck` clean · `npm run lint` 0 errors · `npm test` → 37/37 suites, **1093/1093**.
- New guards verified by their regression tests; REPL change covered by existing `repl.test.js` (still green).

## Security & Safety
- No secrets; client-side only; no `eval`; no new deps. Branched (not `main`); no push/force/delete. Rollback intact (`main` @ 2b2fe3f).

## Issues Found (carried forward — none new this pass)
| Severity | Issue | Next action |
|---|---|---|
| P2 | Stats upper-tail p-values via `1−CDF` lose precision | survival forms (`upperGammaQ`/`betaInc`) — shifts test baselines; do **attended** |
| P2 | No AST caching | memoize `parse(src)` |
| P2 | No PWA (manifest/SW) | add manifest + service worker |
| P2 | `<dialog>` browser floor (FF98/Safari 15.4) | lightweight modal fallback |
| P3 | global listener teardown; `eigvals` complex surfacing | minor |
| P3 | version bump/tag **3.26.0** | after merge |

## 100-Point Score
- **Fixed this run:** 3 (Welch guard · χ² guard · REPL clear-on-error) + 2 tests + count sync. **Queued:** 6. **No open P0/P1.** Core stability + agent safety: strong.

## Morning Handoff
- **Start here:** review + **push/merge `night-run/2026-06-15-terminal-ui` → `main`** and tag **3.26.0** (now 5 commits of verified work waiting).
- **Highest-leverage next move:** merge & tag; then the stats upper-tail precision fix (attended — it shifts p-value baselines).
- **Do not touch / caution:** `math/` is closed-form-test-anchored — run `npm test` before any refactor. The Proprietary LICENSE is intentional.

---

# Daily Repo Run Report — 2026-06-15 (previous run)

## Run Context
- **Date/time:** 2026-06-15, evening shift (combined Build/Fix/Improve + Verify/Polish/Handoff)
- **Agent/model:** Claude Opus 4.8 (1M context), Solo Agentic Daily Repo 100-Point Loop
- **Repo/project:** Professional Calculator — zero-dependency scientific compute engine (vanilla ES modules, no build step)
- **Branch/checkpoint:** `night-run/2026-06-15-terminal-ui` (off `main` @ 2b2fe3f). Work committed atomically; **not pushed** (push is human-gated).
- **Run type:** full pass — audit → fix → UI rebuild → verify → checkpoint → handoff

## Executive Summary
- **What improved:** the front-end went from a 4-function-calculator face to a **scientific compute terminal** (Expression Engine hero + live Linear Algebra Lab + runnable capability palette + STEM/History panels); a real numerical bug was fixed; flatten-refactor leftovers (Dependabot, CI trigger) and stale MIT/test-count docs were repaired.
- **What still matters:** stats upper-tail p-value precision (P2), a few small app-layer leaks/UX nits (P3), no PWA/offline (P2), `<dialog>` browser-floor (P2), version bump/tag pending.
- **Current repo status:** **runnable & green** — `tsc --strict` clean, ESLint 0 errors, **37 suites / 1091 tests pass**, live preview verified computing correctly. Engine + 1091-test safety net fully intact.

## Changes Made
- **Code:** `math/stats.js` (log-space `binomialPmf`, drop now-unused `combinations` import); `lab.js` (new — palette + Matrix Lab); `main.js` (wire palette/lab + live top-bar stats from `CAPABILITIES`).
- **UI:** `index.html` (rebuilt shell, all engine/test DOM hooks + ARIA preserved), `styles.css` (rebuilt dark terminal design system, responsive + reduced-motion/contrast + light fallback).
- **Tests:** `tests/math/stats.test.js` (+1 regression: `binomialPmf(515,1030,0.5)` stays finite ≈ 0.0249; CDF finite ≤ 1).
- **Docs:** `CHANGELOG.md` ([Unreleased] entry), `README.md`/`KANBAN.md`/`docs/AUDIT.md` (count + license-claim corrections), this `HANDOFF.md`.
- **Config/deploy:** `.github/dependabot.yml` (`/Professional Calculator` → `/`), `.github/workflows/ci.yml` (push branches `master,scientific-engine` → `main`).
- **Deleted/quarantined:** none. (One throwaway test `tests/_axe_debug.test.js` was created and removed within the session — not committed.)

## Verification Performed
- **Install/run/build:** no build step; `npm run serve` static host; live preview confirmed loading.
- **Tests/lint/typecheck:** `npm test` → 37/37 suites, 1091/1091 tests; `npm run lint` → 0 errors; `npm run typecheck` → clean. Re-run after every change set.
- **Manual smoke (live preview):** Euler `e^(iπ)=−1`, `∫cos x dx = sin x + C`, `Γ(½)=1.77245…`, `nCr(52,5)=2,598,960`, `fib(80)`, and Matrix Lab eigenvalues of `[[0,−1],[1,0]] → 0+1i, 0−1i`.
- **Browser/console:** zero console errors on load; `__sciEngine` + `__calculator` present.
- **Accessibility:** e2e axe-core audit (run against the rebuilt `index.html`) passes — **0 violations**. (Fixed an axe-core/jsdom selector crash by giving palette chips unique ids; not a real WCAG issue.)
- **Deploy/static hosting:** N/A this run (GitHub Pages publish is human-gated).

## Security & Safety
- **Secrets reviewed:** none in the repo; client-side only, no `localStorage`, no `eval`/`Function`. All DOM writes use `textContent`/`createElement` (one `innerHTML` is a static literal). No injection surface introduced by `lab.js`.
- **Auth/data/privacy:** N/A (no backend, no DB, no user data, no network at runtime).
- **Dependency/package risk:** no new runtime deps (still **0**); no dependency changes.
- **Destructive actions avoided:** branched instead of committing to `main`; no force-push, no history rewrite, no push, no deletes. Rollback point preserved (`main` @ 2b2fe3f untouched).

## Issues Found
| Severity | Issue | Evidence | Recommended next action |
|---|---|---|---|
| P2 | Stats upper-tail p-values lose precision via `1 − CDF` | `stats.js:351,416,433,455` | Use `upperGammaQ`/`betaInc` survival forms (touches test baselines) |
| P2 | `chiSquareGoF` ÷0 on zero expected cell; Welch t-test → NaN at n=1 | `stats.js:430,401` | Throw explicit errors instead of Infinity/NaN |
| P2 | No AST caching → `compute()` re-parses every call | `parser.js` | Memoize `parse(src)` (big win for plotting/sweeps) |
| P2 | No PWA: no manifest/service worker → not installable, not reliably offline | (absent) | Add `manifest.webmanifest` + SW precaching the dynamic-import chunks |
| P2 | `<dialog>` help raises browser floor to FF98 / Safari 15.4 | `view.js:133`, `index.html` | Add a lightweight modal fallback / dialog polyfill |
| P3 | REPL `eigvals` drops imaginary part | `parser.js:776` | Surface complex (Matrix Lab already does) or add `eigvalsComplex` |
| P3 | Global listeners never removed (STEM arrow-keys, beforeunload, clear-history) | `main.js:152,74,79` | Track + remove in a teardown path |
| P3 | REPL clears input on parse error; ↓-at-newest off-by-one | `repl.js:101,151` | Only clear on success; clamp recall index |
| P3 | Version not bumped; Francis-QR/e2e work (2b2fe3f) never changelogged | git `2b2fe3f` | Tag **3.26.0** after review |

## 100-Point Score (truthful, not inflated)
- **Checked:** ~78 of 100 applicable this session; ~16 N/A (full-stack/API/DB/auth — Domain 6 + parts of 7, none present); ~6 not exercised.
- **Passed:** ~62 · **Fixed this run:** 9 (binomialPmf, dependabot, CI trigger, 2× MIT doc rows, 4× count drift, UI hero rebuild) · **Queued:** 9 (table above) · **N/A:** ~16 · **Blocked:** 0.
- Core Stability (P0/P1): **strong** (build/run/test/deploy-path all green; no P0/P1 open). Agent Safety: **strong** (rollback branch, no secrets, no destructive ops). Repo Clarity: **improved** (changelog + handoff + count sync). Shipping Readiness: **high** for the demo path.

## Morning Handoff
- **Start here:** check out `night-run/2026-06-15-terminal-ui`, open the live preview (the new terminal UI), click a few palette chips + a Matrix Lab op. When satisfied, **merge/push to `main`** (push was intentionally left to you).
- **Highest-leverage next move:** build a **Quantum Lab panel** on the *existing* `math/quantum.js` + `circuit.js` — real gate-model circuit simulation (qubits, gates, Bell/GHZ, Bloch) in-browser, zero new deps. (Directly serves the "quantum" goal without the Eshkol/macOS dependency.) Alternatively, the stats upper-tail precision fix (P2).
- **Do not touch / caution:** the `math/` modules are closed-form-test-anchored — don't refactor without running `npm test`. The **Proprietary / All-Rights-Reserved LICENSE is intentional** — do not revert to MIT. No secrets exist; keep it that way.
- **Next 1–5 actions (ranked):**
  1. Review + push the branch; tag **3.26.0**.
  2. Quantum Lab panel (existing engine) — biggest "wow", zero risk.
  3. Stats survival-function precision fix (P2) + `chiSquareGoF`/Welch guards.
  4. PWA manifest + service worker (installable/offline).
  5. `<dialog>` fallback to lower the browser floor; small app-layer listener-leak cleanup.
