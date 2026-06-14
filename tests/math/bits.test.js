/**
 * @jest-environment node
 */
import {
    toBase, fromBase, fromBaseBig, toBinary, toOctal, toHex,
    popcount, hammingDistance, isPowerOfTwo, bitLength, grayEncode, grayDecode,
} from '../../math/bits.js';

describe('bits — radix conversion', () => {
    test('toBase basics', () => {
        expect(toBase(255, 16)).toBe('ff');
        expect(toBase(10, 2)).toBe('1010');
        expect(toBase(8, 8)).toBe('10');
        expect(toBase(0, 2)).toBe('0');
        expect(toBase(35, 36)).toBe('z');
    });
    test('shorthands', () => {
        expect(toBinary(5)).toBe('101');
        expect(toOctal(64)).toBe('100');
        expect(toHex(255)).toBe('ff');
    });
    test('fromBase basics', () => {
        expect(fromBase('ff', 16)).toBe(255);
        expect(fromBase('1010', 2)).toBe(10);
        expect(fromBase('Z', 36)).toBe(35); // case-insensitive
    });
    test('round-trips for many values and bases', () => {
        for (const n of [0, 1, 7, 42, 255, 1000, 65535]) {
            for (const b of [2, 8, 10, 16, 36]) {
                expect(fromBase(toBase(n, b), b)).toBe(n);
            }
        }
    });
    test('fromBaseBig is exact beyond 2^53', () => {
        const big = 12345678901234567890n;
        expect(fromBaseBig(toBase(big, 16), 16)).toBe(big);
    });
    test('toBase accepts bigint', () => expect(toBase(255n, 16)).toBe('ff'));
    test('invalid base throws', () => {
        expect(() => toBase(5, 1)).toThrow(RangeError);
        expect(() => toBase(5, 37)).toThrow(RangeError);
    });
    test('invalid digit throws', () => expect(() => fromBase('1012', 2)).toThrow(RangeError));
    test('negative input throws', () => expect(() => toBase(-1, 2)).toThrow(RangeError));
});

describe('bits — population count & hamming', () => {
    test('popcount', () => {
        expect(popcount(0)).toBe(0);
        expect(popcount(7)).toBe(3);
        expect(popcount(255)).toBe(8);
        expect(popcount(1023)).toBe(10);
    });
    test('popcount of a power of two is 1', () => {
        for (const k of [0, 1, 5, 10, 20]) expect(popcount(2 ** k)).toBe(1);
    });
    test('hamming distance', () => {
        expect(hammingDistance(10, 6)).toBe(2); // 1010 vs 0110 → XOR 1100
        expect(hammingDistance(255, 0)).toBe(8);
        expect(hammingDistance(42, 42)).toBe(0);
    });
});

describe('bits — predicates & length', () => {
    test('isPowerOfTwo', () => {
        [1, 2, 4, 8, 1024].forEach((n) => expect(isPowerOfTwo(n)).toBe(true));
        [0, 3, 6, 1000].forEach((n) => expect(isPowerOfTwo(n)).toBe(false));
    });
    test('bitLength', () => {
        expect(bitLength(0)).toBe(0);
        expect(bitLength(1)).toBe(1);
        expect(bitLength(255)).toBe(8);
        expect(bitLength(256)).toBe(9);
    });
});

describe('bits — input guards', () => {
    test('non-integer input throws', () => expect(() => toBase(2.5, 2)).toThrow(RangeError));
    test('negative input throws across the bit helpers', () => {
        expect(() => popcount(-1)).toThrow(RangeError);
        expect(() => bitLength(-1)).toThrow(RangeError);
        expect(() => hammingDistance(-1, 2)).toThrow(RangeError);
        expect(() => grayEncode(-1)).toThrow(RangeError);
        expect(() => grayDecode(-1)).toThrow(RangeError);
    });
    test('bigint inputs work in the bit helpers', () => {
        expect(popcount(255n)).toBe(8);
        expect(isPowerOfTwo(1024n)).toBe(true);
    });
});

describe('bits — Gray code', () => {
    test('grayEncode of 0..7 is 0,1,3,2,6,7,5,4', () => {
        expect([0, 1, 2, 3, 4, 5, 6, 7].map(grayEncode)).toEqual([0, 1, 3, 2, 6, 7, 5, 4]);
    });
    test('grayEncode(4) = 6', () => expect(grayEncode(4)).toBe(6));
    test('decode inverts encode', () => {
        for (let n = 0; n < 100; n++) expect(grayDecode(grayEncode(n))).toBe(n);
    });
    test('consecutive Gray codes differ by exactly one bit', () => {
        for (let n = 0; n < 64; n++) {
            expect(hammingDistance(grayEncode(n), grayEncode(n + 1))).toBe(1);
        }
    });
});
