// @ts-check
/**
 * Numerical optimization — function minimization.
 *
 * Root finding (bisection, Newton, secant, Brent) already lives in
 * {@link module:math/calculus}; this module covers the complementary problem of
 * locating *minima*:
 *
 * - {@link goldenSection} — golden-section search for a unimodal 1-D function
 *   on a bracket (derivative-free, linear convergence, very robust).
 * - {@link minimizeNelderMead} — the Nelder–Mead downhill simplex for
 *   multivariate, derivative-free minimization.
 * - {@link gradientDescent} — steepest descent with Armijo backtracking line
 *   search; uses a supplied gradient, or a central-difference gradient
 *   (via {@link module:math/calculus.gradient}) when none is given.
 *
 * All routines return `{ x, fx, iterations }` and never mutate their inputs.
 * They find *local* minima — for multimodal objectives the result depends on
 * the starting point / bracket.
 *
 * @module math/optimize
 */

import { gradient as numericalGradient } from './calculus.js';

/** @typedef {{ x: number, fx: number, iterations: number }} Min1D */
/** @typedef {{ x: number[], fx: number, iterations: number }} MinND */

/** Reciprocal golden ratio, (√5 − 1) / 2 ≈ 0.6180339887. */
const INV_PHI = (Math.sqrt(5) - 1) / 2;

/* ------------------------------------------------------------------ *
 *  1-D: golden-section search
 * ------------------------------------------------------------------ */

/**
 * Minimize a unimodal function `f` on the bracket `[a, b]` by golden-section
 * search. Converges linearly, shrinking the bracket by a factor of φ⁻¹ each
 * step; needs no derivatives.
 * @param {(x: number) => number} f
 * @param {number} a
 * @param {number} b
 * @param {{ tol?: number, maxIter?: number }} [opts]
 * @returns {Min1D}
 */
export function goldenSection(f, a, b, opts = {}) {
    const tol = opts.tol ?? 1e-8;
    const maxIter = opts.maxIter ?? 200;
    let lo = Math.min(a, b);
    let hi = Math.max(a, b);
    let c = hi - INV_PHI * (hi - lo);
    let d = lo + INV_PHI * (hi - lo);
    let fc = f(c);
    let fd = f(d);
    let iterations = 0;
    while (hi - lo > tol && iterations < maxIter) {
        if (fc < fd) {
            hi = d;
            d = c;
            fd = fc;
            c = hi - INV_PHI * (hi - lo);
            fc = f(c);
        } else {
            lo = c;
            c = d;
            fc = fd;
            d = lo + INV_PHI * (hi - lo);
            fd = f(d);
        }
        iterations++;
    }
    const x = (lo + hi) / 2;
    return { x, fx: f(x), iterations };
}

/* ------------------------------------------------------------------ *
 *  N-D: Nelder–Mead downhill simplex
 * ------------------------------------------------------------------ */

/**
 * Minimize a multivariate function with the Nelder–Mead simplex method
 * (reflection / expansion / contraction / shrink). Derivative-free and a good
 * default when gradients are unavailable or noisy.
 * @param {(x: number[]) => number} f
 * @param {ReadonlyArray<number>} x0 initial guess
 * @param {{ tol?: number, maxIter?: number, step?: number }} [opts]
 * @returns {MinND}
 */
