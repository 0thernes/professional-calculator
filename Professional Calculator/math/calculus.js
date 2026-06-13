// @ts-check
/**
 * Numerical calculus: differentiation, integration, root-finding, and ODE
 * integration. Functions are taken as plain `(x:number)=>number` callbacks,
 * so anything the parser can build can be fed straight in.
 *
 * Methods and accuracy:
 *  - {@link derivative}        Richardson-extrapolated central difference,
 *                              ~1e-10 relative on smooth functions.
 *  - {@link integrate}         adaptive Simpson with per-interval error
 *                              control; falls back through recursion depth.
 *  - {@link gaussLegendre}     fixed 5-point Gauss–Legendre (exact for
 *                              polynomials up to degree 9).
 *  - {@link bisection}         bracketing, guaranteed linear convergence.
 *  - {@link newton}            quadratic convergence with numerical f'.
 *  - {@link brent}             Brent's method — bracketing + inverse-quadratic,
 *                              superlinear and robust.
 *  - {@link rk4}               classic fixed-step Runge–Kutta (4th order).
 *  - {@link rkf45}             Runge–Kutta–Fehlberg adaptive (4(5) order).
 *
 * @module math/calculus
 */

/** @typedef {(x: number) => number} RealFn */
/** @typedef {(t: number, y: number[]) => number[]} ODEFn */

/* ------------------------------------------------------------------ *
 *  Differentiation
 * ------------------------------------------------------------------ */

/**
 * Numerical derivative f'(x) via Richardson extrapolation of the central
 * difference. Halves h repeatedly and Richardson-combines to cancel
 * successive error terms.
 * @param {RealFn} f
 * @param {number} x
 * @param {number} [h]  initial step (default scaled to x)
 * @returns {number}
 */
export function derivative(f, x, h) {
    const h0 = h ?? Math.max(1e-4, Math.abs(x) * 1e-4);
    const ROWS = 6;
    /** @type {number[][]} */
    const T = [];
    let step = h0;
    for (let i = 0; i < ROWS; i++) {
        T.push([(f(x + step) - f(x - step)) / (2 * step)]);
        step /= 2;
    }
    // Richardson: each column cancels the next error order (O(h²ᵏ)).
    for (let j = 1; j < ROWS; j++) {
        const factor = 4 ** j;
        for (let i = j; i < ROWS; i++) {
            T[i][j] = (factor * T[i][j - 1] - T[i - 1][j - 1]) / (factor - 1);
        }
    }
    return T[ROWS - 1][ROWS - 1];
}

/**
 * Second derivative via the standard central three-point stencil with
 * Richardson refinement.
 * @param {RealFn} f
 * @param {number} x
 * @param {number} [h]
 * @returns {number}
 */
export function secondDerivative(f, x, h) {
    const step = h ?? Math.max(1e-3, Math.abs(x) * 1e-3);
    const coarse = (f(x + step) - 2 * f(x) + f(x - step)) / (step * step);
    const hf = step / 2;
    const fine = (f(x + hf) - 2 * f(x) + f(x - hf)) / (hf * hf);
    return (4 * fine - coarse) / 3; // Richardson (cancels O(h²))
}

/**
 * Gradient of a scalar field g: R^n → R at a point (central differences).
 * @param {(v: number[]) => number} g
 * @param {number[]} point
 * @param {number} [h]
 * @returns {number[]}
 */
export function gradient(g, point, h = 1e-6) {
    return point.map((_, i) => {
        const fwd = point.slice();
        const bwd = point.slice();
        fwd[i] += h;
        bwd[i] -= h;
        return (g(fwd) - g(bwd)) / (2 * h);
    });
}

/* ------------------------------------------------------------------ *
 *  Integration
 * ------------------------------------------------------------------ */

/**
 * Definite integral ∫ₐᵇ f via adaptive Simpson's rule with absolute +
 * relative error control and a recursion-depth guard.
 * @param {RealFn} f
 * @param {number} a
 * @param {number} b
 * @param {number} [tol]
 * @param {number} [maxDepth]
 * @returns {number}
 */
