/**
 * @jest-environment node
 */
import {
    rational, addR, subR, mulR, divR, negR, invR, powR,
    cmpR, equalsR, toNumber, toString, fromNumber, gcd, lcm,
} from '../../math/rational.js';

describe('rational — construction & normalization', () => {
    test('reduces to lowest terms: 4/8 → 1/2', () => {
        const r = rational(4n, 8n);
        expect(r.n).toBe(1n);
        expect(r.d).toBe(2n);
    });
    test('sign carried by numerator: 1/-2 → -1/2', () => {
        const r = rational(1n, -2n);
        expect(r.n).toBe(-1n);
        expect(r.d).toBe(2n);
    });
    test('zero denominator throws', () => {
        expect(() => rational(1n, 0n)).toThrow(RangeError);
    });
    test('accepts plain numbers', () => {
        expect(equalsR(rational(3, 6), rational(1n, 2n))).toBe(true);
    });
});

describe('rational — exact arithmetic (no float error)', () => {
    test('1/3 + 1/6 = 1/2 exactly', () => {
        expect(equalsR(addR(rational(1n, 3n), rational(1n, 6n)), rational(1n, 2n))).toBe(true);
    });
    test('0.1 + 0.2 = 0.3 exactly via rationals', () => {
        const sum = addR(fromNumber(0.1), fromNumber(0.2));
        expect(equalsR(sum, rational(3n, 10n))).toBe(true);
    });
    test('2/3 - 1/2 = 1/6', () => {
        expect(equalsR(subR(rational(2n, 3n), rational(1n, 2n)), rational(1n, 6n))).toBe(true);
    });
    test('2/3 × 3/4 = 1/2', () => {
        expect(equalsR(mulR(rational(2n, 3n), rational(3n, 4n)), rational(1n, 2n))).toBe(true);
    });
    test('(2/3) / (4/9) = 3/2', () => {
        expect(equalsR(divR(rational(2n, 3n), rational(4n, 9n)), rational(3n, 2n))).toBe(true);
    });
    test('division by zero rational throws', () => {
        expect(() => divR(rational(1n), rational(0n))).toThrow(RangeError);
    });
});

describe('rational — powers, inverse, negate', () => {
    test('(2/3)^3 = 8/27', () => {
        expect(equalsR(powR(rational(2n, 3n), 3), rational(8n, 27n))).toBe(true);
    });
    test('(2/3)^-2 = 9/4', () => {
        expect(equalsR(powR(rational(2n, 3n), -2), rational(9n, 4n))).toBe(true);
    });
    test('x^0 = 1', () => {
        expect(equalsR(powR(rational(5n, 7n), 0), rational(1n))).toBe(true);
    });
    test('inv(3/4) = 4/3', () => expect(equalsR(invR(rational(3n, 4n)), rational(4n, 3n))).toBe(true));
    test('neg(3/4) = -3/4', () => expect(equalsR(negR(rational(3n, 4n)), rational(-3n, 4n))).toBe(true));
    test('huge exact power stays exact', () => {
        const r = powR(rational(2n), 100);
        expect(r.n).toBe(1267650600228229401496703205376n); // 2^100
        expect(r.d).toBe(1n);
    });
});

describe('rational — comparison & conversion', () => {
    test('cmp: 1/3 < 1/2', () => expect(cmpR(rational(1n, 3n), rational(1n, 2n))).toBe(-1));
    test('cmp: equal', () => expect(cmpR(rational(2n, 4n), rational(1n, 2n))).toBe(0));
    test('toNumber(1/4) = 0.25', () => expect(toNumber(rational(1n, 4n))).toBe(0.25));
    test('toString', () => {
        expect(toString(rational(3n, 4n))).toBe('3/4');
        expect(toString(rational(6n, 3n))).toBe('2');
    });
    test('fromNumber(1.25) = 5/4', () => expect(equalsR(fromNumber(1.25), rational(5n, 4n))).toBe(true));
    test('fromNumber(integer)', () => expect(equalsR(fromNumber(42), rational(42n))).toBe(true));
});

describe('rational — gcd / lcm', () => {
    test('gcd(48,18) = 6', () => expect(gcd(48n, 18n)).toBe(6n));
    test('gcd negative', () => expect(gcd(-48n, 18n)).toBe(6n));
    test('lcm(4,6) = 12', () => expect(lcm(4n, 6n)).toBe(12n));
    test('lcm with zero = 0', () => expect(lcm(0n, 5n)).toBe(0n));
});
