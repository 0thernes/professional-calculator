/**
 * @jest-environment node
 */
import {
    linearInterp, lagrange, lagrangeEval, newton, dividedDifferences, newtonEval,
    cubicSpline, polyfit, polyval,
} from '../../math/interpolate.js';
import { linearRegression } from '../../math/stats.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-9) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

describe('interpolate — piecewise linear', () => {
    const xs = [0, 1, 2];
    const ys = [0, 10, 20];
    test('exact at nodes', () => {
        near(linearInterp(xs, ys, 0), 0);
        near(linearInterp(xs, ys, 1), 10);
        near(linearInterp(xs, ys, 2), 20);
    });
    test('midpoint', () => near(linearInterp(xs, ys, 0.5), 5));
    test('clamps outside the range (NumPy interp convention)', () => {
        near(linearInterp(xs, ys, -5), 0);
        near(linearInterp(xs, ys, 99), 20);
    });
    test('uneven spacing', () => near(linearInterp([0, 2, 10], [0, 4, 4], 1), 2));
    test('requires increasing xs', () =>
        expect(() => linearInterp([0, 0, 1], [1, 2, 3], 0.5)).toThrow(RangeError));
});

describe('interpolate — Lagrange', () => {
    test('passes exactly through the nodes', () => {
        const xs = [0, 1, 2, 3];
        const ys = [1, 3, 2, 5];
        const f = lagrange(xs, ys);
        xs.forEach((x, i) => near(f(x), ys[i]));
    });
    test('recovers a parabola y = x²', () => {
        const xs = [0, 1, 2, 3];
        const ys = xs.map((x) => x * x);
        near(lagrangeEval(xs, ys, 1.5), 2.25);
        near(lagrangeEval(xs, ys, 2.5), 6.25);
    });
    test('distinct-nodes guard', () =>
        expect(() => lagrangeEval([1, 1], [2, 3], 0)).toThrow(RangeError));
});

describe('interpolate — Newton divided differences', () => {
    test('matches Lagrange everywhere (same unique polynomial)', () => {
        const xs = [-1, 0, 2, 3];
        const ys = [4, 1, 7, 25];
        const fN = newton(xs, ys);
        const fL = lagrange(xs, ys);
        for (let x = -1; x <= 3; x += 0.37) near(fN(x), fL(x), 1e-9);
    });
    test('leading divided difference of y=x² is 1', () => {
        const xs = [0, 1, 2];
        const coef = dividedDifferences(xs, xs.map((x) => x * x));
        near(coef[0], 0);   // f[x0] = 0
        near(coef[1], 1);   // f[x0,x1] = 1
        near(coef[2], 1);   // f[x0,x1,x2] = 1 (leading coeff of x²)
    });
    test('newtonEval reproduces nodes', () => {
        const xs = [1, 2, 4, 8];
        const ys = [0, 1, 2, 3];
        const coef = dividedDifferences(xs, ys);
        xs.forEach((x, i) => near(newtonEval(coef, xs, x), ys[i]));
    });
});

describe('interpolate — natural cubic spline', () => {
    test('passes exactly through the nodes', () => {
        const xs = [0, 1, 2, 3, 4];
        const ys = [0, 1, 0, 1, 0];
        const s = cubicSpline(xs, ys);
        xs.forEach((x, i) => near(s(x), ys[i], 1e-9));
    });
    test('reproduces a straight line everywhere', () => {
        const xs = [0, 1, 2, 3];
        const ys = xs.map((x) => 2 * x + 1);
        const s = cubicSpline(xs, ys);
        for (let x = 0; x <= 3; x += 0.25) near(s(x), 2 * x + 1, 1e-9);
    });
    test('continuous across a knot', () => {
        const xs = [0, 1, 2, 3];
        const ys = [1, 2, 0, 3];
        const s = cubicSpline(xs, ys);
        near(s(2 - 1e-6), s(2 + 1e-6), 1e-4);
    });
    test('natural end condition (clamps outside range)', () => {
        const xs = [0, 1, 2];
        const ys = [0, 1, 4];
        const s = cubicSpline(xs, ys);
        near(s(-1), s(0)); // clamped
        near(s(5), s(2));
    });
    test('two points → linear', () => {
        const s = cubicSpline([0, 2], [1, 5]);
        near(s(1), 3);
    });
});

describe('interpolate — polyval', () => {
    test('Horner with ascending coeffs', () => {
        near(polyval([1, 2, 3], 2), 1 + 4 + 12); // 17
        near(polyval([5], 99), 5);
        near(polyval([0, 0, 0, 1], 2), 8); // x³
    });
});

describe('interpolate — polyfit', () => {
    test('recovers exact quadratic coefficients', () => {
        const xs = [-2, -1, 0, 1, 2];
        const ys = xs.map((x) => 1 + 2 * x + 3 * x * x);
        const c = polyfit(xs, ys, 2);
        near(c[0], 1, 1e-6); near(c[1], 2, 1e-6); near(c[2], 3, 1e-6);
    });
    test('recovers exact cubic coefficients', () => {
        const xs = [-2, -1, 0, 1, 2, 3];
        const ys = xs.map((x) => 2 - x + 0.5 * x * x * x);
        const c = polyfit(xs, ys, 3);
        near(c[0], 2, 1e-6); near(c[1], -1, 1e-6);
        near(c[2], 0, 1e-6); near(c[3], 0.5, 1e-6);
    });
    test('degree-1 fit matches linear regression', () => {
        const xs = [1, 2, 3, 4, 5];
        const ys = [2.1, 3.9, 6.2, 7.8, 10.1];
        const c = polyfit(xs, ys, 1);
        const lr = linearRegression(xs, ys);
        near(c[0], lr.intercept, 1e-6);
        near(c[1], lr.slope, 1e-6);
    });
    test('fitted polynomial passes near noisy data (small residual)', () => {
        const xs = [0, 1, 2, 3, 4];
        const ys = [1.0, 2.1, 3.9, 9.1, 15.8]; // ~ x² + 1 with noise
        const c = polyfit(xs, ys, 2);
        const sse = xs.reduce((s, x, i) => s + (polyval(c, x) - ys[i]) ** 2, 0);
        expect(sse).toBeLessThan(1);
    });
    test('guards: degree and point count', () => {
        expect(() => polyfit([1, 2], [1, 2], -1)).toThrow(RangeError);
        expect(() => polyfit([1, 2], [1, 2], 2.5)).toThrow(RangeError);
        expect(() => polyfit([1, 2], [1, 2], 3)).toThrow(RangeError);
    });
});
