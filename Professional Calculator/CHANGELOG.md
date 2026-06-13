# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Lint hygiene: removed dead code so `eslint .` reports **zero** problems
  (previously 2 warnings) — dropped the unused `constValue` helper and its now
  orphaned `evaluate` import from `symbolic.js`, and the unused `modInverseBig`
  import from `numtheory.test.js`. No behavioural change; 811 tests still green.

## [3.9.0] — Numerical optimization (minimization)

### Added
- **`math/optimize.js`** — function minimization (root finding already lives in
  `calculus.js`, so this is the complementary half):
  - `goldenSection` — golden-section search for a unimodal 1-D function on a
    bracket (derivative-free; tolerates a reversed bracket).
  - `minimizeNelderMead` — the Nelder–Mead downhill simplex
    (reflect/expand/contract/shrink) for multivariate derivative-free
    minimization.
  - `gradientDescent` — steepest descent with an Armijo backtracking line
    search; uses a supplied gradient, or a central-difference gradient (via
    `Calculus.gradient`) when passed `null`.
  - Each returns `{ x, fx, iterations }`. Exposed on the facade as `Optimize`;
    capability manifest row added.
- Version → 3.9.0.
- 12 new tests (811 total / 26 suites), closed-form anchored: `(x−2)² → 2`,
  `−sin` on [0,π] → π/2 (fx = −1), quartic min, the sphere → origin, a shifted
  bowl → (1,−2), the **Rosenbrock** banana → (1,1), a 3-D quadratic → its
  centre, gradient descent with analytic *and* numerical gradients, monotone
  objective decrease, and the at-the-minimum early stop.

## [3.8.0] — Interpolation & curve fitting

### Added
- **`math/interpolate.js`** — a new zero-dependency interpolation module:
  - `linearInterp` — piecewise-linear interpolation (clamps outside the range,
    NumPy-`interp` style).
  - `lagrange`/`lagrangeEval` — Lagrange interpolating polynomial.
  - `newton`/`dividedDifferences`/`newtonEval` — Newton divided-difference form.
  - `cubicSpline` — natural cubic spline (C² continuous; tridiagonal solve via
    the Thomas algorithm).
  - `polyfit` — least-squares polynomial fit via the normal equations, solved
    with the engine's LU `solve`; **ascending** coefficient vectors.
  - `polyval` — Horner evaluation of ascending coefficients.
  - Exposed on the facade as `Interpolate`; capability manifest row added.
- Version → 3.8.0.
- 22 new tests (799 total / 25 suites), closed-form anchored: interpolant exact
  at every node, parabola `y=x²` recovery, Newton ≡ Lagrange over a sweep, cubic
  spline exact on linear data + knot continuity, `polyfit` recovering exact
  quadratic `[1,2,3]` and cubic `[2,-1,0,½]` coefficients, degree-1 `polyfit`
  matching `Stats.linearRegression`, and small-residual fit on noisy data.

## [3.7.0] — Signal processing (DFT/FFT)

### Added
- **`math/signal.js`** — a new zero-dependency signal-processing module:
  - Forward/inverse DFT (`dft`/`idft`, exact O(N²) reference).
  - Fast `fft`/`ifft` for **any length**: iterative radix-2 Cooley–Tukey for
    power-of-two inputs, Bluestein chirp-z fallback otherwise (both O(N log N)).
  - `rfft` (real-input half-spectrum), `magnitude`, `phase`, `powerSpectrum`.
  - `convolve` and `crossCorrelate`/`autocorrelate` via the convolution theorem.
  - Analysis windows `hann`/`hamming`/`blackman` + `applyWindow`.
  - `frequencies` (NumPy-`fftfreq`-style bin → frequency mapping) and `nextPow2`.
  - Exposed on the facade as `Signal`; capability manifest row added.
- Version → 3.7.0.
- 30 new tests (777 total / 24 suites), anchored on closed-form transform pairs:
  impulse → flat spectrum, constant → single DC bin (= N), the 4-point DFT of
  [1,2,3,4] = [10, −2+2i, −2, −2−2i], `ifft(fft(x)) == x` (power-of-two and
  prime lengths), FFT == naive DFT for radix-2/Bluestein, linearity, Parseval's
  energy theorem, convolution `[1,2,3]∗[0,1,½] = [0,1,2.5,4,1.5]`, autocorrelation
  peak = signal energy, window endpoints/symmetry, and `fftfreq(8)`/`fftfreq(5)`
  layouts. (Also refreshed two stale "661 tests" mentions in the README prose.)

## [3.6.0] — Inferential statistics (hypothesis tests)

