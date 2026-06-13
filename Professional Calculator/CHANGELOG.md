# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- First-class matrix/vector literals in the expression grammar *(planned, Phase 2)*

## [2.0.0] — Scientific engine

A ground-up scientific computing engine added on top of the calculator.

### Added
- **Expression engine** (`math/parser.js`): tokenizer → Pratt parser → AST →
  complex-field evaluator. Precedence, right-associative `^`, implicit
  multiplication, postfix factorial, `|abs|` bars, variables, functions. No
  `eval`/`Function`.
- **Complex numbers** (`math/complex.js`): full field with transcendentals,
  inverse trig, hyperbolic, polar form; Smith division.
- **Exact rationals** (`math/rational.js`): BigInt `n/d` in lowest terms.
- **Special functions** (`math/special.js`): Lanczos gamma/lgamma, Chebyshev
  erf/erfc (~1e-15), beta, regularized incomplete gamma/beta, nCr/nPr.
- **CODATA-2018 constants** (`math/constants.js`).
- **Linear algebra** (`math/matrix.js`): LU (partial pivot), det, solve, inverse,
  rank, norms, Householder QR, symmetric eigensolver (Jacobi + eigenvectors),
  general eigenvalues (Hessenberg + shifted QR, complex pairs).
- **Numerical calculus** (`math/calculus.js`): Richardson derivative, adaptive
  Simpson + Gauss–Legendre integration, bisection/Newton/secant/Brent roots,
  RK4 + adaptive RKF45 ODE solvers.
- **Statistics** (`math/stats.js`): descriptive stats, regression, normal/t/χ²/F/
  exponential/binomial/Poisson distributions; Acklam inverse-normal.
- **Units** (`math/units.js`): 7-dimension SI dimensional analysis, conversion,
  affine temperature scales.
- **Finance** (`math/finance.js`): TVM, NPV, IRR, amortization, Black–Scholes, CAGR.
- **Engine facade** (`math/index.js`) + capability manifest.
- **Scientific REPL panel** (`repl.js`) wired into the UI: expression input,
  variable assignment, `ans`, ↑/↓ history, error-tolerant log.
- **Benchmark harness** (`bench/bench.js`, `npm run bench`).
- **Documentation suite**: README rewrite, `docs/ARCHITECTURE.md`,
  `docs/DATA_MODEL.md`, `docs/COMPLEXITY.md`, `docs/AUDIT.md`, `KANBAN.md`,
  `ROADMAP.md`, `CONTRIBUTING.md`, `SECURITY.md`.
- **CI/CD**: GitHub Actions matrix (typecheck + test + coverage), issue/PR
  templates, Dependabot.
- 286 new tests (403 total), all closed-form-anchored.

### Changed
- Renamed download-artifact filenames to canonical names:
  `index_Version3.html → index.html`, `style_Version4.css → styles.css`.
- Upgraded `erf`/`erfc` from the 7-digit minimax polynomial to the 24-term
  Chebyshev approximation (~1e-15) so the distribution layer is accurate to
  full double precision.

### Fixed
- Stylesheet `href` pointed at a non-existent `style.css` — the served page was
  unstyled. Now references `styles.css`.
- Affine temperature conversion used an incorrect `(value+offset)*factor` model;
  corrected to `SI = value·factor + shift` (so `−40 °C = −40 °F`).

### Removed
- Redundant `script_Version5.js` shim (HTML loads `main.js` directly).

## [1.0.1] — Test config & verification

### Fixed
- Jest `testMatch`/`collectCoverageFrom` rewritten as bracket-safe `**/` globs
  (the bracketed repo path was read as a glob character class → 0 matches).
- Switched coverage to the V8 provider (Istanbul instruments nothing under
  native ESM).
- Import `jest` from `@jest/globals` (not auto-injected under native ESM).
- `destroy` test now clicks a real button (previous `?.click()` on a missing
  node was a vacuous assertion).

### Added
- 16 branch-coverage tests (extended keyboard map, sidebar restore, error
  boundary, error auto-clear timer).

## [1.0.0] — Modular calculator

### Added
- ES-module refactor into `engine` / `state` / `history` / `view` / `controller`
  / `main` with a pure, testable core.
- History sidebar with click-to-restore and redo (`Ctrl+Y` / `Ctrl+Shift+Z`).
- Jest suite + strict `tsconfig` (`checkJs`).
- Initial Professional Calculator (4-function, keyboard-accessible, dark mode).

[Unreleased]: #unreleased
[2.0.0]: #200--scientific-engine
[1.0.1]: #101--test-config--verification
[1.0.0]: #100--modular-calculator
