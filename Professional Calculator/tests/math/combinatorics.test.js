/**
 * @jest-environment node
 */
import {
    factorialBig,
    catalan, catalanBig,
    bell, bellBig,
    stirlingSecond, stirlingSecondBig,
    stirlingFirst, stirlingFirstBig,
    partitions, partitionsBig,
    derangements, derangementsBig,
    multinomial, multinomialBig,
    combinationsWithRepetition,
} from '../../math/combinatorics.js';

describe('combinatorics — factorialBig', () => {
    test('exact small values', () => {
        expect(factorialBig(0)).toBe(1n);
        expect(factorialBig(5)).toBe(120n);
        expect(factorialBig(10)).toBe(3628800n);
    });
    test('exact beyond double precision', () =>
        expect(factorialBig(25)).toBe(15511210043330985984000000n));
    test('rejects non-integers / negatives', () => {
        expect(() => factorialBig(-1)).toThrow(RangeError);
        expect(() => factorialBig(2.5)).toThrow(RangeError);
    });
});

describe('combinatorics — Catalan', () => {
    test('first terms 1,1,2,5,14,42,132', () =>
        expect([0, 1, 2, 3, 4, 5, 6].map(catalan)).toEqual([1, 1, 2, 5, 14, 42, 132]));
    test('C(4) = 14', () => expect(catalan(4)).toBe(14));
    test('big exact: C(20)', () => expect(catalanBig(20)).toBe(6564120420n));
});

describe('combinatorics — Bell', () => {
    test('first terms 1,1,2,5,15,52,203', () =>
        expect([0, 1, 2, 3, 4, 5, 6].map(bell)).toEqual([1, 1, 2, 5, 15, 52, 203]));
    test('B(4) = 15, B(5) = 52', () => {
        expect(bell(4)).toBe(15);
        expect(bell(5)).toBe(52);
    });
    test('big exact: B(15)', () => expect(bellBig(15)).toBe(1382958545n));
});

describe('combinatorics — Stirling 2nd kind', () => {
    test('S(4,2) = 7', () => expect(stirlingSecond(4, 2)).toBe(7));
    test('S(5,3) = 25', () => expect(stirlingSecond(5, 3)).toBe(25));
    test('S(n,1) = 1 and S(n,n) = 1', () => {
        expect(stirlingSecond(6, 1)).toBe(1);
        expect(stirlingSecond(6, 6)).toBe(1);
    });
    test('S(n,k) = 0 for k > n', () => expect(stirlingSecond(3, 5)).toBe(0));
    test('row sum of S(n,·) equals the Bell number', () => {
        let sum = 0n;
        for (let k = 0; k <= 5; k++) sum += stirlingSecondBig(5, k);
        expect(sum).toBe(bellBig(5));
    });
});

describe('combinatorics — Stirling 1st kind (unsigned)', () => {
    test('c(4,2) = 11', () => expect(stirlingFirst(4, 2)).toBe(11));
    test('c(n,n) = 1 and c(n,1) = (n-1)!', () => {
        expect(stirlingFirst(5, 5)).toBe(1);
        expect(stirlingFirst(5, 1)).toBe(24); // 4!
    });
    test('row sum of c(n,·) equals n!', () => {
        let sum = 0n;
        for (let k = 0; k <= 6; k++) sum += stirlingFirstBig(6, k);
        expect(sum).toBe(factorialBig(6));
    });
});

describe('combinatorics — partitions p(n)', () => {
    test('first terms 1,1,2,3,5,7,11', () =>
        expect([0, 1, 2, 3, 4, 5, 6].map(partitions)).toEqual([1, 1, 2, 3, 5, 7, 11]));
    test('p(10) = 42', () => expect(partitions(10)).toBe(42));
    test('big exact: p(100) = 190569292', () =>
        expect(partitionsBig(100)).toBe(190569292n));
});

describe('combinatorics — derangements D(n)', () => {
    test('first terms 1,0,1,2,9,44,265', () =>
        expect([0, 1, 2, 3, 4, 5, 6].map(derangements)).toEqual([1, 0, 1, 2, 9, 44, 265]));
    test('D(4) = 9, D(5) = 44', () => {
        expect(derangements(4)).toBe(9);
        expect(derangements(5)).toBe(44);
    });
    test('big exact: D(20)', () => expect(derangementsBig(20)).toBe(895014631192902121n));
});

describe('combinatorics — multinomial', () => {
    test('[2,2,2] → 90', () => expect(multinomial([2, 2, 2])).toBe(90));
    test('[1,1,1] → 3! = 6', () => expect(multinomial([1, 1, 1])).toBe(6));
    test('single group → 1', () => expect(multinomial([7])).toBe(1));
    test('reduces to binomial: [k, n-k]', () =>
        expect(multinomial([2, 3])).toBe(10)); // C(5,2)
    test('big exact: [5,5,5]', () => expect(multinomialBig([5, 5, 5])).toBe(756756n));
    test('rejects negatives', () => expect(() => multinomial([2, -1])).toThrow(RangeError));
});

describe('combinatorics — combinations with repetition', () => {
    test('multichoose(5,3) = C(7,3) = 35', () =>
        expect(combinationsWithRepetition(5, 3)).toBe(35));
    test('k = 0 → 1', () => expect(combinationsWithRepetition(9, 0)).toBe(1));
    test('n = 0, k > 0 → 0', () => expect(combinationsWithRepetition(0, 3)).toBe(0));
});