### Added
- **`math/stats.js`**: `tTestOneSample`, `tTestTwoSample` (Welch + pooled),
  `zTest`, `chiSquareGoF`, `anovaOneWay`, `pearsonTest`, `confidenceIntervalMean`,
  and `tQuantile` (inverse-t by bisection). Each test returns its statistic,
  degrees of freedom, and a p-value (built on the existing t/χ²/F/normal CDFs).
- Version → 3.6.0.
- 20 new tests (747 total / 23 suites), anchored on hand-computed statistics:
  one-sample t = 4.2426, Welch t = −1 with df = 8, z = 5/3, fair-die χ² = 1.0
  (df 5), ANOVA F = 3 (df 2,6), perfect-correlation r = 1, and the 95% CI of
  [1..5] (mean 3, margin 1.9632); plus invariants (wider CI at higher
  confidence, t* round-trips the t-CDF).

## [3.5.0] — Number theory

### Added
- **`math/numtheory.js`** — primality & modular arithmetic: deterministic
  Miller–Rabin `isPrime` (exact for all safe integers; BigInt `isPrimeBig`),
  `primeFactors`/`factorization`/`divisors`, `modPow`/`modInverse` (extended
  Euclid), `eulerTotient`, `fibonacci` (fast doubling, exact `fibonacciBig`),
  `nextPrime`, `gcd`/`lcm`, `isPerfectSquare`. BigInt internally for exactness.
- REPL functions: scalar `isprime/nextprime/modpow/modinv/totient/fib/lcm`;
  `factor(n)` and `divisors(n)` return column vectors.
- Facade exports `NumberTheory`; version → 3.5.0.
- 47 new tests (727 total / 22 suites): Mersenne prime 2³¹−1, Carmichael 561
  composite, RSA-style modular inverse, 360 = 2³·3²·5, perfect numbers
  (divisor sums), φ products, Fibonacci recurrence + `F(100)` exact.

## [3.4.0] — Quantum circuit builder

### Added
- **`math/circuit.js`** — `QuantumCircuit`, a fluent/chainable builder over the
  state-vector simulator: `new QuantumCircuit(2).h(0).cnot(0,1)`. Single-qubit
  gates (H/X/Y/Z/S/T + Rx/Ry/Rz/phase), multi-qubit (CNOT/CZ/SWAP/Toffoli),
  `run()`, `probabilities()`, `measureAll(samples)` (injectable RNG), `toKet()`,
  and an ASCII `diagram()`. Helpers `bell()` and `ghz(n)`.
- Facade exports `Circuit`; version → 3.4.0.
- 19 new tests (680 total): X/H/Bell/GHZ(3,4)/SWAP/Toffoli/rotations probability
  checks, probabilities sum to 1, correlated Bell measurement, diagram render.

## [3.3.0] — Symbolic integration

### Added
- **`integrate(node, x)`** in `math/symbolic.js`: a pattern-matching
  antiderivative engine — linearity, the power rule (incl. `∫x⁻¹ = ln x`), an
  antiderivative table (sin/cos/exp/sinh/cosh/tan/ln/sqrt), and the
  linear-substitution rule `∫f(a·x+b) dx = (1/a)·F(a·x+b)` (so `∫sin(2x)`,
  `∫exp(3x)`, `∫(2x+1)³`, `∫2ˣ` all work). Throws on integrands that need
  parts / partial fractions / non-elementary results — never a wrong answer.
- REPL `integrate(expr, x)` / `integral(expr, x)` commands (print `… + C`).
- 25 new tests (661 total): clean-form checks (`∫cos = sin`, `∫x³ = x⁴/4`,
  `∫(2x+1)³ = (2x+1)⁴/8`) **plus** fundamental-theorem verification —
  differentiating each antiderivative numerically recovers the integrand.
  Engine version → 3.3.0.

## [3.2.0] — Matrix/vector literals in the expression grammar

### Added
- **Matrix & vector literals** in the parser: `[[1,2],[3,4]]` (matrix),
  `[1,2,3]` (column vector); entries may be any scalar expression.
- **Matrix-aware evaluator** (`evaluateValue`): a `Complex | Matrix` value
  model that delegates pure-scalar subtrees to the proven scalar `evaluate`,
  so existing behaviour is untouched. Operators: matrix `+ - *`, scalar·matrix,
  matrix/scalar, integer matrix powers (incl. `^-1` = inverse), `|M|` = Frobenius
  norm. Functions: `det`, `inv`, `transpose`, `trace`, `rank`, `norm`,
  `identity`/`eye`, `zeros`, `solve(A,b)`, `eigvals(A)`.
