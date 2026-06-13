# Project Board (Kanban)

A snapshot of delivery state. Columns flow left → right: **Backlog → Ready →
In Progress → Review → Done**. Items are sized S / M / L.

> This is a static, version-controlled board. For live tracking it maps cleanly
> onto GitHub Projects (each column = a Project status, each card = an issue).

---

## ✅ Done

### Epic: Core engine
- ✅ **Complex number field** (S) — arithmetic, transcendentals, polar
- ✅ **Exact rational arithmetic** (S) — BigInt, lowest terms
- ✅ **Special functions** (M) — gamma, erf (Chebyshev ~1e-15), incomplete γ/β
- ✅ **CODATA constants** (S)
- ✅ **Expression engine** (L) — tokenizer → Pratt parser → complex evaluator

### Epic: Applied math
- ✅ **Linear algebra** (L) — LU, det, solve, inv, rank, QR, eigen (Jacobi + QR)
- ✅ **Numerical calculus** (L) — derivative, adaptive ∫, Brent, RK4/RKF45
- ✅ **Statistics & distributions** (M) — descriptive, regression, normal/t/χ²/F/binomial/Poisson
- ✅ **Dimensional analysis** (M) — SI units, conversion, temperature scales
- ✅ **Quantitative finance** (M) — TVM, NPV, IRR, amortization, Black–Scholes

### Epic: Product
- ✅ **MVC button calculator** (M) — engine/state/view/controller/history split
- ✅ **History sidebar + undo/redo** (M)
- ✅ **Scientific REPL panel** (M) — expression input, variables, `ans`, history
- ✅ **Accessibility** (M) — ARIA live regions, keyboard, reduced-motion, contrast

### Epic: Quality & ops
- ✅ **Jest suite** (L) — 403 tests, closed-form anchored
- ✅ **Strict TypeScript checking** (M) — `checkJs`, zero errors
- ✅ **Benchmark harness** (S) — throughput + O(n³) scaling
- ✅ **Documentation suite** (L) — README, ARCHITECTURE, DATA_MODEL, COMPLEXITY
- ✅ **CI/CD pipeline** (M) — GitHub Actions matrix
- ✅ **500-point audit** (L)

---

## 🔍 Review

- 🔍 Open PR: `scientific-engine` → `master` (full engine + docs + CI)

---

## 🏗️ In Progress

- _(none — engine milestone complete)_

### Epic: STEM suite (v3.0.0)
- ✅ **Quantum computing simulator** (L) — state vectors, gates, circuits, measurement, Bloch
- ✅ **Physics & cosmology engine** (M) — quantum/atomic, relativity, cosmology
- ✅ **Quant finance extensions** (M) — Greeks, CRR binomial tree, seeded Monte Carlo
- ✅ **Visualization layer** (M) — 2D/3D/parametric/surface + 4D tesseract generators
- ✅ **STEM Lab paged UI** (M) — 8 cyclable live-SVG visualizations
- ✅ **ESLint config** (S) — flat config wired into CI

---

## 📋 Ready (next up)

- ⬜ **Matrix expressions in the REPL** (M) — parse `[[1,2],[3,4]]` literals and
  expose `det`, `inv`, `eig` as first-class functions in the parser
- ⬜ **Unit-aware expressions** (M) — `3 kg * 9.8 m/s^2` in the REPL grammar
- ⬜ **Quantum circuit builder** (M) — interactive gate-placement UI feeding `runCircuit`

---

## 🧊 Backlog

- ⬜ Arbitrary-precision floats (decimal.js-style) behind a flag (L)
- ⬜ Symbolic differentiation (CAS-lite) (L)
- ⬜ Francis double-shift QR for adversarial non-normal eigenproblems (M)
- ⬜ Sparse matrix storage + iterative solvers (CG, GMRES) (L)
- ⬜ Web Worker offload for large matrices / many-qubit sims (M)
- ⬜ Session persistence (localStorage) for REPL history (S)
- ⬜ Export REPL transcript / plots to Markdown/LaTeX/SVG (S)
- ⬜ Prettier autoformatting (S)
- ⬜ Playwright e2e + axe-core accessibility tests (M)

---

## Flow metrics (cumulative)

| Metric | Value |
|---|---|
| Epics delivered | 5 (core, applied, product, quality, STEM suite) |
| Modules shipped | 16 source + 6 docs |
| Tests | 543 (100% pass) |
| Cycle: idea → tested module | continuous (test-anchored each step) |
