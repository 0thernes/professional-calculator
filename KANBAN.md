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
- ✅ **Jest suite** (L) — 1079 tests, closed-form anchored
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
- ✅ **STEM Lab paged UI** (M) — 11 cyclable live-SVG visualizations
- ✅ **ESLint config** (S) — flat config wired into CI

### Epic: CAS & advanced grammar (v3.1–3.4)
- ✅ **Symbolic differentiation** (L) — full rules + derivative table, re-parseable
- ✅ **Round-trippable Unicode operators** (S) — `× · ÷ −` accepted as input
- ✅ **Matrix/vector literals in the grammar** (L) — `[[..]]`, det/inv/solve/eig in the REPL
- ✅ **Symbolic integration** (L) — power rule, antiderivative table, linear substitution
- ✅ **Quantum circuit builder** (M) — fluent `QuantumCircuit` over the simulator

### Epic: numerical-library expansion (v3.5–3.16)
- ✅ **Number theory** (M) — Miller–Rabin, factorization, modular arithmetic, totient, Fibonacci
- ✅ **Inferential statistics** (M) — t/z/χ²/ANOVA tests + confidence intervals
- ✅ **Signal processing** (L) — FFT (radix-2 + Bluestein), convolution, windows, spectra
- ✅ **Interpolation & curve fitting** (M) — spline, Lagrange/Newton, `polyfit`
- ✅ **Numerical optimization** (M) — golden-section, Nelder–Mead, gradient descent
- ✅ **Vector geometry** (S) — dot/cross/projection/reflection, 2D/3D rotation
- ✅ **Combinatorics** (M) — Catalan/Bell/Stirling/partitions/derangements (exact BigInt)
- ✅ **Matrix decompositions** (L) — SVD (Jacobi), Cholesky, pseudoinverse, least squares
- ✅ **Coordinate systems** (S) — polar/spherical/cylindrical ↔ Cartesian
- ✅ **Seeded RNG & sampling** (M) — distributions + shuffle/sample, reproducible
- ✅ **Combinatorics in the REPL** (S) — `catalan`/`bell`/`partitions`/… scalar functions
- ✅ **FFT spectrum STEM page** (S) — surfaces `signal.js` visually
- ✅ **Property-based invariant tests** (M) — seeded randomized cross-module invariants
- ✅ **Graph algorithms** (M) — BFS/DFS, Dijkstra + shortest path, components, topo sort, MST
- ✅ **MST graph STEM page** (S) — surfaces `graph.js` visually (Kruskal spanning tree)
- ✅ **Set & relation utilities** (S) — union/intersection/difference, subset/Jaccard, power set, product
- ✅ **Base conversion & bit manipulation** (S) — base 2–36, bin/oct/hex, popcount, Hamming, Gray code
- ✅ **Unit-aware expressions** (M) — `3 kg · 9.8 m/s²` evaluated with dimensional analysis (`unitexpr.js`)
- ✅ **Cubic-spline STEM page** (S) — surfaces `interpolate.js` (spline through points)
- ✅ **Bit functions in the REPL** (S) — `popcount`/`bitlength`/`gray`/`igray`/`hamming`
- ✅ **Symbolic simplify — collect like terms** (S) — `x+x→2x`, `x·x→x²`

---

## 📋 Ready (next up)

- ⬜ **Interactive circuit UI** (M) — drag/place gates onto the QuantumCircuit model
- ⬜ **Symbolic simplification: trig identities** (M) — `sin²+cos²→1`, angle-sum, etc.

---

## 🧊 Backlog

- ⬜ Arbitrary-precision floats (decimal.js-style) behind a flag (L)
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
| Epics delivered | 7 (core, applied, product, quality, STEM suite, CAS & grammar, numerical-library expansion) |
| Modules shipped | 29 math + 6 app + 8 docs |
| Tests | 1079 across 36 suites (100% pass) |
| Releases | v1.0 → v3.25.0, merged via PRs #1–#35 |
| Cycle: idea → tested module | continuous (test-anchored each step) |
