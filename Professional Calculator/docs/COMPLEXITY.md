# Algorithmic Complexity Reference

Time and space complexity for every non-trivial routine, with the data
structure / algorithm (DSA) behind it. `n` is the dominant input size
(string length, vector length, or matrix dimension). Constants are dropped;
where the constant matters in practice it is noted.

---

## Expression engine (`parser.js`)

| Operation | Time | Space | DSA / notes |
|---|---|---|---|
| `tokenize(src)` | O(n) | O(n) | single left-to-right scan; n = chars |
| `parse(tokens)` | O(t) | O(d) | Pratt / recursive descent; t = tokens, d = nesting depth (call-stack) |
| `evaluate(ast)` | O(N) | O(h) | post-order tree walk; N = nodes, h = tree height |
| `compute(src)` | O(n) | O(n) | tokenize + parse + evaluate end-to-end |

The parser is linear in input; there is no backtracking. Evaluation is linear in
AST size.

---

## Complex numbers (`complex.js`)

| Operation | Time | Notes |
|---|---|---|
| `add/sub/mul/neg/conj` | O(1) | |
| `div` | O(1) | Smith's algorithm (overflow-safe) |
| `abs/arg/exp/log/sqrt` | O(1) | hardware transcendentals |
| `powInt(z, n)` | O(log \|n\|) | **binary exponentiation** |
| `pow(a, b)` | O(1) | via `exp(b·log a)` (or `powInt` for integer b) |

---

## Exact rationals (`rational.js`)

`m` = bit-length of the BigInt operands.

| Operation | Time | Notes |
|---|---|---|
| `gcd(a, b)` | O(m²) | Euclidean algorithm on BigInts |
| `rational()` (normalize) | O(m²) | dominated by the gcd |
| `add/sub/mul/div` | O(m²) | cross-multiply + normalize |
| `powR(a, k)` | O(m² · log k) | binary exponentiation; result bits grow ∝ k |
| `cmpR` | O(m²) | cross-multiply compare |

---

## Special functions (`special.js`)

| Operation | Time | Notes |
|---|---|---|
| `gamma/lgamma` | O(1) | fixed 9-term Lanczos sum |
| `erf/erfc` | O(1) | fixed 24-term Chebyshev (`erfccheb`) |
| `beta/lbeta` | O(1) | three `lgamma` calls |
| `lowerGammaP/upperGammaQ` | O(k) | series or Lentz continued fraction; k = iterations to tol (≤ ~200, usually < 30) |
| `betaInc` | O(k) | Lentz continued fraction |
| `factorial(n)` | O(n) | iterative product |
| `combinations/permutations` | O(k) | multiplicative formula, k = min(k, n−k) |

The continued-fraction routines are **iteration-bounded**, not closed-form, but
converge in a small constant number of steps for all practical arguments.

---

## Linear algebra (`matrix.js`)

`n` = matrix dimension (square unless noted).

| Operation | Time | Space | DSA / notes |
|---|---|---|---|
| `add/sub/scale/transpose` | O(n²) | O(n²) | elementwise |
| `mul(A, B)` | O(n³) | O(n²) | naive i-k-j (cache-friendly); not Strassen |
| `matvec` | O(n²) | O(n) | |
| `lu(A)` | O(n³) | O(n²) | Doolittle, partial pivoting |
| `det(A)` | O(n³) | O(n²) | product of LU diagonal (O(1)/O(n³) for n≤2) |
| `solve(A, b)` | O(n³) | O(n²) | LU factor + O(n²) substitution per RHS |
| `inv(A)` | O(n³) | O(n²) | LU + n back-substitutions |
| `rank(A)` | O(n³) | O(n²) | Gaussian elimination with tolerance |
| `qr(A)` | O(n³) | O(n²) | Householder reflectors |
| `eigSymmetric(A)` | O(n³ · s) | O(n²) | cyclic Jacobi; s = sweeps (quadratic convergence, s small) |
| `eigenvalues(A)` | O(n³ + k·n²) | O(n²) | Hessenberg O(n³) + shifted QR; k = iterations |
| `normFro/norm1/normInf` | O(n²) | O(1) | |

