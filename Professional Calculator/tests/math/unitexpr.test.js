/**
 * @jest-environment node
 */
import { evaluate, format } from '../../math/unitexpr.js';
import { formatDim } from '../../math/units.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-9) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

const FORCE = [1, 1, -2, 0, 0, 0, 0]; // newton dimension
const LENGTH = [0, 1, 0, 0, 0, 0, 0];

describe('unitexpr — dimensional arithmetic', () => {
    test('F = m·a: 3 kg * 9.8 m / s^2 = 29.4 N', () => {
        const q = evaluate('3 kg * 9.8 m / s^2');
        near(q.value, 29.4);
        expect(q.dim).toEqual(FORCE);
    });
    test('implicit multiplication: kg m / s^2 is a newton', () => {
        const q = evaluate('kg m / s^2');
        near(q.value, 1);
        expect(q.dim).toEqual(FORCE);
    });
    test('addition of like dimensions', () => {
        const q = evaluate('2 m + 3 m');
        near(q.value, 5);
        expect(q.dim).toEqual(LENGTH);
    });
    test('subtraction of like dimensions', () => near(evaluate('10 m - 3 m').value, 7));
    test('adding unlike dimensions throws', () =>
        expect(() => evaluate('2 m + 3 s')).toThrow(RangeError));
    test('km converts to SI metres', () => {
        const q = evaluate('1 km');
        near(q.value, 1000);
        expect(q.dim).toEqual(LENGTH);
    });
    test('speed: 60 km / hr ≈ 16.667 m/s', () => {
        const q = evaluate('60 km / hr');
        near(q.value, 60000 / 3600, 1e-9);
        expect(q.dim).toEqual([0, 1, -1, 0, 0, 0, 0]);
    });
    test('parentheses group additive before multiply', () => {
        const q = evaluate('(2 + 3) m');
        near(q.value, 5);
        expect(q.dim).toEqual(LENGTH);
    });
    test('powers bind tighter than implicit ×: 2 m^3 = 2·(m³)', () => {
        const q = evaluate('2 m^3');
        near(q.value, 2); // 2 cubic metres, not (2 m)³
        expect(q.dim).toEqual([0, 3, 0, 0, 0, 0, 0]);
    });
    test('negative exponent: s^-1 is a frequency', () => {
        const q = evaluate('1 s^-1');
        expect(q.dim).toEqual([0, 0, -1, 0, 0, 0, 0]);
    });
    test('unary minus', () => near(evaluate('-5 m').value, -5));
});

describe('unitexpr — dimensionless & scalars', () => {
    test('a bare number is dimensionless', () => {
        const q = evaluate('42');
        near(q.value, 42);
        expect(q.dim).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });
    test('scientific notation', () => near(evaluate('1.5e3 m').value, 1500));
    test('joule = N·m: (1 kg m / s^2)(1 m) energy dimension', () => {
        const q = evaluate('1 kg * 1 m^2 / s^2');
        expect(q.dim).toEqual([1, 2, -2, 0, 0, 0, 0]);
    });
});

describe('unitexpr — guards', () => {
    test('unknown unit throws', () => expect(() => evaluate('3 foo')).toThrow(RangeError));
    test('affine temperature units are rejected', () => {
        expect(() => evaluate('20 degC')).toThrow(RangeError);
        expect(() => evaluate('5 degF')).toThrow(RangeError);
    });
    test('empty expression throws', () => expect(() => evaluate('   ')).toThrow(SyntaxError));
    test('trailing tokens throw', () => expect(() => evaluate('2 m )')).toThrow(SyntaxError));
    test('illegal character throws', () => expect(() => evaluate('2 m @ 3')).toThrow(SyntaxError));
    test('missing exponent throws', () => expect(() => evaluate('m ^ s')).toThrow(SyntaxError));
});

describe('unitexpr — formatting', () => {
    test('format renders value + dimension', () => {
        expect(format(evaluate('3 kg * 9.8 m / s^2'))).toBe(`29.4 ${formatDim(FORCE)}`);
    });
    test('dimensionless formats with a 1 denominator-free unit', () => {
        expect(format(evaluate('7'))).toBe('7 1');
    });
});
