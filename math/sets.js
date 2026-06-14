// @ts-check
/**
 * Set & relation utilities over plain arrays.
 *
 * The everyday finite-set operations — union, intersection, the two
 * differences, the subset/superset/disjoint/equality predicates — plus the
 * Jaccard similarity, the power set, and the Cartesian product. Membership uses
 * JavaScript `Set` semantics (SameValueZero), so elements are compared the way
 * `===` would (with `NaN` equal to itself). Results are arrays with duplicates
 * removed, preserving first-appearance order; inputs are never mutated.
 *
 * @module math/sets
 */

/**
 * Deduplicate an array, preserving first-appearance order. @template T
 * @param {ReadonlyArray<T>} a
 * @returns {T[]}
 */
export function unique(a) {
    return [...new Set(a)];
}

/**
 * Union A ∪ B (deduplicated, A's order then B's new elements). @template T
 * @param {ReadonlyArray<T>} a
 * @param {ReadonlyArray<T>} b
 * @returns {T[]}
 */
export function union(a, b) {
    return [...new Set([...a, ...b])];
}

/**
 * Intersection A ∩ B (elements of A also in B, deduplicated). @template T
 * @param {ReadonlyArray<T>} a
 * @param {ReadonlyArray<T>} b
 * @returns {T[]}
 */
export function intersection(a, b) {
    const setB = new Set(b);
    return [...new Set(a)].filter((x) => setB.has(x));
}

/**
 * Difference A \ B (elements of A not in B, deduplicated). @template T
 * @param {ReadonlyArray<T>} a
 * @param {ReadonlyArray<T>} b
 * @returns {T[]}
 */
export function difference(a, b) {
    const setB = new Set(b);
    return [...new Set(a)].filter((x) => !setB.has(x));
}

/**
 * Symmetric difference A △ B (in exactly one of A, B). @template T
 * @param {ReadonlyArray<T>} a
 * @param {ReadonlyArray<T>} b
 * @returns {T[]}
 */
export function symmetricDifference(a, b) {
    return union(difference(a, b), difference(b, a));
}

/**
 * Is A ⊆ B? @template T
 * @param {ReadonlyArray<T>} a
 * @param {ReadonlyArray<T>} b
 * @returns {boolean}
 */
export function isSubset(a, b) {
    const setB = new Set(b);
    return a.every((x) => setB.has(x));
}

/**
 * Is A ⊇ B? @template T
 * @param {ReadonlyArray<T>} a
 * @param {ReadonlyArray<T>} b
 * @returns {boolean}
 */
export function isSuperset(a, b) {
    return isSubset(b, a);
}

/**
 * Do A and B share no elements? @template T
 * @param {ReadonlyArray<T>} a
 * @param {ReadonlyArray<T>} b
 * @returns {boolean}
 */
export function isDisjoint(a, b) {
    const setB = new Set(b);
    return a.every((x) => !setB.has(x));
}

/**
 * Set equality (same elements, ignoring order and duplicates). @template T
 * @param {ReadonlyArray<T>} a
 * @param {ReadonlyArray<T>} b
 * @returns {boolean}
 */
export function setEquals(a, b) {
    const sa = new Set(a);
    const sb = new Set(b);
    if (sa.size !== sb.size) return false;
    for (const x of sa) if (!sb.has(x)) return false;
    return true;
}

/**
 * Jaccard similarity |A ∩ B| / |A ∪ B| (1 for two empty sets). @template T
 * @param {ReadonlyArray<T>} a
 * @param {ReadonlyArray<T>} b
 * @returns {number}
 */
export function jaccard(a, b) {
    const u = union(a, b).length;
    if (u === 0) return 1;
    return intersection(a, b).length / u;
}

/**
 * Power set: every subset of A (2^n of them), as an array of arrays. Operates
 * on the deduplicated elements of A. @template T
 * @param {ReadonlyArray<T>} a
 * @returns {T[][]}
 */
export function powerSet(a) {
    const elems = [...new Set(a)];
    /** @type {T[][]} */
    let result = [[]];
    for (const x of elems) {
        result = result.concat(result.map((subset) => [...subset, x]));
    }
    return result;
}

/**
 * Cartesian product A × B as an array of `[a, b]` pairs. @template T @template U
 * @param {ReadonlyArray<T>} a
 * @param {ReadonlyArray<U>} b
 * @returns {Array<[T, U]>}
 */
export function cartesianProduct(a, b) {
    /** @type {Array<[T, U]>} */
    const out = [];
    for (const x of a) for (const y of b) out.push([x, y]);
    return out;
}
