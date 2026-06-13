<div align="center">

# Professional Calculator — Scientific Engine

**A zero-dependency, framework-free scientific computing engine that runs in the browser and Node.**

Expression parsing · complex numbers · exact rational arithmetic · linear algebra with eigensolvers · numerical calculus · probability & statistics · dimensional analysis · quantitative finance — every routine verified against closed-form values.

[![tests](https://img.shields.io/badge/tests-799%20passing-brightgreen)](#testing)
[![coverage](https://img.shields.io/badge/coverage-96%25%20stmts%20%2F%2083%25%20br-brightgreen)](#testing)
[![lint](https://img.shields.io/badge/eslint-0%20errors-brightgreen)](#development)
[![typecheck](https://img.shields.io/badge/tsc-strict%20clean-blue)](#type-safety)
[![deps](https://img.shields.io/badge/runtime%20deps-0-blueviolet)](#zero-dependencies)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

</div>

---

## Table of contents

1. [Why this exists](#why-this-exists)
2. [Feature matrix](#feature-matrix)
3. [Quick start](#quick-start)
4. [The expression engine](#the-expression-engine)
5. [Programmatic API](#programmatic-api)
6. [Architecture](#architecture)
7. [Numerical methods & accuracy](#numerical-methods--accuracy)
8. [Performance](#performance)
9. [Testing](#testing)
10. [Type safety](#type-safety)
11. [Project layout](#project-layout)
12. [Development](#development)
13. [Documentation index](#documentation-index)
14. [Scope, honesty & limitations](#scope-honesty--limitations)
15. [License](#license)

---

## Why this exists

Most "calculator" projects stop at four functions and a grid of buttons. This one started there and grew into a genuine **scientific computing engine**: you type `eigenvalues`, `∫`, `Γ`, `IRR`, or `e^(iπ)` and get the right answer, computed by the standard numerically-stable algorithms — LU with partial pivoting, Householder QR, the QR eigenvalue iteration, adaptive Simpson quadrature, Brent's method, Runge–Kutta–Fehlberg, the Lanczos gamma, Chebyshev erf, and the regularized incomplete gamma/beta functions.

Two things make it trustworthy rather than merely impressive:

- **Every algorithm is anchored to a closed-form check in the test suite.** Not "looks plausible" — `det(AB) = det(A)·det(B)`, eigenvalues of a rotation matrix come back `±i`, `∫₀^π sin x dx = 2`, `Φ(1.96) = 0.975`, Black–Scholes obeys put–call parity. 799 tests, all green.
- **It is honest about what it is.** It is a single-thread, double-precision, dense-matrix engine in JavaScript. It does not replace LAPACK/BLAS or MATLAB for large-scale or distributed work — see [Scope & limitations](#scope-honesty--limitations). Within its envelope (interactive, up to a few hundred dimensions) it is fast, correct, and dependency-free.

## Feature matrix

| Domain | Capabilities | Module |
|---|---|---|
| **Arithmetic** | `+ − × ÷ ^ %`, factorial `!`, abs bars `\|x\|`, implicit multiplication | [`parser.js`](math/parser.js) |
| **Complex** | full field: `exp/log/sqrt/pow`, trig + inverse + hyperbolic, polar, conj, arg | [`complex.js`](math/complex.js) |
| **Exact rationals** | BigInt `n/d` in lowest terms; `+ − × ÷ ^`; `0.1 + 0.2 = 3/10` exactly | [`rational.js`](math/rational.js) |
| **Linear algebra** | det, inverse, solve, rank, norms, LU, **QR**, **eigenvalues/vectors** | [`matrix.js`](math/matrix.js) |
| **Calculus** | derivative (Richardson), adaptive ∫, roots (Brent), ODE (RK4/RKF45) | [`calculus.js`](math/calculus.js) |
| **Statistics** | descriptive, regression, distributions, **t/z/χ²/ANOVA tests**, confidence intervals | [`stats.js`](math/stats.js) |
| **Units** | 7-dimension SI analysis, conversion, affine temperature scales | [`units.js`](math/units.js) |
| **Finance** | PV/FV/annuities, NPV, **IRR**, amortization, **Black–Scholes**, CAGR | [`finance.js`](math/finance.js) |
| **Special functions** | `Γ`, `lnΓ`, `erf`, `erfc`, `β`, incomplete `γ`/`β`, `nCr`, `nPr` | [`special.js`](math/special.js) |
| **Constants** | CODATA-2018 physical constants + math constants | [`constants.js`](math/constants.js) |
| **Quantum computing** | qubits, gates, **fluent circuit builder**, Bell/GHZ, measurement, Bloch sphere | [`quantum.js`](math/quantum.js) · [`circuit.js`](math/circuit.js) |
| **Physics & cosmology** | de Broglie, hydrogen levels, Lorentz γ, E=mc², Schwarzschild, Hubble, Planck/Wien | [`physics.js`](math/physics.js) |
| **Quant finance** | Greeks (Δ/Γ/vega/Θ/ρ), CRR binomial tree, seeded Monte Carlo | [`finance.js`](math/finance.js) |
| **Visualization** | 2D/parametric plots, 3D surfaces, **4D tesseract**, Bloch sphere, spectra | [`plot.js`](math/plot.js) |
| **STEM Lab** | paged live-SVG visual panel (8 cyclable scientific visualizations) | [`stem.js`](stem.js) |
| **Number theory** | isprime, factor, divisors, modpow, modinv, totient, fib, gcd/lcm | [`numtheory.js`](math/numtheory.js) |
| **Signal processing** | DFT/IDFT, FFT/IFFT (radix-2 + Bluestein, any length), magnitude/phase, convolution, cross-correlation, Hann/Hamming/Blackman windows, fftfreq | [`signal.js`](math/signal.js) |
| **Interpolation & fitting** | piecewise-linear, Lagrange, Newton divided differences, natural cubic spline, least-squares `polyfit`, `polyval` | [`interpolate.js`](math/interpolate.js) |
| **Symbolic (CAS)** | `diff(expr, x)` + `integrate(expr, x)` — chain/power rules, antiderivatives, simplify, re-parseable | [`symbolic.js`](math/symbolic.js) |

## Quick start

ES modules require HTTP (not `file://`):

```bash
npm install         # dev deps only (jest, typescript) — zero runtime deps
npm run serve       # static server → open the printed URL
npm test            # 799 tests
npm run typecheck   # tsc --noEmit (strict)
npm run bench       # throughput + empirical O(n³) scaling
```

Then type into the **Scientific Engine** panel:

```
sin(pi/2) + ln(e)        → 2
3 + 4i                   → 3 + 4i
|3 + 4i|                 → 5
5!                       → 120
2^3^2                    → 512        (right-associative)
log(8, 2)                → 3          (log base 2)
e^(i*pi)                 → -1         (Euler's identity)
x = 7                    → x = 7      (assignment)
x^2 + 1                  → 50
nCr(52, 5)               → 2598960
```

## The expression engine

The headline feature is a real parser, not a `eval()` wrapper (which would be an injection hole). The pipeline is:

```
source ──tokenize──▶ tokens ──Pratt parse──▶ AST ──evaluate (complex field)──▶ result
```

- **Precedence & associativity** are correct: `2 + 3*4 = 14`, `2^3^2 = 512` (right-assoc), `-2^2 = -4`.
- **Implicit multiplication**: `2x`, `2(3+1)`, `(a)(b)`, `3sin(0)`.
- **Postfix factorial** generalizes to `Γ` for non-integers: `4.5! = Γ(5.5)`.
- **Absolute-value bars** `|…|` with correct depth tracking (`|3+4i| = 5`).
- **Variables & `ans`** through the REPL scope.
- **No `eval`, no `Function`** — the evaluator walks the AST in a sandbox. Untrusted input can at worst throw, never execute.

## Programmatic API

```js
import { compute, Matrix, Calculus, Stats, Finance, Complex } from './math/index.js';

compute('e^(i*pi)').display;                 // "-1"
Matrix.det([[1,2],[3,4]]);                    // -2
Matrix.eigenvalues([[0,-1],[1,0]]);           // [{re:0,im:1},{re:0,im:-1}]
Calculus.integrate(Math.sin, 0, Math.PI);     // 2.0000000000
Calculus.brent(x => x - Math.cos(x), 0, 1);   // 0.739085…
Stats.normalCdf(1.96);                        // 0.975002…
Finance.blackScholes(100,100,0.05,0.2,1).call;// 10.4506…
```

Every module is independently importable and side-effect-free; tree-shaking takes only what you use.

## Architecture

A strict layering keeps numerics independent of the DOM. Pure math at the bottom, a thin presentation layer on top.

```
┌──────────────────────────────────────────────────────────┐
│  UI layer        index.html · styles.css                   │
│                  main.js (bootstrap)                        │
├──────────────────────────────────────────────────────────┤
│  Controllers     controller.js (button calc)  repl.js (eng)│
│  View/State      view.js · state.js · history.js            │
├──────────────────────────────────────────────────────────┤
│  Engine facade   math/index.js                              │
├──────────────────────────────────────────────────────────┤
│  Applied math    matrix · calculus · stats · units · finance│
├──────────────────────────────────────────────────────────┤
│  Core math       complex · rational · special · parser      │
│                  constants                                   │
└──────────────────────────────────────────────────────────┘
```

Full diagrams (module dependency graph, state machine, domain data model) live in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** and **[docs/DATA_MODEL.md](docs/DATA_MODEL.md)**.

## Numerical methods & accuracy

| Routine | Method | Accuracy |
|---|---|---|
| `gamma`, `lgamma` | Lanczos (g=7, n=9) | rel. err < 1e-13 |
| `erf`, `erfc` | Chebyshev (NR3 `erfccheb`) | ~1e-15 (full double) |
| incomplete `γ`, `β` | series + Lentz continued fraction | < 1e-10 |
| `det`, `solve`, `inv` | LU, partial pivoting | backward-stable |
| `qr` | Householder reflectors | `‖QᵀQ − I‖ ≈ ε` |
| symmetric eigen | cyclic Jacobi (+ eigenvectors) | quadratic convergence |
| general eigen | Hessenberg + shifted QR (real Schur) | complex pairs from 2×2 blocks |
| `integrate` | adaptive Simpson + Richardson | per-interval tol, default 1e-10 |
| roots | Brent (bisection + inverse-quadratic) | superlinear, bracket-safe |
| ODE | RK4 fixed + RKF45 adaptive 4(5) | embedded error control |
| normal quantile | Acklam rational + 1 Halley step | < 1e-15 in tails |

See **[docs/COMPLEXITY.md](docs/COMPLEXITY.md)** for the full time/space complexity reference.

## Performance

Representative throughput (`npm run bench`, Node 25, single core — machine-dependent):

| Operation | Throughput |
|---|---|
| tokenize + parse (medium expr) | ~2.4M ops/s |
| evaluate cached AST | ~2.8M ops/s |
| `gamma` | ~124M ops/s |
| `normalCdf` | ~29M ops/s |
| Black–Scholes | ~9M ops/s |
| adaptive `∫₀^π sin` | ~210K ops/s |
| matrix mul 64×64 | ~9.5K ops/s |

The O(n³) kernels (mul, det, eig) scale as documented — ~8× latency per dimension doubling — which the bench harness verifies empirically.

## Testing

```
25 test suites · 799 tests · 100% pass
coverage (full engine — math + controllers + REPL):
  95.96% statements · 95.96% lines · 93.48% functions · 83.15% branches
  gates: 90% lines/stmts · 85% functions · 80% branches
```

Tests live in [`tests/`](tests/) (mirroring the source tree under `tests/math/`). Every numerical routine is checked against a **known closed-form value or invariant**, e.g.:

- Euler: `e^{iπ} = −1` to 1e-12
- `det(AB) = det(A)·det(B)`
- eigenvalues of `[[0,−1],[1,0]]` are exactly `±i`
- `∫₀¹ 4/(1+x²) dx = π`
- `0.1 + 0.2 = 3/10` (exact rationals)
- put–call parity for Black–Scholes
- `−40 °C = −40 °F`, `N·m` has the dimensions of `J`

```bash
npm test               # all suites
npm run test:coverage  # with V8 coverage + thresholds
npx jest tests/math/matrix   # one suite
```

## Type safety

Authored in modern JavaScript with thorough JSDoc and checked under **TypeScript `strict`** (`checkJs: true`) — no build step, no `.ts` files, no `any` leaks. `npm run typecheck` is clean across all source and tests.

## Zero dependencies

The shipped engine has **no runtime dependencies**. `package.json` lists only dev tooling (`jest`, `typescript`, `jest-environment-jsdom`). Nothing is bundled into what a user runs.

## Project layout

```
Professional Calculator/
├── index.html              # app shell: calculator + history + REPL
├── styles.css              # design-token CSS (light/dark/contrast/print)
├── main.js                 # bootstrap (calculator + lazy engine)
├── controller.js           # 4-function calculator orchestration
├── view.js  state.js  history.js   # MVC for the button calculator
├── repl.js                 # scientific REPL controller
├── math/
│   ├── index.js            # engine facade + capability manifest
│   ├── complex.js  rational.js  special.js  constants.js   # core
│   ├── parser.js           # tokenizer → Pratt parser → evaluator
│   ├── matrix.js  calculus.js  stats.js  units.js  finance.js  # applied
├── tests/                  # 14 suites mirroring the source tree
├── bench/bench.js          # benchmark harness
├── docs/                   # ARCHITECTURE, DATA_MODEL, COMPLEXITY, AUDIT, …
├── .github/workflows/ci.yml# CI: typecheck + test + coverage matrix
├── tsconfig.json           # strict checkJs
└── package.json            # scripts + dev deps
```

## Development

| Command | Purpose |
|---|---|
| `npm test` | run the Jest suite |
| `npm run test:watch` | watch mode |
| `npm run test:coverage` | coverage with thresholds |
| `npm run lint` | ESLint (flat config, 0 errors) |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run bench` | benchmarks |
| `npm run serve` | local static server |

Conventions, branching, and how to add a module are in **[CONTRIBUTING.md](CONTRIBUTING.md)**.

> **Note on the repo path.** This project lives under a directory containing
> brackets (`[…]`). Some Node tooling mishandles `[`/`]` in the working
> directory; the test config uses bracket-safe globs, and for local runs a
> bracket-free junction works around the rest (see CONTRIBUTING).

## Documentation index

| Document | What it covers |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | layering, module graph, data flow, design decisions |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | domain entities, relationships (ER + class diagrams), state machine |
| [docs/COMPLEXITY.md](docs/COMPLEXITY.md) | time/space complexity of every algorithm |
| [docs/AUDIT.md](docs/AUDIT.md) | 500-point, 25-section inspection |
| [KANBAN.md](KANBAN.md) | board: done / in progress / backlog |
| [ROADMAP.md](ROADMAP.md) | phased roadmap |
| [CHANGELOG.md](CHANGELOG.md) | versioned history |
| [CONTRIBUTING.md](CONTRIBUTING.md) | dev workflow & conventions |
| [SECURITY.md](SECURITY.md) | threat model & reporting |

## Scope, honesty & limitations

This engine is **Tier-1 for interactive, single-machine, double-precision work**. It is deliberately *not* a clone of MATLAB/NumPy/LAPACK, and pretending otherwise would be dishonest. Concretely:

- **Precision:** IEEE-754 double. No arbitrary-precision floats (exact arithmetic is available for *rationals* only).
- **Scale:** dense matrices, single-threaded. Excellent to ~few-hundred dimensions; it is not a sparse/distributed/GPU solver.
- **General eigenvalues:** real Schur via shifted QR with single-shift bulge-chase — robust on the tested cases (including complex pairs); for adversarial non-normal matrices a production Francis double-shift would be more bulletproof. Symmetric problems use the rock-solid Jacobi method.
- **No symbolic algebra** (no CAS): differentiation/integration are numerical, not symbolic.

Where it competes: correctness you can audit, zero install/runtime deps, instant startup, a real parser, and a clean API — in the browser, offline.

## License

[MIT](LICENSE) © 0thernes