export function integrate(f, a, b, tol = 1e-10, maxDepth = 50) {
    if (a === b) return 0;
    if (a > b) return -integrate(f, b, a, tol, maxDepth);
    const fa = f(a);
    const fb = f(b);
    const m = (a + b) / 2;
    const fm = f(m);
    const whole = ((b - a) / 6) * (fa + 4 * fm + fb);
    return adaptiveSimpson(f, a, b, fa, fb, fm, whole, tol, maxDepth);
}

/**
 * @param {RealFn} f @param {number} a @param {number} b
 * @param {number} fa @param {number} fb @param {number} fm
 * @param {number} whole @param {number} tol @param {number} depth
 * @returns {number}
 */
function adaptiveSimpson(f, a, b, fa, fb, fm, whole, tol, depth) {
    const m = (a + b) / 2;
    const lm = (a + m) / 2;
    const rm = (m + b) / 2;
    const flm = f(lm);
    const frm = f(rm);
    const left = ((m - a) / 6) * (fa + 4 * flm + fm);
    const right = ((b - m) / 6) * (fm + 4 * frm + fb);
    const both = left + right;
    if (depth <= 0 || Math.abs(both - whole) <= 15 * tol) {
        return both + (both - whole) / 15; // Richardson correction
    }
    return (
        adaptiveSimpson(f, a, m, fa, fm, flm, left, tol / 2, depth - 1) +
        adaptiveSimpson(f, m, b, fm, fb, frm, right, tol / 2, depth - 1)
    );
}

/** 5-point Gauss–Legendre nodes/weights on [-1,1]. */
const GL5_X = [
    -0.906179845938664, -0.538469310105683, 0, 0.538469310105683, 0.906179845938664,
];
const GL5_W = [
    0.236926885056189, 0.478628670499366, 0.568888888888889, 0.478628670499366, 0.236926885056189,
];

/**
 * Fixed 5-point Gauss–Legendre quadrature (exact for degree ≤ 9). Fast and
 * allocation-free; ideal for smooth integrands where adaptivity is overkill.
 * @param {RealFn} f
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function gaussLegendre(f, a, b) {
    const c1 = (b - a) / 2;
    const c2 = (b + a) / 2;
    let s = 0;
    for (let i = 0; i < 5; i++) s += GL5_W[i] * f(c1 * GL5_X[i] + c2);
    return c1 * s;
}

/* ------------------------------------------------------------------ *
 *  Root finding
 * ------------------------------------------------------------------ */

/**
 * Bisection on a sign-changing bracket [a,b]. Guaranteed convergence.
 * @param {RealFn} f
 * @param {number} a
 * @param {number} b
 * @param {number} [tol]
 * @param {number} [maxIter]
 * @returns {number}
 */
export function bisection(f, a, b, tol = 1e-12, maxIter = 200) {
    let fa = f(a);
    let fb = f(b);
    if (fa === 0) return a;
    if (fb === 0) return b;
    if (fa * fb > 0) throw new RangeError('bisection: f(a) and f(b) must have opposite signs');
    for (let i = 0; i < maxIter; i++) {
        const m = (a + b) / 2;
        const fm = f(m);
        if (fm === 0 || (b - a) / 2 < tol) return m;
        if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
    }
    return (a + b) / 2;
}

/**
 * Newton–Raphson from an initial guess, using a numerical derivative when
 * none is supplied. Quadratic convergence near simple roots.
 * @param {RealFn} f
 * @param {number} x0
 * @param {object} [opts]
 * @param {RealFn} [opts.df]
 * @param {number} [opts.tol]
 * @param {number} [opts.maxIter]
 * @returns {number}
 */
