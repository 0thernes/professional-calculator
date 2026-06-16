<div align="center">

# SPECS — Calculator Suite Specification

**The complete operation catalog and competitive benchmark for the Professional Calculator.**

`Engine v3.25.0` · `Suite: 4 pages · 48 mini‑calculators · 257 operations · 25 domains`

</div>

> **Sub‑domain page set.** This is one of the reference pages that ship with the
> app and cross‑link:
> [ARCHITECTURE](docs/ARCHITECTURE.md) (how it's built) ·
> **SPECS** (what it does — *this page*) ·
> [DOCUMENTATION](DOCUMENTATION.md) (how to use it) ·
> [STUDY ATLAS](docs/MATH_STUDY_ATLAS.md) (617 courses/topics to learn, UG→PhD).

---

## Table of contents

1. [Scope & design contract](#1-scope--design-contract)
2. [Domain map — 25 domains, sub-domains](#2-domain-map)
3. [Operation catalog — all 257 operations](#3-operation-catalog)
   - [Page I — Core & Algebra (68)](#page-i--core--algebra-68-operations)
   - [Page II — Calculus & Linear Algebra (64)](#page-ii--calculus--linear-algebra-64-operations)
   - [Page III — Probability, Stats & Finance (69)](#page-iii--probability-stats--finance-69-operations)
   - [Page IV — Applied · Engineering · Quantum (56)](#page-iv--applied--engineering--quantum-56-operations)
4. [Live engine labs (beyond the grid)](#4-live-engine-labs)
5. [Competitive benchmark — TI · Casio · Android](#5-competitive-benchmark)
6. [Where we lead / where the handhelds lead](#6-honest-positioning)
7. [Numerical accuracy contract](#7-numerical-accuracy-contract)

---

## 1. Scope & design contract

The suite is a **data‑driven grid** of focused mini‑calculators. One registry
(`suite.js → PAGES`) declares every page, tile, input, and operation; a generic
renderer turns it into the UI. There is **no per‑calculator hand‑wiring** — adding
a calculator is adding a data row, which is why the catalog below is generated
directly from the registry (`suiteManifest()`), not maintained by hand.

| Contract | Guarantee |
|---|---|
| **Functional** | Every one of the 257 operations executes against the verified `math/` engine and returns a value with default inputs (probe: 0 throwers, 0 NaN/∞ on defaults). |
| **Reactive** | Run on click, on `Enter` in any field, and on operation‑dropdown change. Results are announced via `aria-live="polite"`. |
| **Responsive / Adaptive** | The grid is `auto-fill, minmax(232px, 1fr)` — it reflows from 6 columns (desktop) to 1 (mobile) with no breakpoints to maintain. |
| **Safe** | No `eval`/`Function`. Expressions go through the hand‑written Pratt parser; matrices/lists are parsed explicitly. |
| **Honest errors** | A failing op shows `⚠ <reason>` in red, never a silent wrong number. |

---

## 2. Domain map

The engine exposes **25 capability domains** (`CAPABILITIES` in `math/index.js`);
the suite surfaces them through 48 tiles, with sub‑domains where a field splits
naturally (e.g. *Distributions* → continuous + discrete; *Physics* → mechanics,
relativity, quantum).

| # | Main domain | Suite tiles (sub-domains) |
|---|---|---|
| 1 | Arithmetic | Scientific, Powers & Roots, Percent & Ratio |
| 2 | Algebra | Quadratic Solver, Polynomial, Algebra (CAS) |
| 3 | Exact rationals | Exact Rationals (BigInt n/d) |
| 4 | Logarithms & exponentials | Log & Exp |
| 5 | Trigonometry | Trigonometry, Inverse / Hyperbolic |
| 6 | Complex numbers | Complex Numbers (ℂ field) |
| 7 | Sequences & series | Sequences & Series |
| 8 | Differential calculus | Derivative |
| 9 | Integral calculus | Integral |
| 10 | Root finding & optimization | Root Finder, Optimization |
| 11 | Linear algebra | Matrix, Eigen / SVD, Linear Solve |
| 12 | Vector geometry | Vector Geometry |
| 13 | Number theory | Number Theory |
| 14 | Combinatorics | Combinatorics, Combinatorial Probability |
| 15 | Interpolation & fitting | Interpolation & Fit, Polynomial |
| 16 | Special functions | Special Functions (Γ, erf, β) |
| 17 | Descriptive statistics | Descriptive Stats |
| 18 | Probability distributions | Distributions (continuous), Discrete Dists |
| 19 | Inferential statistics | Hypothesis Tests, Regression |
| 20 | Finance | Time Value of Money, NPV/IRR, Black–Scholes, Rates & Compounding |
| 21 | Bits, bases & logic | Bases & Bitwise, Sets & Logic |
| 22 | Units & coordinates | Unit Conversion, Coordinates |
| 23 | Physics | Mechanics, Relativity, Quantum |
| 24 | Quantum computing / signal | Quantum Lab, Signal · FFT, ODE Lab |
| 25 | Applied / engineering | Graphs, Mensuration, Electrical Eng., Everyday & Health |

> **What to study in each domain.** The [Mathematics Study Atlas](docs/MATH_STUDY_ATLAS.md)
> distills these 25 domains (and their 190 sub‑domains) into **617 deduplicated
> courses, topics, and research areas — undergraduate to PhD** — grounded in the
> curricula of the world's top‑100 research mathematics departments. It is the
> "what to learn" companion to this "what it computes" catalog.

---

## 3. Operation catalog

Generated from `suiteManifest()`. Each tile lists its inputs and every operation
reachable from its dropdown.

### Page I — Core & Algebra (68 operations)

| Tile | Inputs | Operations |
|---|---|---|
| **Scientific** | expression | evaluate |
| **Powers & Roots** | x, n | x^n · n‑th root · √x · cbrt x · x² · 1/x · \|x\| · xˣ |
| **Log & Exp** | x, base | ln · log10 · log2 · log base b · e^x · b^x · antilog 10^x |
| **Trigonometry** | angle (rad) | sin · cos · tan · sec=1/cos · csc=1/sin · cot=1/tan · deg→rad · rad→deg |
| **Inverse / Hyperbolic** | x | asin · acos · atan · sinh · cosh · tanh · asinh · acosh · atanh |
| **Complex Numbers** | z | evaluate · \|z\| · arg · conj · Re · Im · z² · 1/z · √z · exp(z) |
| **Exact Rationals** | a, b | a+b · a−b · a×b · a÷b (BigInt exact) |
| **Polynomial** | coeffs, x | evaluate p(x) (Horner) |
| **Quadratic Solver** | a, b, c | roots · discriminant · vertex −b/2a · sum −b/a · product c/a |
| **Algebra (CAS)** | f(x), var | differentiate · integrate (symbolic) |
| **Sequences & Series** | n | n! · Σ1..n · Σi² · Σi³ · harmonic Hₙ · Σ2ⁱ · fib(n) |
| **Percent & Ratio** | value, percent/total | a% of b · a is what % of b · % change · add a% · a% off (sale) · reverse % |

### Page II — Calculus & Linear Algebra (64 operations)

| Tile | Inputs | Operations |
|---|---|---|
| **Derivative** | f(x), at x | f′(x) · f″(x) (numeric) |
| **Integral** | f(x), a, b | adaptive Simpson · Gauss–Legendre |
| **Root Finder** | f(x), a/x₀, b/x₁ | Brent · Newton · secant · bisection |
| **Optimization** | f(x), a, b | golden‑section min · golden‑section max |
| **Matrix** | A | det · trace · rank · inverse · transpose · ‖A‖_F · ‖A‖₁ · ‖A‖∞ · symmetric? |
| **Eigen / SVD** | A | eigenvalues · singular values · cond κ₂ · pseudo‑inverse |
| **Linear Solve** | A, b | solve · least squares (lstsq) · LU factorization |
| **Vector Geometry** | u, v | dot · cross · \|u\| · angle · distance · normalize · projection · midpoint |
| **Number Theory** | n, m, k | is prime? · factor · divisors · gcd · lcm · φ(n) · nextprime · nᵐ mod k · modinv · perfect square? |
| **Combinatorics** | n, k | nCr · nPr · Catalan · Bell · Stirling2 · partitions · derangements · Stirling1 · multiset C |
| **Interpolation & Fit** | xs, ys, q | Lagrange · linear · cubic spline · polyfit |
| **Special Functions** | x, y | Γ(x) · erf · erfc · β(x,y) · lnΓ(x) · lnβ(x,y) · lnΓ(x+y) |

### Page III — Probability, Stats & Finance (69 operations)

| Tile | Inputs | Operations |
|---|---|---|
| **Descriptive Stats** | data | mean · median · std · variance · IQR · skewness · kurtosis · mode · range · sum |
| **Distributions** | x, p/df | normal cdf/pdf/quantile · t cdf/pdf · χ² cdf/pdf |
| **Discrete Dists** | k, n, p/λ | binomial pmf/cdf · Poisson pmf/cdf · exponential cdf |
| **Hypothesis Tests** | A, B/μ₀/exp | two‑sample t (Welch) · one‑sample t · 95% CI · one‑way ANOVA · χ² goodness‑of‑fit |
| **Regression** | xs, ys | linear y=mx+b (r²) · correlation r · covariance |
| **Combinatorial Prob.** | n, k | nCr · nPr · P(no repeat) · P(≥1 collision) |
| **Time Value of Money** | PV/PMT, rate, periods | FV · PV · annuity PV · annuity FV · loan payment |
| **NPV / IRR** | rate, cashflows | NPV · IRR · profitability index |
| **Black–Scholes** | S, K, r, σ, T | price call/put · Greeks (call) · Greeks (put) · binomial (100 steps) |
| **Rates & Compounding** | begin, end, periods, m | CAGR · total return % · effective APY · continuous APY · doubling time · rule of 72 |
| **Bases & Bitwise** | int, int₂, base | to base b · binary · octal · hex · popcount · bit length · Gray code · Hamming dist |
| **Sets & Logic** | A, B | union · intersection · difference · symmetric diff · Jaccard · ⊆? · ⊇? · disjoint? · \|2^A\| |

### Page IV — Applied · Engineering · Quantum (56 operations)

| Tile | Inputs | Operations |
|---|---|---|
| **Unit Conversion** | value, from, to | convert (SI dimensional) |
| **Coordinates** | x/r, y/θ, z | cart→polar · polar→cart · cart→spherical · cart→cylindrical · deg→rad · rad→deg |
| **Physics · Mechanics** | M, r | escape velocity · Schwarzschild r · grav. force · orbital period · surface gravity |
| **Physics · Relativity** | v, m, t₀/L₀ | Lorentz γ · E=mc² · relativistic E · time dilation · length contraction |
| **Physics · Quantum** | n/freq/p, λ/θ/Δx | H energy level · photon E (freq) · de Broglie λ · photon E from λ · Compton shift · Heisenberg Δp |
| **Quantum Lab** | qubits | Bell state · GHZ(n) ket · GHZ(n) probs (gate‑model sim) |
| **Signal · FFT** | samples | FFT magnitude · phase spectrum · autocorrelation · cross‑correlation · next pow2 |
| **ODE Lab** | f(t,y), y₀, t₁ | y(t₁) via RK4 · y(t₁) via RKF45 (adaptive) |
| **Graphs** | vertices, edges | MST weight (Kruskal) · connected components · Dijkstra · BFS order |
| **Geometry · Mensuration** | radius/a, height/b | circle area/circumference · sphere volume/surface · cylinder · cone · triangle · rectangle |
| **Electrical Eng.** | V, R, C | I=V/R · P=V²/R · energy ½CV² · RC τ · cutoff f=1/2πRC |
| **Everyday & Health** | mass/bill/P/°, height/%/r, years | BMI · tip · compound · simple interest · °C→°F · °F→°C |

---

## 4. Live engine labs

Below the grid, five **interactive panels** drive the engine continuously (not
one‑shot ops). These are the originals the suite was asked to keep and extend:

| Lab | What it does |
|---|---|
| **Expression Engine** | Full Pratt‑parser REPL with a runnable capability palette and CAS chips. |
| **Linear Algebra Lab** | Live matrix workbench — det/eigen/SVD/inverse/rank/trace on an editable matrix literal. |
| **STEM Visualizer** | Paged animated plots (damped wave, etc.) with prev/next + arrow keys. |
| **Quantum Lab** | State‑vector gate model with Bloch sphere + probability bars. |
| **Signal · FFT** | Magnitude spectrum of an arbitrary sample vector, with preset signals. |
| **Quant Finance** | Black–Scholes price + Greeks panel. |
| **Plot Studio / ODE Lab** | Function plotting and `y′=f(t,y)` trajectory integration. |

---

## 5. Competitive benchmark

Reference machines: **TI‑83/84 Plus, TI‑86, TI‑89 Titanium, TI‑92/Voyage 200,
TI‑Nspire CX II CAS**; the top **Casio (2026)** line — **fx‑991CW ClassWiz**
(flagship non‑graphing scientific), **fx‑CG50 PRIZM** (color graphing),
**fx‑CP400 ClassPad II** (CAS graphing); and the leading **Android** apps —
**HiPER Scientific, Mathlab (Math Calculator), GeoGebra, Desmos, Photomath**.

Legend: ✅ full · 🟡 partial / lab‑only · ❌ none.

| Capability | TI‑84 | TI‑89 | Nspire CX CAS | Casio 991CW | Casio CG50 | Casio CP400 | Android (best‑of) | **This suite** |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Scientific / expression eval | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Complex numbers (full ℂ) | 🟡 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Exact rationals / big integers | ❌ | ✅ | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ (BigInt) |
| Symbolic CAS (diff/integrate) | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | 🟡 | 🟡 (diff + basic ∫) |
| Numeric calculus (∫, f′, ODE) | 🟡 | ✅ | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ (Simpson/GL, RK4, RKF45) |
| Root finding (Brent/Newton/…) | 🟡 | ✅ | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ (4 methods) |
| Matrices (det/inv/rank) | ✅ | ✅ | ✅ | 🟡 (4×4) | ✅ | ✅ | ✅ | ✅ |
| Eigenvalues / SVD / pseudo‑inv | 🟡 | 🟡 | 🟡 | ❌ | ❌ | 🟡 | 🟡 | ✅ (eig + SVD + lstsq + LU) |
| Descriptive + inferential stats | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (t/ANOVA/χ²/CI/regress) |
| Probability distributions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ (normal/t/χ²/binom/Poisson/exp) |
| Finance — TVM | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | 🟡 | ✅ |
| Finance — NPV/IRR | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | 🟡 | ✅ |
| Finance — options (BS + Greeks) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🟡 | ✅ (BS + Greeks + binomial) |
| Number theory (modpow/modinv/φ) | ❌ | 🟡 | 🟡 | 🟡 | ❌ | 🟡 | 🟡 | ✅ |
| Combinatorics (Catalan/Bell/…) | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | ✅ (incl. Stirling/partitions/derange) |
| Signal processing (FFT) | ❌ | ❌ | ❌ | ❌ | 🟡 | 🟡 | 🟡 | ✅ (FFT/autocorr/xcorr/conv) |
| Graph theory (MST/Dijkstra/BFS) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Quantum computing (gate sim) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (Bell/GHZ state vectors) |
| Special functions (Γ/erf/β) | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | ✅ |
| Units / dimensional analysis | 🟡 | ✅ | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ |
| **Interactive graphing (trace/zoom)** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | 🟡 (plot lab, no trace/zoom) |
| **On‑device programming / Python** | ✅ | ✅ | ✅ | ❌ | ✅ (Py) | ✅ | 🟡 | ❌ (engine is JS, not a user lang) |
| **Standalone hardware (exam‑legal)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ (web/desktop app) |

---

## 6. Honest positioning

**Where this suite leads the field (match‑or‑beat).** Quantitative finance with
options pricing **and** Greeks (no handheld has this), graph theory, quantum
gate‑model simulation, signal processing, number theory, advanced combinatorics,
decompositions (SVD / pseudo‑inverse / least squares), and the breadth of
inferential statistics (Welch t, one‑way ANOVA, χ² GoF, confidence intervals) all
sit **beyond** what the TI and Casio handhelds ship — and beyond most Android
calculators. On raw applied‑math breadth across 25 domains and 257 reachable
operations, the suite is in the **TI‑Nspire CX CAS / Casio ClassPad II tier and
extends past it** into domains those devices don't cover at all.

**Where the handhelds still lead (stated plainly, no hype).**

- **Full symbolic CAS.** The TI‑89, Nspire CX CAS, and ClassPad II perform deep
  symbolic integration, equation solving, and simplification. Our CAS layer does
  symbolic differentiation and *basic* integration only — for hard symbolic work
  they win.
- **Interactive graphing.** TI/Casio graphing models and Desmos/GeoGebra offer
  trace, zoom, intersection, and multi‑function plotting. We have a plotting lab
  and a STEM visualizer, not a full interactive grapher (🟡).
- **On‑device programmability.** TI‑BASIC, Casio Python, and Nspire scripting let
  users write programs on the device. Our engine is authored in JavaScript but is
  not exposed as a user programming environment.
- **Exam‑legal standalone hardware.** A web/desktop app is not a sanctioned exam
  device. For proctored exams the handhelds are the only option.

This is the calibrated read: **best‑in‑class for computational, statistical,
financial, and scientific breadth in a zero‑dependency app; not a replacement for
a graphing‑calculator's plotting or a CAS device's symbolic engine.**

---

## 7. Numerical accuracy contract

Every engine routine the suite calls is anchored to a closed‑form or
reference value in the 1,098‑test suite (38 suites). Representative tolerances:

| Area | Method | Accuracy anchor |
|---|---|---|
| Integration | adaptive Simpson / Gauss–Legendre | ∫₀¹ 4/(1+x²) = π to ~1e‑10 |
| ODE | RK4 (120 steps) / RKF45 (adaptive, tol 1e‑8) | matches analytic solution |
| Eigenvalues | Francis double‑shift QR | characteristic‑polynomial roots |
| SVD / cond | one‑sided Jacobi | σᵢ vs. √λ(AᵀA) |
| Distributions | series + continued fractions | normalCdf(1.96)=0.975 to 1e‑9 |
| Root finding | Brent / Newton / secant / bisection | √2, transcendental roots to 1e‑12 |
| FFT | radix‑2 Cooley–Tukey | Parseval / inverse round‑trip |

Overflow (e.g. `10^1000`) and domain errors surface as `∞` or `⚠ <reason>` —
never a silently wrong finite number.

---

<div align="center">

*Generated from the live registry (`suite.js`). To regenerate the catalog after
adding a tile, run the manifest dump in `DOCUMENTATION.md → Extending the suite`.*

</div>
