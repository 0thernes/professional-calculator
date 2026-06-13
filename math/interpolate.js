// @ts-check
/**
 * Interpolation & curve fitting.
 *
 * Exact interpolation through a set of nodes — piecewise-linear, the Lagrange
 * and Newton divided-difference polynomials (mathematically identical, kept as
 * a cross-check), and the natural cubic spline (C² continuous, zero curvature
 * at the ends) — plus least-squares polynomial fitting (`polyfit`) for noisy or
 * over-determined data, solved through the normal equations with the engine's
 * own LU `solve`. `polyval` evaluates a coefficient vector by Horner's rule.
 *
 * Coefficient vectors are **ascending**: `[c₀, c₁, …, c_d]` means
 * c₀ + c₁x + … + c_d·x^d. Node arrays for the interpolators must be the same
 * length; the linear and spline routines additionally require strictly
 * increasing `xs`.
 *
 * @module math/interpolate
 */

import { solve } from './matrix.js';

/* ------------------------------------------------------------------ *
 *  Validation helpers
 * ------------------------------------------------------------------ */

/**
 * @param {ReadonlyArray<number>} xs
 * @param {ReadonlyArray<number>} ys
 * @returns {void}
 */
function checkPairs(xs, ys) {
    if (xs.length !== ys.length) {
        throw new RangeError('xs and ys must have equal length');
    }
    if (xs.length === 0) throw new RangeError('need at least one point');
}

/**
 * @param {ReadonlyArray<number>} xs
 * @returns {void}
 */
function checkIncreasing(xs) {
    for (let i = 1; i < xs.length; i++) {
        if (xs[i] <= xs[i - 1]) {
            throw new RangeError('xs must be strictly increasing');
        }
    }
}

/* ------------------------------------------------------------------ *
 *  Piecewise-linear interpolation
 * ------------------------------------------------------------------ */

/**
 * Piecewise-linear interpolation at `x`. `xs` must be strictly increasing.
 * Values of `x` outside [xs[0], xs[n−1]] are clamped to the nearest endpoint
 * (matching NumPy's `interp`).
 * @param {ReadonlyArray<number>} xs
 * @param {ReadonlyArray<number>} ys
 * @param {number} x
 * @returns {number}
 */
export function linearInterp(xs, ys, x) {
    checkPairs(xs, ys);
    checkIncreasing(xs);
    const n = xs.length;
    if (n === 1) return ys[0];
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    // binary search for the interval [xs[i], xs[i+1]] containing x
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (xs[mid] <= x) lo = mid;
        else hi = mid;
    }
    const t = (x - xs[lo]) / (xs[hi] - xs[lo]);
    return ys[lo] + t * (ys[hi] - ys[lo]);
}

/* ------------------------------------------------------------------ *
 *  Lagrange interpolation
 * ------------------------------------------------------------------ */

/**
 * Evaluate the Lagrange interpolating polynomial through (xs, ys) at `x`.
 * The `xs` must be distinct. O(n²) per evaluation.
 * @param {ReadonlyArray<number>} xs
 * @param {ReadonlyArray<number>} ys
 * @param {number} x
 * @returns {number}
 */
export function lagrangeEval(xs, ys, x) {
    checkPairs(xs, ys);
    const n = xs.length;
    let sum = 0;
    for (let i = 0; i < n; i++) {
        let term = ys[i];
        for (let j = 0; j < n; j++) {
            if (j === i) continue;
            const denom = xs[i] - xs[j];
            if (denom === 0) throw new RangeError('xs must be distinct');
            term *= (x - xs[j]) / denom;
        }
        sum += term;
    }
    return sum;
}

/**
 * Build a reusable Lagrange interpolant as a function of `x`.
 * @param {ReadonlyArray<number>} xs
 * @param {ReadonlyArray<number>} ys
 * @returns {(x: number) => number}
 */
export function lagrange(xs, ys) {
    checkPairs(xs, ys);
    const X = Array.from(xs);
    const Y = Array.from(ys);
    return (x) => lagrangeEval(X, Y, x);
}

/* ------------------------------------------------------------------ *
 *  Newton divided differences
 * ------------------------------------------------------------------ */

/**
 * Newton divided-difference coefficients for the interpolant through (xs, ys).
 * Returns the leading coefficients [f[x₀], f[x₀,x₁], …] used by
 * {@link newtonEval}.
 * @param {ReadonlyArray<number>} xs
 * @param {ReadonlyArray<number>} ys
 * @returns {number[]}
 */
export function dividedDifferences(xs, ys) {
    checkPairs(xs, ys);
    const n = xs.length;
    const coef = Array.from(ys);
    for (let level = 1; level < n; level++) {
        for (let i = n - 1; i >= level; i--) {
            const denom = xs[i] - xs[i - level];
            if (denom === 0) throw new RangeError('xs must be distinct');
            coef[i] = (coef[i] - coef[i - 1]) / denom;
        }
    }
    return coef;
}

/**
 * Evaluate the Newton form at `x` given divided-difference `coef` and the
 * original `xs` (nested / Horner-like, O(n)).
 * @param {ReadonlyArray<number>} coef
 * @param {ReadonlyArray<number>} xs
 * @param {number} x
 * @returns {number}
 */
export function newtonEval(coef, xs, x) {
    const n = coef.length;
    let result = coef[n - 1];
    for (let i = n - 2; i >= 0; i--) {
        result = result * (x - xs[i]) + coef[i];
    }
    return result;
}

/**
 * Build a reusable Newton interpolant as a function of `x`.
 * @param {ReadonlyArray<number>} xs
 * @param {ReadonlyArray<number>} ys
 * @returns {(x: number) => number}
 */
