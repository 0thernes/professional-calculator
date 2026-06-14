# Roadmap

Phased plan from MVP to a full scientific workbench. Each phase is shippable on
its own and gated by the same quality bar: closed-form-anchored tests, strict
type-check, and green CI.

---

## Phase 0 — Foundation ✅ *(shipped)*

Modular MVC calculator, history/undo-redo, accessibility, Jest + TypeScript
checking, CI. The base the engine is built on.

## Phase 1 — Scientific engine ✅ *(shipped, this milestone)*

- Expression engine (tokenizer → Pratt → evaluator), no `eval`
- Complex field, exact rationals, special functions, CODATA constants
- Linear algebra: LU/QR/eigen/solve/inv/rank
- Calculus: derivative, adaptive integration, root finding, ODEs
- Statistics + probability distributions
- Dimensional analysis (SI units)
- Quantitative finance
- Scientific REPL panel + benchmark harness
- Full documentation suite + 500-point audit

**Exit criteria met:** 403 tests green, tsc clean, in-browser verified.

## Phase 2 — First-class structured types *(next)*

Bring matrices, vectors, and units **into the expression grammar** so the REPL
speaks them natively:

- Matrix/vector literals: `[[1,2],[3,4]]`, `[1,2,3]`
- Linear-algebra functions in the parser: `det(A)`, `inv(A)`, `eig(A)`, `A*B`
- Unit-aware arithmetic: `3 kg * 9.8 m/s^2 → 29.4 N`
- Result type tagging (scalar / complex / matrix / quantity) in the REPL log

## Phase 3 — Visualization

- Function plotting (`plot(sin(x), -pi, pi)`) on a canvas
- Data/scatter plots with regression overlay
- Complex-plane and vector-field views
- Export plots as SVG/PNG

## Phase 4 — Precision & performance

- Arbitrary-precision float backend behind a mode flag
- Francis double-shift QR for robust general eigenproblems
- Sparse storage + iterative solvers (CG, GMRES)
- Web Worker offload so large solves don't block the UI

## Phase 5 — Symbolic (CAS-lite)

- Symbolic differentiation of parsed expressions
- Basic simplification and polynomial algebra
- Exact symbolic constants in results where possible

## Phase 6 — Platform

- Session persistence + shareable transcripts (Markdown/LaTeX export)
- Installable PWA / offline
- Plugin API for user-defined functions and unit systems

---

## Guiding principles

1. **Correctness before features** — no routine ships without a closed-form test.
2. **Zero runtime dependencies** stays a hard constraint as long as feasible.
3. **Honest scope** — document precisely what each method does and doesn't
   guarantee (see README → *Scope & limitations*).
4. **Progressive enhancement** — the core calculator must keep working even if
   advanced layers fail to load.