export function newton(f, x0, opts = {}) {
    const { df, tol = 1e-12, maxIter = 100 } = opts;
    let x = x0;
    for (let i = 0; i < maxIter; i++) {
        const fx = f(x);
        if (Math.abs(fx) < tol) return x;
        const d = df ? df(x) : derivative(f, x);
        if (d === 0) throw new RangeError('newton: zero derivative');
        const next = x - fx / d;
        if (Math.abs(next - x) < tol) return next;
        x = next;
    }
    return x;
}

/**
 * Secant method (no derivative needed).
 * @param {RealFn} f
 * @param {number} x0
 * @param {number} x1
 * @param {number} [tol]
 * @param {number} [maxIter]
 * @returns {number}
 */
export function secant(f, x0, x1, tol = 1e-12, maxIter = 100) {
    let f0 = f(x0);
    let f1 = f(x1);
    for (let i = 0; i < maxIter; i++) {
        if (Math.abs(f1) < tol) return x1;
        const denom = f1 - f0;
        if (denom === 0) break;
        const x2 = x1 - (f1 * (x1 - x0)) / denom;
        x0 = x1; f0 = f1; x1 = x2; f1 = f(x2);
        if (Math.abs(x1 - x0) < tol) return x1;
    }
    return x1;
}

/**
 * Brent's method — combines bisection, secant and inverse-quadratic
 * interpolation for robust, superlinear convergence on a bracket.
 * @param {RealFn} f
 * @param {number} a
 * @param {number} b
 * @param {number} [tol]
 * @param {number} [maxIter]
 * @returns {number}
 */
export function brent(f, a, b, tol = 1e-12, maxIter = 200) {
    let fa = f(a);
    let fb = f(b);
    if (fa * fb > 0) throw new RangeError('brent: root must be bracketed');
    if (Math.abs(fa) < Math.abs(fb)) { [a, b] = [b, a]; [fa, fb] = [fb, fa]; }
    let c = a;
    let fc = fa;
    let d = b - a;
    let mflag = true;
    for (let i = 0; i < maxIter; i++) {
        if (fb === 0 || Math.abs(b - a) < tol) return b;
        let s;
        if (fa !== fc && fb !== fc) {
            // inverse quadratic interpolation
            s =
                (a * fb * fc) / ((fa - fb) * (fa - fc)) +
                (b * fa * fc) / ((fb - fa) * (fb - fc)) +
                (c * fa * fb) / ((fc - fa) * (fc - fb));
        } else {
            // secant
            s = b - (fb * (b - a)) / (fb - fa);
        }
        const lo = (3 * a + b) / 4;
        const cond1 = !((s > Math.min(lo, b) && s < Math.max(lo, b)));
        const cond2 = mflag && Math.abs(s - b) >= Math.abs(b - c) / 2;
        const cond3 = !mflag && Math.abs(s - b) >= Math.abs(c - d) / 2;
        const cond4 = mflag && Math.abs(b - c) < tol;
        const cond5 = !mflag && Math.abs(c - d) < tol;
        if (cond1 || cond2 || cond3 || cond4 || cond5) {
            s = (a + b) / 2;
            mflag = true;
        } else {
            mflag = false;
        }
        const fs = f(s);
        d = c;
        c = b;
        fc = fb;
        if (fa * fs < 0) { b = s; fb = fs; } else { a = s; fa = fs; }
        if (Math.abs(fa) < Math.abs(fb)) { [a, b] = [b, a]; [fa, fb] = [fb, fa]; }
    }
    return b;
}

/* ------------------------------------------------------------------ *
 *  ODE integration
 * ------------------------------------------------------------------ */

/**
 * @typedef {object} ODESolution
 * @property {number[]} t   sample times
 * @property {number[][]} y state vectors at each time (y[k] is the state at t[k])
 */

/**
 * Classic fixed-step RK4 for y' = f(t, y), y(t0) = y0.
 * @param {ODEFn} f
 * @param {number} t0
 * @param {number} t1
 * @param {number[]} y0
 * @param {number} steps
 * @returns {ODESolution}
 */
