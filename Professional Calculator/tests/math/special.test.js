/**
 * @jest-environment node
 */
import {
    gamma, lgamma, factorial, combinations, permutations,
    erf, erfc, beta, lbeta, lowerGammaP, upperGammaQ, betaInc,
} from '../../math/special.js';

/** @param {number} a @param {number} b @param {number} [eps] */
const near = (a, b, eps = 1e-9) => expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

describe('special — gamma', () => {
    test('Γ(1) = 1', () => near(gamma(1), 1));
    test('Γ(5) = 24 = 4!', () => near(gamma(5), 24, 1e-8));
    test('Γ(1/2) = √π', () => near(gamma(0.5), Math.sqrt(Math.PI)));
    test('Γ(3/2) = √π/2', () => near(gamma(1.5), Math.sqrt(Math.PI) / 2));
    test('Γ(-1/2) = -2√π', () => near(gamma(-0.5), -2 * Math.sqrt(Math.PI), 1e-8));
    test('lgamma(10) = log(9!)', () => near(lgamma(10), Math.log(362880)));
    test('Γ poles at non-positive integers → NaN', () => {
        expect(Number.isNaN(gamma(0))).toBe(true);
        expect(Number.isNaN(gamma(-2))).toBe(true);
    });
});

describe('special — combinatorics', () => {
    test('5! = 120', () => expect(factorial(5)).toBe(120));
    test('0! = 1', () => expect(factorial(0)).toBe(1));
    test('C(10,3) = 120', () => expect(combinations(10, 3)).toBe(120));
    test('C(52,5) = 2598960', () => expect(combinations(52, 5)).toBe(2598960));
    test('P(10,3) = 720', () => expect(permutations(10, 3)).toBe(720));
    test('C(n,0)=C(n,n)=1', () => {
        expect(combinations(7, 0)).toBe(1);
        expect(combinations(7, 7)).toBe(1);
    });
});

describe('special — error function', () => {
    test('erf(0) = 0', () => near(erf(0), 0, 1e-7));
    test('erf(∞) → 1', () => near(erf(10), 1, 1e-7));
    test('erf(1) ≈ 0.8427007929', () => near(erf(1), 0.8427007929, 1e-6));
    test('erf is odd: erf(-x) = -erf(x)', () => near(erf(-0.7), -erf(0.7), 1e-7));
    test('erfc = 1 - erf', () => near(erfc(0.5), 1 - erf(0.5), 1e-9));
});

describe('special — beta & incomplete functions', () => {
    test('B(2,3) = 1/12', () => near(beta(2, 3), 1 / 12));
    test('B(a,b) = B(b,a)', () => near(beta(2.5, 4.1), beta(4.1, 2.5)));
    test('P(a,x)+Q(a,x) = 1', () => near(lowerGammaP(3, 2.5) + upperGammaQ(3, 2.5), 1));
    test('lowerGammaP(1,x) = 1-e^{-x} (exponential CDF)', () =>
        near(lowerGammaP(1, 2), 1 - Math.exp(-2)));
    test('I_x(a,b) endpoints', () => {
        near(betaInc(0, 2, 3), 0);
        near(betaInc(1, 2, 3), 1);
    });
    test('I_0.5(a,a) = 0.5 (symmetry)', () => near(betaInc(0.5, 3, 3), 0.5, 1e-9));
});
