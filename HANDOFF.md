# Daily Repo Run Report

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
