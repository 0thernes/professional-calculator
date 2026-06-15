# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **UI rebuilt as a "scientific compute terminal"** (`index.html`, `styles.css`):
  the Expression Engine is now the hero (large console + 21 one-click *runnable*
  capability chips across complex/analysis, calculus·CAS, linear algebra, number
  theory, combinatorics/special). New **Linear Algebra Lab** (`lab.js`) runs
  det/eigenvalues/inverse/SVD/cond/rank/trace/transpose/‖·‖F live and renders
  matrices as bracketed grids — surfacing **complex eigenvalues** (`[[0,-1],[1,0]] → ±i`)
  that the REPL's `eigvals` dropped. The 4-function keypad is demoted to a
  "Quick Pad"; STEM Lab + History become panels. Dense dark terminal aesthetic,
  responsive phone→ultrawide, dark-first with light fallback; top-bar stats are
  sourced live from `CAPABILITIES`.
- **`lab.js`** — capability-palette wiring + Matrix Lab. All DOM writes use
  `textContent`/`createElement` (no injection surface); strict-`checkJs` clean.

### Fixed
- **`math/stats.js`** `binomialPmf` overflowed to `Infinity` for large `n`
  (`combinations(1030,515) === Infinity`); now computed in log-space via `lgamma`
  (mirrors `poissonPmf`), with p=0/p=1 guards. +1 regression test → **1091** total.
- **`.github/dependabot.yml`** npm updater pointed at a non-existent
  `/Professional Calculator` dir (dead since the flatten in `01386f4`) → `/`.
- **`.github/workflows/ci.yml`** push trigger was `master`/`scientific-engine`
  (the only branch is `main`, so push CI never ran) → `[main]`.
- **`docs/AUDIT.md`** two checkpoints still claimed an MIT license (stale since
  the relicense in `7226ddc`) → corrected to Proprietary · All Rights Reserved.

### Changed
- Suite/test counts synced across README, KANBAN, docs/AUDIT (14→37 suites; 1079/1090→1091).

### Notes
- Version intentionally not bumped this run; a **`3.26.0`** tag is queued once the
  UI rebuild is reviewed (it would also retroactively cover the Francis-QR + e2e
  work that landed unlogged in `2b2fe3f`).

## [3.25.0] — Symbolic simplification: collect like terms

### Added
- **`math/symbolic.js`** `simplify` now collapses like terms/factors:
  `x + x → 2·x` and `x · x → x²` (matched structurally via `equal`, so it works
  for any repeated sub-expression, e.g. `sin(x) + sin(x) → 2·sin(x)`).
- Version → 3.25.0.
- 4 new tests (1079 total / 36 suites): `x + x → 2 · x`, `x * x → x ^ 2`,
  `sin(x) + sin(x) → 2 · sin(x)`, and a finite-value cross-check that `x + x`
  evaluates to `2x`. The existing diff/integrate anchors are unaffected (full
  suite stays green — the new forms are strictly more simplified).

## [3.24.0] — Cubic-spline visualization in the STEM Lab

### Added
- **STEM Lab**: a new **Cubic Spline** page (`stem.js`) surfacing
  `interpolate.js` — a natural cubic spline drawn smoothly through a fixed set
  of scattered data points (shown as dots). The STEM Lab now cycles through
  **11** pages.
- Version → 3.24.0.
- 2 new tests (1075 total / 36 suites): the page renders a static SVG with a
  `<polyline>` curve and `<circle>` data points, plus a functional anchor that
  the spline passes through its data nodes. README/AUDIT/KANBAN page counts 10→11.

## [3.23.0] — Bit functions in the REPL

### Added
- **REPL grammar**: the `bits.js` scalar helpers are now callable from the
  expression engine — `popcount(n)`, `bitlength(n)`, `gray(n)` (Gray encode),
  `igray(n)` (Gray decode), `hamming(a, b)` — dispatched through `parser.js`
  (same path as the combinatorics functions). They compose with arithmetic,
  e.g. `popcount(7) + bitlength(8) = 7`.
- Version → 3.23.0.
- 7 new parser tests (1073 total / 36 suites): `popcount(255)=8`,
  `bitlength(256)=9`, `gray(4)=6`, `igray(6)=4`, `hamming(10,6)=2`, an
  arithmetic-composition case, and arg-count guards. README quick-start updated.