export function rk4(f, t0, t1, y0, steps = 100) {
    const h = (t1 - t0) / steps;
    const ts = [t0];
    const ys = [y0.slice()];
    let t = t0;
    let y = y0.slice();
    for (let i = 0; i < steps; i++) {
        const k1 = f(t, y);
        const k2 = f(t + h / 2, addScaled(y, k1, h / 2));
        const k3 = f(t + h / 2, addScaled(y, k2, h / 2));
        const k4 = f(t + h, addScaled(y, k3, h));
        y = y.map((yi, j) => yi + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
        t += h;
        ts.push(t);
        ys.push(y.slice());
    }
    return { t: ts, y: ys };
}

/** Cash–Karp / Fehlberg coefficients used by {@link rkf45}. */
const RKF_A = [0, 1 / 4, 3 / 8, 12 / 13, 1, 1 / 2];
const RKF_B = [
    [],
    [1 / 4],
    [3 / 32, 9 / 32],
    [1932 / 2197, -7200 / 2197, 7296 / 2197],
    [439 / 216, -8, 3680 / 513, -845 / 4104],
    [-8 / 27, 2, -3544 / 2565, 1859 / 4104, -11 / 40],
];
const RKF_C4 = [25 / 216, 0, 1408 / 2565, 2197 / 4104, -1 / 5, 0];
const RKF_C5 = [16 / 135, 0, 6656 / 12825, 28561 / 56430, -9 / 50, 2 / 55];

/**
 * Adaptive Runge–Kutta–Fehlberg 4(5): steps to a target tolerance, shrinking
 * or growing h based on the embedded 4th/5th-order error estimate.
 * @param {ODEFn} f
 * @param {number} t0
 * @param {number} t1
 * @param {number[]} y0
 * @param {object} [opts]
 * @param {number} [opts.tol]
 * @param {number} [opts.hInit]
 * @param {number} [opts.maxSteps]
 * @returns {ODESolution}
 */
export function rkf45(f, t0, t1, y0, opts = {}) {
    const { tol = 1e-8, hInit = (t1 - t0) / 100, maxSteps = 100000 } = opts;
    const ts = [t0];
    const ys = [y0.slice()];
    let t = t0;
    let y = y0.slice();
    let h = hInit;
    let count = 0;
    while (t < t1 - 1e-15 && count++ < maxSteps) {
        if (t + h > t1) h = t1 - t;
        const k = [];
        for (let i = 0; i < 6; i++) {
            let yi = y.slice();
            for (let j = 0; j < i; j++) {
                const bij = RKF_B[i][j];
                if (bij) yi = addScaled(yi, k[j], h * bij);
            }
            k.push(f(t + RKF_A[i] * h, yi));
        }
        const y4 = y.map((yi, idx) => yi + h * sumStage(RKF_C4, k, idx));
        const y5 = y.map((yi, idx) => yi + h * sumStage(RKF_C5, k, idx));
        // error estimate
        let err = 0;
        for (let idx = 0; idx < y.length; idx++) err = Math.max(err, Math.abs(y5[idx] - y4[idx]));
        if (err <= tol || h <= 1e-14) {
            t += h;
            y = y5;
            ts.push(t);
            ys.push(y.slice());
        }
        // adapt step size (clamp growth/shrink)
        const s = err === 0 ? 2 : 0.84 * Math.pow(tol / err, 0.25);
        h *= Math.min(4, Math.max(0.1, s));
    }
    return { t: ts, y: ys };
}

/* -------- internals -------- */

/** @param {number[]} y @param {number[]} k @param {number} scale @returns {number[]} */
function addScaled(y, k, scale) {
    return y.map((yi, j) => yi + scale * k[j]);
}
/** @param {number[]} c @param {number[][]} k @param {number} idx @returns {number} */
function sumStage(c, k, idx) {
    let s = 0;
    for (let i = 0; i < c.length; i++) if (c[i]) s += c[i] * k[i][idx];
    return s;
}