**Empirical check.** `npm run bench` times mul/det/eig at n = 8, 16, 32, 64 and
confirms ~8× latency growth per dimension doubling — exactly the O(n³) signature.

---

## Calculus (`calculus.js`)

`f` evaluations are the cost unit (the integrand/derivative callback dominates).

| Operation | Time (f-evals) | Notes |
|---|---|---|
| `derivative` | O(R) | Richardson, R = 6 rows → 11 evals, fixed |
| `secondDerivative` | O(1) | 5 evals |
| `gradient` (n vars) | O(n) | 2n evals (central diff) |
| `integrate` (adaptive) | O(I) | I = intervals to reach tol; recursion depth ≤ maxDepth |
| `gaussLegendre` | O(1) | 5 evals, fixed |
| `bisection` | O(log(1/ε)) | linear convergence |
| `newton` | O(log log(1/ε)) | quadratic near simple roots |
| `secant` | O(log(1/ε)^φ) | superlinear (golden-ratio order) |
| `brent` | O(log(1/ε)) | superlinear, bracket-guaranteed |
| `rk4` (s steps) | O(s) | 4 evals/step |
| `rkf45` (adaptive) | O(s) | 6 evals/step; s chosen by error control |

---

## Statistics (`stats.js`)

`n` = sample size.

| Operation | Time | Notes |
|---|---|---|
| `sum/mean/variance/std` | O(n) | Kahan-compensated summation |
| `median/quantile/percentile/iqr` | O(n log n) | sort-based |
| `mode` | O(n) | hash map of counts |
| `skewness/kurtosis` | O(n) | |
| `covariance/correlation` | O(n) | single pass |
| `linearRegression` | O(n) | closed-form OLS |
| `normalPdf/Cdf` | O(1) | |
| `normalQuantile` | O(1) | Acklam rational + 1 Halley step |
| `tCdf/chiSquareCdf/fCdf` | O(k) | via incomplete beta/gamma (iteration-bounded) |
| `binomialCdf(k)` | O(k) | sum of pmf terms |
| `poissonCdf(k)` | O(k) | sum of pmf terms |

---

## Units (`units.js`)

All operations are O(1) — the dimension vector is fixed length 7.

| Operation | Time |
|---|---|
| `quantity/convert/addQ/subQ/mulQ/divQ/powQ/sameDim/formatDim` | O(1) |

---

## Finance (`finance.js`)

`n` = number of cash-flow periods.

| Operation | Time | Notes |
|---|---|---|
| `futureValue/presentValue/annuity*/payment/effectiveRate/cagr` | O(1) | |
| `npv` | O(n) | one pass over cash flows |
| `irr` | O(n · k) | Newton (k iters), each NPV is O(n); bisection fallback O(n · log(1/ε)) |
| `amortization` | O(n) | builds the n-row schedule |
| `blackScholes` | O(1) | closed form |

---

## Data structures

| Structure | Used in | Key ops & complexity |
|---|---|---|
| **CircularBuffer** | `history.js` | `push`/`pop`/`peek` all **O(1)**; fixed memory. Chosen over `Array.shift()` (which is O(n)) for the undo buffer. |
| **Tagged-union AST** | `parser.js` | O(1) node construction; O(N) traversal |
| **Frozen transition table** | `state.js` | O(1) transition validation via object lookup |
| **Hash map (counts)** | `stats.mode` | O(1) amortized insert/lookup |

---

## Summary

- **Linear or better** for all interactive single-value operations.
- **O(n³)** only for the dense linear-algebra kernels — unavoidable for general
  matrices without specialized (sparse/blocked/Strassen) methods, and verified
  to scale as documented.
- **Iteration-bounded** (effectively O(1) with a small constant) for the
  special-function continued fractions and root finders.
- No accidental quadratics: the undo buffer is a circular buffer, summation is
  single-pass, and the parser is backtrack-free.