export function newton(xs, ys) {
    const X = Array.from(xs);
    const coef = dividedDifferences(X, ys);
    return (x) => newtonEval(coef, X, x);
}

/* ------------------------------------------------------------------ *
 *  Natural cubic spline
 * ------------------------------------------------------------------ */

/**
 * Build a **natural** cubic spline interpolant (second derivative = 0 at both
 * ends) through (xs, ys). `xs` must be strictly increasing. Returns a function
 * that evaluates the spline at any `x` (clamped to the data range), C²
 * continuous on the interior.
 *
 * Solves the standard symmetric tridiagonal system for the knot second
 * derivatives via the Thomas algorithm.
 * @param {ReadonlyArray<number>} xs
 * @param {ReadonlyArray<number>} ys
 * @returns {(x: number) => number}
 */
export function cubicSpline(xs, ys) {
    checkPairs(xs, ys);
    checkIncreasing(xs);
    const n = xs.length;
    const X = Array.from(xs);
    const Y = Array.from(ys);

    if (n === 1) return () => Y[0];
    if (n === 2) {
        return (x) => linearInterp(X, Y, x);
    }

    const h = new Array(n - 1);
    for (let i = 0; i < n - 1; i++) h[i] = X[i + 1] - X[i];

    // Tridiagonal system A·m = d for interior second derivatives m[1..n-2];
    // natural ends fix m[0] = m[n-1] = 0.
    const sub = new Array(n).fill(0);   // sub-diagonal
    const diag = new Array(n).fill(1);  // main diagonal
    const sup = new Array(n).fill(0);   // super-diagonal
    const rhs = new Array(n).fill(0);
    for (let i = 1; i < n - 1; i++) {
        sub[i] = h[i - 1];
        diag[i] = 2 * (h[i - 1] + h[i]);
        sup[i] = h[i];
        rhs[i] = 6 * ((Y[i + 1] - Y[i]) / h[i] - (Y[i] - Y[i - 1]) / h[i - 1]);
    }

    // Thomas algorithm (rows 0 and n-1 are the trivial m=0 equations).
    const cp = new Array(n).fill(0);
    const dp = new Array(n).fill(0);
    cp[0] = sup[0] / diag[0];
    dp[0] = rhs[0] / diag[0];
    for (let i = 1; i < n; i++) {
        const denom = diag[i] - sub[i] * cp[i - 1];
        cp[i] = sup[i] / denom;
        dp[i] = (rhs[i] - sub[i] * dp[i - 1]) / denom;
    }
    const m = new Array(n).fill(0);
    m[n - 1] = dp[n - 1];
    for (let i = n - 2; i >= 0; i--) m[i] = dp[i] - cp[i] * m[i + 1];

    return (x) => {
        let xx = x;
        if (xx <= X[0]) xx = X[0];
        if (xx >= X[n - 1]) xx = X[n - 1];
        // locate interval
        let lo = 0;
        let hi = n - 1;
        while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (X[mid] <= xx) lo = mid;
            else hi = mid;
        }
        const hi_ = lo + 1;
        const dx = X[hi_] - X[lo];
        const a = (X[hi_] - xx) / dx;
        const b = (xx - X[lo]) / dx;
        return (
            a * Y[lo]
            + b * Y[hi_]
            + ((a * a * a - a) * m[lo] + (b * b * b - b) * m[hi_]) * (dx * dx) / 6
        );
    };
}

/* ------------------------------------------------------------------ *
 *  Polynomial least-squares fit + evaluation
 * ------------------------------------------------------------------ */

/**
 * Evaluate a polynomial with **ascending** coefficients at `x` by Horner's
 * rule: `polyval([c0,c1,c2], x) = c0 + c1·x + c2·x²`.
 * @param {ReadonlyArray<number>} coeffs
 * @param {number} x
 * @returns {number}
 */
export function polyval(coeffs, x) {
    let result = 0;
    for (let i = coeffs.length - 1; i >= 0; i--) result = result * x + coeffs[i];
    return result;
}

/**
 * Least-squares polynomial fit of degree `degree` to (xs, ys), returning
 * **ascending** coefficients `[c₀, …, c_degree]`. Built from the normal
 * equations `(VᵀV)c = Vᵀy` (V the Vandermonde matrix), solved with LU.
 *
 * For a degree-1 fit this reproduces ordinary linear regression
 * (`[intercept, slope]`); for data lying exactly on a degree-d polynomial it
 * recovers that polynomial's coefficients. Requires `degree ≥ 0` and at least
 * `degree + 1` points.
 * @param {ReadonlyArray<number>} xs
 * @param {ReadonlyArray<number>} ys
 * @param {number} degree
 * @returns {number[]}
 */
export function polyfit(xs, ys, degree) {
    checkPairs(xs, ys);
    if (!Number.isInteger(degree) || degree < 0) {
        throw new RangeError('degree must be a non-negative integer');
    }
    const n = xs.length;
    if (n < degree + 1) {
        throw new RangeError('need at least degree + 1 points');
    }
    const d = degree;

    // Power sums S[p] = Σ xᵢ^p for p = 0…2d, and T[j] = Σ yᵢ·xᵢ^j for j = 0…d.
    const S = new Array(2 * d + 1).fill(0);
    const T = new Array(d + 1).fill(0);
    for (let i = 0; i < n; i++) {
        let pw = 1;
        for (let p = 0; p <= 2 * d; p++) {
            S[p] += pw;
            if (p <= d) T[p] += ys[i] * pw;
            pw *= xs[i];
        }
    }

    // Normal matrix A[j][k] = S[j+k]; right-hand side T.
    const A = Array.from({ length: d + 1 }, (_, j) =>
        Array.from({ length: d + 1 }, (_, k) => S[j + k]));
    return solve(A, T);
}