## [3.22.0] — Expanded unit catalogue

### Added
- **`math/units.js`**: ~30 more units, making `convert` and the new
  `unitexpr` evaluator far more useful —
  - length `um`, `nm`, `yd`; mass `mg`, `oz`, `tonne`; time `ms`, `us`, `ns`,
    `week`, `yr` (Julian, 365.25 d); volume `L`, `mL`;
  - speed `mph`, `knot`; force `kN`; energy `kJ`, `eV`, `cal`, `kcal`, `kWh`;
    power `kW`, `MW`; pressure `kPa`, `bar`, `atm`; frequency `kHz`, `MHz`, `GHz`.
- Version → 3.22.0.
- 10 new tests (1066 total / 36 suites), closed-form anchored: `1 yd = 36 in`,
  `16 oz = 1 lb`, `1 yr = 365.25 day`, `1 L = 1000 mL`, `1 eV = 1.602176634e−19 J`,
  `1 cal = 4.184 J`, `1 kWh = 3.6e6 J`, `1 atm = 101325 Pa`, `1 GHz = 1e9 Hz`,
  with the new energy units sharing the joule dimension and cross-dimension
  conversions still throwing.

## [3.21.0] — Unit-aware expressions

### Added
- **`math/unitexpr.js`** — a unit-aware expression evaluator with full
  dimensional analysis. `evaluate("3 kg * 9.8 m / s^2")` → a `Quantity`
  (29.4 kg·m/s²): `+`/`−` require matching dimensions, while `*`, `/`, implicit
  multiplication, parentheses, unary minus, and integer powers combine them.
  A small self-contained recursive-descent parser over the `units.js` Quantity
  model. `format(q)` renders `"<value> <unit>"`.
  - Affine temperature units (`degC`/`degF`) are rejected here — they don't
    compose multiplicatively; use `Units.convert` for those.
  - Exposed on the facade as `UnitExpr`. (Like `signal.js`, it is a separate
    evaluator and is **not** wired into the `Complex | Matrix` scientific REPL.)
- Version → 3.21.0.
- 22 new tests (1056 total / 36 suites), closed-form anchored: `3 kg·9.8 m/s² =
  29.4 N` (dim [1,1,−2]); implicit-× `kg m / s²` = newton; `2 m + 3 m = 5 m`;
  `2 m + 3 s` throws; `1 km = 1000 m`; `60 km/hr ≈ 16.667 m/s`; `(2+3) m`;
  powers bind tighter than implicit-× (`2 m^3 = 2 m³`); negative exponents;
  scientific notation; energy dimension; and the unknown-unit / affine /
  empty / trailing-token / illegal-char / missing-exponent guards.

## [3.20.0] — Base conversion & bit manipulation

### Added
- **`math/bits.js`** — radix conversion and bit-twiddling on non-negative
  integers (BigInt-exact internally):
  - `toBase`/`fromBase`/`fromBaseBig` (any base 2–36) + `toBinary`/`toOctal`/`toHex`
  - `popcount`, `hammingDistance`, `isPowerOfTwo`, `bitLength`
  - `grayEncode`/`grayDecode` (reflected Gray code)
  - Exposed on the facade as `Bits`; capability manifest row added.
- Version → 3.20.0.
- 21 new tests (1034 total / 35 suites), closed-form anchored: `toBase(255,16)='ff'`,
  `toBase(10,2)='1010'`; round-trips across many values/bases (incl. a BigInt
  value beyond 2⁵³); `popcount(255)=8`; `hammingDistance(10,6)=2`;
  power-of-two and `bitLength` checks; `grayEncode(0..7)=[0,1,3,2,6,7,5,4]`,
  decode∘encode = identity, and consecutive Gray codes differing by one bit;
  base-range / invalid-digit / negative-input guards.

## [3.19.0] — Set & relation utilities

### Added
- **`math/sets.js`** — finite-set operations over plain arrays (Set/SameValueZero
  membership, deduplicated results preserving first-appearance order):
  `unique`, `union`, `intersection`, `difference`, `symmetricDifference`,
  `isSubset`, `isSuperset`, `isDisjoint`, `setEquals`, `jaccard`, `powerSet`,
  `cartesianProduct`. Exposed on the facade as `Sets`; capability manifest row
  added.
