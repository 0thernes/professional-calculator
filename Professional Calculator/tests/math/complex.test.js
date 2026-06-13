/**
 * @jest-environment node
 */
import {
    complex, add, sub, mul, div, neg, conj, abs, abs2, arg,
    exp, log, sqrt, pow, powInt, sin, cos, tan, sinh, cosh,
    asin, acos, atan, fromPolar, equals, toString, I, ONE, ZERO,
} from '../../math/complex.js';

/** @param {number} a @param {number} b @param {number} [eps] */
const near = (a, b, eps = 1e-12) => expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);
/** @param {{re:number,im:number}} z @param {number} re @param {number} im @param {number} [eps] */
const nearC = (z, re, im, eps = 1e-12) => {
    expect(Math.abs(z.re - re)).toBeLessThanOrEqual(eps);
    expect(Math.abs(z.im - im)).toBeLessThanOrEqual(eps);
};

describe('complex — arithmetic', () => {
    test('(3+2i)+(1+7i) = 4+9i', () => nearC(add(complex(3, 2), complex(1, 7)), 4, 9));
    test('(3+2i)-(1+7i) = 2-5i', () => nearC(sub(complex(3, 2), complex(1, 7)), 2, -5));
    test('(3+2i)(1+7i) = -11+23i', () => nearC(mul(complex(3, 2), complex(1, 7)), -11, 23));
    test('(1+i)/(1-i) = i', () => nearC(div(complex(1, 1), complex(1, -1)), 0, 1));
    test('division avoids overflow (large denom)', () => {
        const r = div(complex(1, 1), complex(1e308, 1e308));
        expect(Number.isFinite(r.re)).toBe(true);
    });
    test('neg / conj', () => {
        nearC(neg(complex(3, -2)), -3, 2);
        nearC(conj(complex(3, -2)), 3, 2);
    });
});

describe('complex — modulus & argument', () => {
    test('|3+4i| = 5', () => near(abs(complex(3, 4)), 5));
    test('|3+4i|² = 25', () => near(abs2(complex(3, 4)), 25));
    test('arg(i) = π/2', () => near(arg(I), Math.PI / 2));
    test('arg(-1) = π', () => near(arg(complex(-1, 0)), Math.PI));
    test('fromPolar(2, π/3)', () => nearC(fromPolar(2, Math.PI / 3), 1, Math.sqrt(3)));
});

describe('complex — transcendental (Euler identities)', () => {
    test('e^{iπ} = -1 (Euler)', () => nearC(exp(complex(0, Math.PI)), -1, 0, 1e-12));
    test('e^{iπ/2} = i', () => nearC(exp(complex(0, Math.PI / 2)), 0, 1));
    test('log(e) = 1', () => nearC(log(complex(Math.E, 0)), 1, 0));
    test('log(-1) = iπ', () => nearC(log(complex(-1, 0)), 0, Math.PI));
    test('sqrt(-1) = i', () => nearC(sqrt(complex(-1, 0)), 0, 1));
    test('sqrt(2i) = 1+i', () => nearC(sqrt(complex(0, 2)), 1, 1));
    test('sqrt(z)² = z', () => {
        const z = complex(3, -4);
        nearC(mul(sqrt(z), sqrt(z)), 3, -4, 1e-10);
    });
});

describe('complex — powers', () => {
    test('i² = -1', () => nearC(mul(I, I), -1, 0));
    test('powInt(i, 4) = 1', () => nearC(powInt(I, 4), 1, 0));
    test('powInt(2+i, -1) = (2-i)/5', () => nearC(powInt(complex(2, 1), -1), 0.4, -0.2));
    test('(1+i)^8 = 16', () => nearC(pow(complex(1, 1), complex(8, 0)), 16, 0, 1e-10));
    test('i^i = e^{-π/2} (real)', () => nearC(pow(I, I), Math.exp(-Math.PI / 2), 0, 1e-12));
});

describe('complex — trig identities', () => {
    test('sin²+cos² = 1 for complex z', () => {
        const z = complex(1.2, -0.7);
        const s = mul(sin(z), sin(z));
        const c = mul(cos(z), cos(z));
        nearC(add(s, c), 1, 0, 1e-12);
    });
    test('tan = sin/cos', () => {
        const z = complex(0.5, 0.3);
        nearC(tan(z), div(sin(z), cos(z)).re, div(sin(z), cos(z)).im);
    });
    test('cosh²-sinh² = 1', () => {
        const z = complex(0.9, 1.1);
        nearC(sub(mul(cosh(z), cosh(z)), mul(sinh(z), sinh(z))), 1, 0, 1e-12);
    });
    test('asin(sin(z)) = z (principal region)', () => {
        const z = complex(0.4, 0.2);
        nearC(asin(sin(z)), 0.4, 0.2, 1e-10);
    });
    test('atan(tan(z)) = z (principal region)', () => {
        const z = complex(0.3, 0.1);
        nearC(atan(tan(z)), 0.3, 0.1, 1e-10);
    });
    test('acos(0) = π/2', () => nearC(acos(ZERO), Math.PI / 2, 0));
});

describe('complex — formatting & equality', () => {
    test('toString reals & imaginaries', () => {
        expect(toString(complex(5, 0))).toBe('5');
        expect(toString(complex(0, 1))).toBe('i');
        expect(toString(complex(0, -1))).toBe('-i');
        expect(toString(complex(3, 2))).toBe('3 + 2i');
        expect(toString(complex(3, -2))).toBe('3 - 2i');
    });
    test('equals within tolerance', () => {
        expect(equals(complex(1, 1), complex(1 + 1e-15, 1))).toBe(true);
        expect(equals(ONE, complex(1, 0))).toBe(true);
    });
});
