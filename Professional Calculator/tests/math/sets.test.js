/**
 * @jest-environment node
 */
import {
    unique, union, intersection, difference, symmetricDifference,
    isSubset, isSuperset, isDisjoint, setEquals, jaccard, powerSet, cartesianProduct,
} from '../../math/sets.js';

describe('sets — core operations', () => {
    const a = [1, 2, 3];
    const b = [2, 3, 4];
    test('unique dedupes, preserving order', () => expect(unique([1, 1, 2, 3, 3, 2])).toEqual([1, 2, 3]));
    test('union', () => expect(union(a, b)).toEqual([1, 2, 3, 4]));
    test('intersection', () => expect(intersection(a, b)).toEqual([2, 3]));
    test('difference A\\B', () => expect(difference(a, b)).toEqual([1]));
    test('difference B\\A', () => expect(difference(b, a)).toEqual([4]));
    test('symmetric difference', () => expect(symmetricDifference(a, b)).toEqual([1, 4]));
    test('union dedupes inputs', () => expect(union([1, 1, 2], [2, 2, 3])).toEqual([1, 2, 3]));
    test('operations do not mutate inputs', () => {
        union(a, b); intersection(a, b); difference(a, b);
        expect(a).toEqual([1, 2, 3]);
        expect(b).toEqual([2, 3, 4]);
    });
});

describe('sets — predicates', () => {
    test('isSubset', () => {
        expect(isSubset([1, 2], [1, 2, 3])).toBe(true);
        expect(isSubset([1, 4], [1, 2, 3])).toBe(false);
        expect(isSubset([], [1, 2])).toBe(true); // empty set is a subset of all
    });
    test('isSuperset', () => {
        expect(isSuperset([1, 2, 3], [1, 2])).toBe(true);
        expect(isSuperset([1, 2], [1, 2, 3])).toBe(false);
    });
    test('isDisjoint', () => {
        expect(isDisjoint([1, 2], [3, 4])).toBe(true);
        expect(isDisjoint([1, 2], [2, 3])).toBe(false);
    });
    test('setEquals ignores order and duplicates', () => {
        expect(setEquals([1, 2, 3], [3, 2, 1])).toBe(true);
        expect(setEquals([1, 1, 2], [1, 2])).toBe(true);
        expect(setEquals([1, 2], [1, 2, 3])).toBe(false);
    });
});

describe('sets — jaccard', () => {
    test('|A∩B| / |A∪B|', () => expect(jaccard([1, 2, 3], [2, 3, 4])).toBeCloseTo(0.5, 12));
    test('identical sets → 1', () => expect(jaccard([1, 2], [2, 1])).toBe(1));
    test('disjoint sets → 0', () => expect(jaccard([1, 2], [3, 4])).toBe(0));
    test('two empty sets → 1', () => expect(jaccard([], [])).toBe(1));
});

describe('sets — power set', () => {
    test('powerSet([1,2]) has 4 subsets including ∅ and the full set', () => {
        const ps = powerSet([1, 2]);
        expect(ps.length).toBe(4);
        expect(ps).toContainEqual([]);
        expect(ps).toContainEqual([1]);
        expect(ps).toContainEqual([2]);
        expect(ps).toContainEqual([1, 2]);
    });
    test('|powerSet| = 2^n', () => {
        expect(powerSet([1, 2, 3, 4]).length).toBe(16);
        expect(powerSet([]).length).toBe(1);
    });
});

describe('sets — cartesian product', () => {
    test('2×2 → 4 pairs', () => {
        expect(cartesianProduct([1, 2], ['a', 'b'])).toEqual([
            [1, 'a'], [1, 'b'], [2, 'a'], [2, 'b'],
        ]);
    });
    test('|A×B| = |A|·|B|', () => expect(cartesianProduct([1, 2, 3], [1, 2]).length).toBe(6));
    test('product with the empty set is empty', () =>
        expect(cartesianProduct([1, 2], [])).toEqual([]));
});