- Version → 3.19.0.
- 21 new tests (1013 total / 34 suites), closed-form anchored: union/intersection/
  difference/symmetric-difference of `[1,2,3]` & `[2,3,4]`; subset/superset/disjoint
  predicates; `setEquals` ignoring order & duplicates; `jaccard = 0.5` (and 1 for
  identical / two-empty, 0 for disjoint); `|powerSet| = 2ⁿ` with ∅ and full set;
  `|A×B| = |A|·|B|`; non-mutation of inputs.

## [3.18.0] — MST visualization in the STEM Lab

### Added
- **STEM Lab**: a new **Spanning Tree** page (`stem.js`) surfacing `graph.js` —
  a fixed 6-vertex / 9-edge weighted graph laid out on a hexagon, with its
  Kruskal minimum spanning tree (weight 33) highlighted. The STEM Lab now
  cycles through **10** pages.
- Version → 3.18.0.
- 2 new tests (992 total / 33 suites): the page renders a static SVG with nodes
  (`<circle>`) and edges (`<line>`), and a functional anchor that the demo
  graph's MST has weight 33 over 5 edges. README/AUDIT/KANBAN page counts 9→10.

## [3.17.0] — Graph algorithms

### Added
- **`math/graph.js`** — classic graph algorithms on vertices `0…n−1`:
  - `bfs` / `dfs` (adjacency list → order, distances, parent tree)
  - `dijkstra` (non-negative weights, O(V²)) + `shortestPath` reconstruction
  - `connectedComponents` and `mst` (Kruskal) via union–find
  - `topologicalSort` (Kahn; throws on a cycle)
  - Exposed on the facade as `Graph`; capability manifest row added.
- Version → 3.17.0.
- 19 new tests (990 total / 33 suites), closed-form anchored: BFS distances
  `[0,1,1,2]` on a square + Infinity for unreachable; Dijkstra distances
  `[0,3,1,4]` and `shortestPath 0→3 = [0,2,1,3]` (dist 4); negative-weight guard;
  component partition `[[0,1,2],[3,4]]`; topological order respecting all edges
  with a cycle throwing; Kruskal MST weight = 6 on a known graph (n−1 edges).

