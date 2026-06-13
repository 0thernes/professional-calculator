/**
 * @jest-environment node
 */
import { goldenSection, minimizeNelderMead, gradientDescent } from '../../math/optimize.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-6) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

describe('optimize — golden-section (1D)', () => {
    test('minimizes (x − 2)² → x = 2', () => {
        const r = goldenSection((x) => (x - 2) ** 2, -5, 10);
        near(r.x, 2, 1e-6);
        near(r.fx, 0, 1e-10);
    });
    test('minimizes −sin on [0, π] → x = π/2, fx = −1', () => {
        const r = goldenSection((x) => -Math.sin(x), 0, Math.PI);
        near(r.x, Math.PI / 2, 1e-5);
        near(r.fx, -1, 1e-9);
    });
    test('handles a reversed bracket', () => {
        const r = goldenSection((x) => (x + 3) ** 2, 5, -10);
        near(r.x, -3, 1e-6);
    });
    test('quartic with min at x = 1', () => {
        // f = (x−1)^4 + 2 → min 2 at x=1
        const r = goldenSection((x) => (x - 1) ** 4 + 2, -2, 4);
        near(r.x, 1, 1e-3);
        near(r.fx, 2, 1e-8);
    });
});

// Multivariate objectives/gradients take a number[] and index it — destructured
// arrow params (`([x, y]) => …`) would be inferred as implicit-any tuples under
// strict checkJs and fail to match the `(x: number[]) => …` signatures.

describe('optimize — Nelder–Mead (N-D)', () => {
    test('sphere x²+y² → origin', () => {
        const r = minimizeNelderMead((v) => v[0] ** 2 + v[1] ** 2, [3, 3]);
        near(r.x[0], 0, 1e-4);
        near(r.x[1], 0, 1e-4);
        near(r.fx, 0, 1e-8);
    });
    test('shifted bowl → (1, −2)', () => {
        const r = minimizeNelderMead((v) => (v[0] - 1) ** 2 + (v[1] + 2) ** 2, [0, 0]);
        near(r.x[0], 1, 1e-4);
        near(r.x[1], -2, 1e-4);
    });
    test('Rosenbrock banana → (1, 1)', () => {
        const rosen = (/** @type {number[]} */ v) =>
            (1 - v[0]) ** 2 + 100 * (v[1] - v[0] * v[0]) ** 2;
        const r = minimizeNelderMead(rosen, [-1.2, 1], { tol: 1e-12, maxIter: 4000 });
        near(r.x[0], 1, 1e-3);
        near(r.x[1], 1, 1e-3);
        near(r.fx, 0, 1e-6);
    });
    test('3-D quadratic → its centre', () => {
        const f = (/** @type {number[]} */ v) =>
            (v[0] - 1) ** 2 + (v[1] - 2) ** 2 + (v[2] - 3) ** 2;
        const r = minimizeNelderMead(f, [0, 0, 0]);
        near(r.x[0], 1, 1e-3); near(r.x[1], 2, 1e-3); near(r.x[2], 3, 1e-3);
    });
});

describe('optimize — gradient descent (N-D)', () => {
    test('sphere with analytic gradient → origin', () => {
        const r = gradientDescent(
            (v) => v[0] ** 2 + v[1] ** 2,
            (v) => [2 * v[0], 2 * v[1]],
            [5, -3],
        );
        near(r.x[0], 0, 1e-5);
        near(r.x[1], 0, 1e-5);
    });
    test('shifted bowl with numerical gradient → (1, −2)', () => {
        const r = gradientDescent(
            (v) => (v[0] - 1) ** 2 + (v[1] + 2) ** 2,
            null,
            [0, 0],
        );
        near(r.x[0], 1, 1e-4);
        near(r.x[1], -2, 1e-4);
    });
    test('decreases the objective monotonically to the minimum', () => {
        const f = (/** @type {number[]} */ v) => 3 * v[0] ** 2 + (v[1] - 4) ** 2;
        const start = f([10, 10]);
        const r = gradientDescent(f, (v) => [6 * v[0], 2 * (v[1] - 4)], [10, 10]);
        expect(r.fx).toBeLessThan(start);
        near(r.fx, 0, 1e-6);
        near(r.x[1], 4, 1e-4);
    });
    test('already at the minimum → stops immediately', () => {
        const r = gradientDescent(
            (v) => v[0] ** 2 + v[1] ** 2,
            (v) => [2 * v[0], 2 * v[1]],
            [0, 0],
        );
        expect(r.iterations).toBe(0);
        near(r.fx, 0);
    });
});