- REPL now evaluates matrices (assign `A = [[..]]`, then `det(A)`, `A*inv(A)`,
  `solve(A,b)`, …) and pretty-prints them.
- 34 new tests (636 total) anchored on known results: `det([[1,2],[3,4]])=-2`,
  `[[1,2],[3,4]]·[[5,6],[7,8]]=[[19,22],[43,50]]`, `A·inv(A)=I`, solve a 2×2
  system, eigenvalues of a diagonal matrix; scalar back-compat verified.
  Engine version → 3.2.0.

## [3.1.0] — Symbolic differentiation (CAS-lite)

### Added
- **math/symbolic.js** — AST-based symbolic differentiation: sum/difference,
  product, quotient, power (constant exponent, constant base, and general f^g
  via logarithmic differentiation) and chain rules, with a derivative table
  for sin/cos/tan, exp/ln/log, sqrt, sinh/cosh/tanh, asin/acos/atan, log10/log2,
  plus `log(u, b)` / `root(u, n)` / `pow(a, b)` forms. Includes a conservative
  `simplify` (constant folding + identity removal incl. `x−x→0`, `x/x→1`,
  double-negation) and a precedence-correct `astToString`. Output is
  re-parseable, so derivatives compose (2nd, 3rd, … derivatives).
- **REPL** `diff(expr, x)` command (handles inner commas like `diff(log(x,2), x)`).
- **Parser** now accepts the Unicode math operators it pretty-prints and the
  keypad shows — `×` `·` `⋅` → `*`, `÷` → `/`, `−` → `-` — making engine output
  round-trippable as input.
- 50+ new tests, incl. numeric cross-checks of every symbolic derivative
  against a finite-difference derivative of the original (the full derivative
  table is now verified correct). Engine version → 3.1.0.

## [3.0.0] — STEM suite: quantum, physics, visualization

Adds whole new scientific domains and a live visual lab on top of the 2.0
engine. 140 new tests (543 total), all closed-form-anchored; lint + tsc + CI
green.

### Added
- **math/quantum.js** — state-vector quantum-computing simulator over the
  complex field: basis states, X/Y/Z/H/S/T gates, Rx/Ry/Rz/phase rotations,
  CNOT/CZ/SWAP/Toffoli, Born-rule measurement with injectable-RNG collapse,
  Bloch-sphere coordinates, tensor products, `runCircuit`, Bell/GHZ helpers,
  `toKet` pretty-printer. (47 tests)
- **math/physics.js** — quantum/atomic (de Broglie, photon energy, hydrogen
  levels, Rydberg, particle-in-box, harmonic oscillator, Heisenberg, Compton),
  special relativity (Lorentz γ, dilation, contraction, E=mc², velocity
  addition), and cosmology (escape velocity, Schwarzschild radius, Hubble,
  redshift, Wien, Stefan–Boltzmann, Planck radiance, Kepler). (35 tests)
- **math/finance.js** — Black–Scholes Greeks (Δ/Γ/vega/Θ/ρ), Cox–Ross–Rubinstein
  binomial tree (European + American), seeded Monte Carlo (mulberry32 +
  Box–Muller). (16 new tests)
- **math/plot.js** — pure visualization generators: linspace, function &
  parametric sampling, 3-D rotation + perspective projection, surface meshes,
  and a 4-D tesseract (16 vertices / 32 edges, 4D→3D→2D pipeline). (22 tests)
- **stem.js** + UI **STEM Lab** — a paged panel cycling through 8 live SVG
  visualizations (damped wave, Lissajous, rotating 3-D surface, Bloch sphere,
  4-D tesseract, Bell-state probabilities, hydrogen spectrum, option payoff)
  with prev/next buttons and arrow-key navigation. (17 tests)

### Changed
- Engine version → 3.0.0; facade re-exports Quantum/Physics/Plot namespaces and
  advertises them in `CAPABILITIES`.

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
- **CI/CD**: GitHub Actions matrix (lint + typecheck + test + coverage + bench),
  issue/PR templates, Dependabot.
- **ESLint** flat config (`eslint.config.js`) wired into CI — caught and fixed
  4 real defects (3 over-precise float literals that silently rounded, a
  `true &&` dead expression) plus dead `y`/`w` locals in the eigensolver.
- Committed `package-lock.json` + `engines` (`node >=18`); CI uses `npm ci`.
- 286 new tests (403 total), all closed-form-anchored.

### Changed (tooling)
- Coverage scope corrected to measure the **entire engine** (previously
  referenced a non-existent `engine.js` and omitted `math/` + `repl.js`).
  Honest coverage: 95.96% stmts / 83.15% branches; gates raised to 90/85/80.

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