### Changed
- **Docs accuracy sweep**: synced `docs/ARCHITECTURE.md` (both Mermaid graphs +
  the dependency prose now include numtheory/signal/interpolate/optimize/
  geometry/combinatorics/decomposition/coordinates/random), `docs/AUDIT.md`
  (addendum → v3.16.0, full module table, tally **25 math + 6 app, 971 tests /
  32 suites**), and `KANBAN.md` (flow metrics + a new "numerical-library
  expansion" epic). The historical v2.0.0 500-point inspection is left intact as
  a point-in-time record.

### Added
- **Property-based tests** (`tests/math/properties.test.js`): a seeded-`Rng`
  suite that draws many random inputs per test and asserts mathematical
  invariants across modules — triangle inequality, Cauchy–Schwarz, cross-product
  orthogonality, rotation length-preservation, `ifft(fft(x)) ≈ x` (radix-2 &
  Bluestein), Parseval, `polyfit` round-trip, `det(AB) = det(A)·det(B)`,
  `A·solve(A,b) = b`, SVD reconstruction, the Moore–Penrose identity, Cholesky
  of `MMᵀ+nI`, `Σ Stirling2 = Bell`, `Σ Stirling1 = n!`, `Σ C(n,k) = 2ⁿ`,
  `a·a⁻¹ ≡ 1 (mod p)`, and coordinate round-trips. Fully reproducible (fixed
  seeds). 971 tests / 32 suites. Test-only — no library change.

## [3.16.0] — Seeded random & sampling

### Added
- **`math/random.js`** — a deterministic, seeded RNG and sampling toolkit:
  - `createRng(seed)` — a mulberry32 `() => [0,1)` stream; and the `Rng` class
    wrapping it.
  - `Rng` methods: `next`, `uniform`, `int`, `bernoulli`, `normal` (Box–Muller,
    cached pair), `exponential`, `poisson` (Knuth), `choice`, `shuffle`
    (Fisher–Yates, non-mutating), `sample` (without replacement).
  - Seeded for reproducibility — the engine avoids the global unseeded
    `Math.random`. `stats.js` has the CDFs/quantiles; this has the sampling.
  - Exposed on the facade as `Random`; capability manifest row added.
- Version → 3.16.0.
- 23 new tests (950 total / 31 suites): reproducibility (same seed → identical
  stream; `createRng` matches `Rng.next`), range invariants (`next ∈ [0,1)`,
  `int(1,6)` covers exactly 1–6), and moment checks over a fixed seed — normal
  mean ≈ μ / variance ≈ σ², Bernoulli proportion ≈ p, exponential mean ≈ 1/λ,
  Poisson mean ≈ λ — plus shuffle-is-a-permutation/non-mutating and
  sample-distinct.

### Changed
- **Benchmarks**: `bench/bench.js` now covers the newer modules — FFT throughput
  on both the radix-2 (512-pt) and Bluestein (500-pt) paths, an 8×8 SVD, a 2-D
  Nelder–Mead minimization, and `partitions(60)` — plus a dedicated **FFT
  O(N log N) scaling** section (256→2048) alongside the existing O(n³) kernel
  table. Script-only; no library or test changes.

## [3.15.0] — FFT spectrum in the STEM Lab

### Added
- **STEM Lab**: a new **FFT Spectrum** page (`stem.js`) that surfaces the
  `signal.js` engine visually — the magnitude spectrum (bar chart) of a
  two-tone signal `sin(2π·3k/N) + ½·sin(2π·7k/N)` (N = 64), with the two
  dominant bins highlighted. The STEM Lab now cycles through **9** pages.
- Version → 3.15.0.
- 2 new tests (927 total / 30 suites): the page renders a static bar-chart SVG,
  and a functional check that the computed magnitude spectrum peaks at bins 3
  (full amplitude) then 7 (half amplitude). README page-count updated.

## [3.14.0] — Coordinate systems

### Added
- **`math/coordinates.js`** — conversions between Cartesian and the common
  curvilinear systems (physics/ISO convention; angles in radians):
  - `polarToCartesian` / `cartesianToPolar`
  - `sphericalToCartesian` / `cartesianToSpherical` (polar angle θ from +z,
    azimuth φ)
  - `cylindricalToCartesian` / `cartesianToCylindrical`
  - `degToRad` / `radToDeg`
  - Cartesian results are `number[]` (composing with `geometry.js`);
    curvilinear results are named objects. Exposed on the facade as
    `Coordinates`; capability manifest row added.
- Version → 3.14.0.
- 16 new tests (925 total / 30 suites), closed-form anchored: `polar(√2,π/4) =
  [1,1]`; spherical equator/azimuth cases (`(1,π/2,0)=[1,0,0]`,
  `(1,π/2,π/2)=[0,1,0]`), north pole `(·,0,·)=[0,0,z]`, and
  `[1,1,√2] → (r=2, θ=π/4, φ=π/4)`; `cylindrical(1,π/2,5)=[0,1,5]`; full
  Cartesian→curvilinear→Cartesian round-trips and deg/rad checks.

## [3.13.0] — Combinatorics in the REPL

### Added
- **REPL grammar**: the combinatorial sequences are now callable directly from
  the expression engine / calculator UI — `catalan(n)`, `bell(n)`,
  `partitions(n)`, `derangements(n)`, `stirling1(n,k)`, `stirling2(n,k)`, and
  `multichoose(n,k)` — dispatched through `parser.js` to `combinatorics.js`
  (the existing `nCr`/`nPr` and `isprime`/`totient`/`fib` style). They compose
  with arithmetic, e.g. `catalan(4) + bell(3) = 19`.
- Version → 3.13.0.
- 9 new parser tests (909 total / 29 suites): `catalan(5)=42`, `bell(5)=52`,
  `partitions(10)=42`, `derangements(4)=9`, `stirling2(4,2)=7`,
  `stirling1(4,2)=11`, `multichoose(5,3)=35`, an arithmetic-composition case,
  and arg-count guards. README quick-start updated.

## [3.12.0] — Matrix decompositions (SVD, Cholesky, pseudoinverse)

### Added
- **`math/decomposition.js`** — the factorizations that underpin least-squares,
  PCA, and low-rank work (complementing the LU/QR/eigen already in `matrix.js`):
  - `cholesky` — `A = L·Lᵀ` for symmetric positive-definite `A` (throws if not
    square / symmetric / positive-definite).
  - `svd` — the singular value decomposition `A = U·diag(S)·Vᵀ` by the
    one-sided (Hestenes) Jacobi method, for any shape (m<n handled by
    transposing); `S` descending, `U`/`V` with orthonormal columns.
  - `singularValues`, `conditionNumber` (σ_max/σ_min, ∞ when singular).
  - `pseudoInverse` — Moore–Penrose `A⁺` via the SVD (tolerance on σ).
  - `lstsq` — minimum-norm least-squares solution `x = A⁺·b`.
  - Exposed on the facade as `Decomposition`; capability manifest row added.
- Version → 3.12.0.
- 23 new tests (900 total / 29 suites), closed-form anchored: Cholesky of
  `[[4,2],[2,3]] = [[2,0],[1,√2]]` with `L·Lᵀ` reconstruction; SVD singular
  values of a diagonal = |diag| sorted descending; `U·Σ·Vᵀ` reconstruction for
  square/tall/wide matrices; orthonormal `U`/`V` columns; `cond(I)=1`,
  `cond(diag(1,100))=100`, singular → ∞; pseudoinverse = true inverse when
  invertible and the Moore–Penrose identity `A·A⁺·A = A`; least-squares exact
  fit of collinear points → intercept 0, slope 1.

## [3.11.0] — Combinatorics

### Added
- **`math/combinatorics.js`** — the classic counting sequences, computed with
  **BigInt** internally for exactness (Number wrapper + exact `…Big` variant,
  matching `numtheory.js`):
  - `catalan`, `bell`, `stirlingSecond`, `stirlingFirst` (unsigned),
    `partitions` (integer partition function), `derangements`, `multinomial`,
    `combinationsWithRepetition` (multichoose), and `factorialBig`.
  - Exposed on the facade as `Combinatorics`; capability manifest row added.
- Version → 3.11.0.
- 32 new tests (877 total / 28 suites), closed-form anchored: Catalan
  1,1,2,5,14,42,132; Bell 1,1,2,5,15,52,203; `S(4,2)=7`, `S(5,3)=25`;
  `c(4,2)=11` with Σₖ c(n,k)=n!; partitions 1,1,2,3,5,7,11 and `p(10)=42`;
  derangements 1,0,1,2,9,44,265; `multinomial([2,2,2])=90`;
  `multichoose(5,3)=35`; plus BigInt-exact spot checks (`25!`, `C(20)`,
  `B(15)`, `p(100)=190569292`, `D(20)`) and the Σₖ S(n,k)=Bell(n) identity.

## [3.10.0] — Vector geometry

### Added
- **`math/geometry.js`** — Euclidean operations on real n-vectors:
  - Linear: `add`, `sub`, `scale`, `negate`.
  - Products: `dot`, `cross` (3-D), `tripleProduct` (scalar).
  - Metric: `norm`, `distance`, `angleBetween` (cosine clamped for robustness).
  - Maps: `normalize`, `projection`, `reflect`, `lerp`, `centroid`.
  - Rotations: `rotate2D`, and `rotate3D` about an arbitrary axis (Rodrigues).
  - Exposed on the facade as `Geometry`; capability manifest row added.
- Version → 3.10.0.
- 34 new tests (845 total / 27 suites), closed-form anchored:
  `dot([1,2,3],[4,5,6]) = 32`, `x̂ × ŷ = ẑ` (and cyclic), cross ⟂ both operands
  and anti-commutative, `‖[3,4]‖ = 5`, angle(x̂,ŷ) = π/2, `normalize([3,4]) =
  [0.6,0.8]`, projection/reflection identities (double reflection = identity),
  triple product of the basis = 1 (degenerate = 0), `rotate2D(x̂,π/2) = ŷ`,
  `rotate3D(x̂,ẑ,π/2) = ŷ`, axis-fixed and length-preserving rotations.

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
