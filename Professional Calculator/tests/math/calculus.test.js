/**
 * @jest-environment node
 */
import {
    derivative, secondDerivative, gradient,
    integrate, gaussLegendre,
    bisection, newton, secant, brent,
    rk4, rkf45,
} from '../../math/calculus.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-7) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

describe('calculus — differentiation', () => {
    test("d/dx x² at 3 = 6", () => near(derivative((x) => x * x, 3), 6));
    test("d/dx sin at 0 = 1", () => near(derivative(Math.sin, 0), 1));
    test("d/dx eˣ at 1 = e", () => near(derivative(Math.exp, 1), Math.E, 1e-6));
    test("d/dx ln at 2 = 0.5", () => near(derivative(Math.log, 2), 0.5));
    test("2nd deriv of x³ at 2 = 12", () => near(secondDerivative((x) => x ** 3, 2), 12, 1e-4));
    test('gradient of x²+y² at (3,4) = (6,8)', () => {
        const g = gradient((v) => v[0] ** 2 + v[1] ** 2, [3, 4]);
        near(g[0], 6, 1e-5);
        near(g[1], 8, 1e-5);
    });
});

describe('calculus — integration', () => {
    test('∫₀^π sin = 2', () => near(integrate(Math.sin, 0, Math.PI), 2));
    test('∫₀¹ x² = 1/3', () => near(integrate((x) => x * x, 0, 1), 1 / 3));
    test('∫₀¹ eˣ = e-1', () => near(integrate(Math.exp, 0, 1), Math.E - 1));
    test('∫₋₁¹ 1/(1+x²) = π/2', () => near(integrate((x) => 1 / (1 + x * x), -1, 1), Math.PI / 2));
    test('∫₀¹ 4/(1+x²) = π', () => near(integrate((x) => 4 / (1 + x * x), 0, 1), Math.PI));
    test('reversed limits negate', () => near(integrate((x) => x, 1, 0), -0.5));
    test('Gauss–Legendre exact for cubic', () => near(gaussLegendre((x) => x ** 3 + 2 * x, 0, 2), 8));
    test('Gauss–Legendre ∫₀^π sin', () => near(gaussLegendre(Math.sin, 0, Math.PI), 2, 1e-4));
});

describe('calculus — root finding', () => {
    test('bisection √2 root of x²-2', () => near(bisection((x) => x * x - 2, 0, 2), Math.SQRT2));
    test('bisection requires sign change', () =>
        expect(() => bisection((x) => x * x + 1, 0, 2)).toThrow(RangeError));
    test('newton √2', () => near(newton((x) => x * x - 2, 1), Math.SQRT2));
    test('newton with analytic derivative', () =>
        near(newton((x) => x * x - 2, 1, { df: (x) => 2 * x }), Math.SQRT2));
    test('newton cube root of 27', () => near(newton((x) => x ** 3 - 27, 2), 3, 1e-6));
    test('secant √2', () => near(secant((x) => x * x - 2, 1, 2), Math.SQRT2));
    test('brent root of cos on [0,2] = π/2', () => near(brent(Math.cos, 0, 2), Math.PI / 2));
    test('brent transcendental x=cos(x)', () => {
        const r = brent((x) => x - Math.cos(x), 0, 1);
        near(r, 0.7390851332151607, 1e-9);
    });
    test('brent requires bracket', () =>
        expect(() => brent((x) => x * x + 1, 0, 2)).toThrow(RangeError));
});

describe('calculus — ODE solvers', () => {
    test("rk4 y'=y, y(0)=1 → y(1)=e", () => {
        const sol = rk4((t, y) => [y[0]], 0, 1, [1], 100);
        near(sol.y[sol.y.length - 1][0], Math.E, 1e-6);
    });
    test("rk4 y'=-y → exponential decay", () => {
        const sol = rk4((t, y) => [-y[0]], 0, 1, [1], 100);
        near(sol.y[sol.y.length - 1][0], Math.exp(-1), 1e-6);
    });
    test('rk4 harmonic oscillator energy conserved', () => {
        // y'' = -y  ->  [y, v]' = [v, -y]; energy = y²+v²
        const sol = rk4((t, s) => [s[1], -s[0]], 0, 2 * Math.PI, [1, 0], 2000);
        const last = sol.y[sol.y.length - 1];
        near(last[0] ** 2 + last[1] ** 2, 1, 1e-4);
    });
    test("rkf45 y'=y matches e^t", () => {
        const sol = rkf45((t, y) => [y[0]], 0, 1, [1], { tol: 1e-10 });
        near(sol.y[sol.y.length - 1][0], Math.E, 1e-7);
    });
    test('rkf45 logistic growth approaches carrying capacity', () => {
        // y' = y(1-y), y(0)=0.1 -> approaches 1
        const sol = rkf45((t, y) => [y[0] * (1 - y[0])], 0, 20, [0.1], { tol: 1e-9 });
        near(sol.y[sol.y.length - 1][0], 1, 1e-4);
    });
});