export function minimizeNelderMead(f, x0, opts = {}) {
    const tol = opts.tol ?? 1e-10;
    const maxIter = opts.maxIter ?? 2000;
    const step = opts.step ?? 1;
    const n = x0.length;
    const alpha = 1;
    const gamma = 2;
    const rho = 0.5;
    const sigma = 0.5;

    // Initial simplex: x0 plus one perturbed vertex per dimension.
    let simplex = [Array.from(x0)];
    for (let i = 0; i < n; i++) {
        const v = Array.from(x0);
        v[i] += v[i] !== 0 ? 0.05 * v[i] : step;
        simplex.push(v);
    }
    let fvals = simplex.map(f);
    let iterations = 0;

    for (; iterations < maxIter; iterations++) {
        // Sort vertices best → worst.
        const order = fvals.map((_, i) => i).sort((p, q) => fvals[p] - fvals[q]);
        simplex = order.map((i) => simplex[i]);
        fvals = order.map((i) => fvals[i]);

        // Converged when best/worst objective values are within tolerance.
        if (Math.abs(fvals[n] - fvals[0])
            <= tol * (Math.abs(fvals[0]) + Math.abs(fvals[n])) + tol) {
            break;
        }

        // Centroid of all vertices except the worst.
        const centroid = new Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) centroid[j] += simplex[i][j] / n;
        }

        const worst = simplex[n];
        const xr = centroid.map((cj, j) => cj + alpha * (cj - worst[j]));
        const fr = f(xr);

        if (fr < fvals[0]) {
            // Expand.
            const xe = centroid.map((cj, j) => cj + gamma * (xr[j] - cj));
            const fe = f(xe);
            if (fe < fr) { simplex[n] = xe; fvals[n] = fe; }
            else { simplex[n] = xr; fvals[n] = fr; }
        } else if (fr < fvals[n - 1]) {
            // Accept reflection.
            simplex[n] = xr;
            fvals[n] = fr;
        } else {
            // Contract.
            let shrink = false;
            if (fr < fvals[n]) {
                const xoc = centroid.map((cj, j) => cj + rho * (xr[j] - cj));
                const foc = f(xoc);
                if (foc <= fr) { simplex[n] = xoc; fvals[n] = foc; }
                else shrink = true;
            } else {
                const xic = centroid.map((cj, j) => cj - rho * (cj - worst[j]));
                const fic = f(xic);
                if (fic < fvals[n]) { simplex[n] = xic; fvals[n] = fic; }
                else shrink = true;
            }
            if (shrink) {
                const best = simplex[0];
                for (let i = 1; i <= n; i++) {
                    simplex[i] = simplex[i].map((v, j) => best[j] + sigma * (v - best[j]));
                    fvals[i] = f(simplex[i]);
                }
            }
        }
    }

    let bi = 0;
    for (let i = 1; i <= n; i++) if (fvals[i] < fvals[bi]) bi = i;
    return { x: simplex[bi], fx: fvals[bi], iterations };
}

/* ------------------------------------------------------------------ *
 *  N-D: gradient descent with backtracking line search
 * ------------------------------------------------------------------ */

/**
 * Minimize `f` by steepest descent with an Armijo backtracking line search.
 * Supply an analytic gradient `grad` for speed/accuracy; pass `null` to use a
 * central-difference gradient.
 * @param {(x: number[]) => number} f
 * @param {((x: number[]) => number[]) | null} grad
 * @param {ReadonlyArray<number>} x0
 * @param {{ tol?: number, maxIter?: number, step?: number }} [opts]
 * @returns {MinND}
 */
export function gradientDescent(f, grad, x0, opts = {}) {
    const g = grad ?? ((/** @type {number[]} */ x) => numericalGradient(f, x));
    const tol = opts.tol ?? 1e-8;
    const maxIter = opts.maxIter ?? 10000;
    const step0 = opts.step ?? 1;
    const c = 1e-4; // Armijo sufficient-decrease constant
    let x = Array.from(x0);
    let iterations = 0;

    for (; iterations < maxIter; iterations++) {
        const gr = g(x);
        const gnorm2 = gr.reduce((s, v) => s + v * v, 0);
        if (Math.sqrt(gnorm2) < tol) break;
        const fx = f(x);
        let t = step0;
        // Backtrack until the Armijo condition holds.
        while (t > 1e-16) {
            const xn = x.map((xi, j) => xi - t * gr[j]);
            if (f(xn) <= fx - c * t * gnorm2) {
                x = xn;
                break;
            }
            t *= 0.5;
        }
        if (t <= 1e-16) break; // line search stalled — at a minimum
    }

    return { x, fx: f(x), iterations };
}
