// @ts-check
/**
 * Combinatorics — the classic counting sequences.
 *
 * `special.js` already provides `factorial`, `combinations` (binomial), and
 * `permutations`; this module adds the discrete-math sequences that grow too
 * fast for double precision: Catalan and Bell numbers, Stirling numbers of the
 * first (unsigned) and second kind, the integer partition function, the
 * derangement count, the multinomial coefficient, and combinations with
 * repetition.
 *
 * Each routine is computed with **BigInt** internally for exactness. Following
 * the convention in {@link module:math/numtheory}, the default export returns a
 * plain `number` (which loses precision past 2⁵³), and a parallel `…Big`
 * function returns the exact `bigint`.
 *
 * @module math/combinatorics
 */

/**
 * @param {number} n
 * @returns {void}
 */
function checkNonNegInt(n) {
    if (!Number.isInteger(n) || n < 0) {
        throw new RangeError('argument must be a non-negative integer');
    }
}

/**
 * Exact binomial coefficient C(n, k) in BigInt (multiplicative form).
 * @param {number} n
 * @param {number} k
 * @returns {bigint}
 */
function binomBig(n, k) {
    if (k < 0 || k > n) return 0n;
    const kk = Math.min(k, n - k);
    let num = 1n;
    let den = 1n;
    for (let i = 0; i < kk; i++) {
        num *= BigInt(n - i);
        den *= BigInt(i + 1);
    }
    return num / den;
}

/* ------------------------------------------------------------------ *
 *  Factorial (exact)
 * ------------------------------------------------------------------ */

/** Exact factorial n! as a bigint. @param {number} n @returns {bigint} */
export function factorialBig(n) {
    checkNonNegInt(n);
    let r = 1n;
    for (let i = 2; i <= n; i++) r *= BigInt(i);
    return r;
}

/* ------------------------------------------------------------------ *
 *  Catalan numbers — Cₙ = C(2n, n) / (n + 1)
 * ------------------------------------------------------------------ */

/** Exact n-th Catalan number. @param {number} n @returns {bigint} */
export function catalanBig(n) {
    checkNonNegInt(n);
    return binomBig(2 * n, n) / BigInt(n + 1);
}

/** n-th Catalan number: 1, 1, 2, 5, 14, 42, 132, … @param {number} n @returns {number} */
export function catalan(n) {
    return Number(catalanBig(n));
}

/* ------------------------------------------------------------------ *
 *  Bell numbers — partitions of a set, via the Bell triangle
 * ------------------------------------------------------------------ */

/** Exact n-th Bell number. @param {number} n @returns {bigint} */
export function bellBig(n) {
    checkNonNegInt(n);
    let row = [1n];
    for (let i = 1; i <= n; i++) {
        const next = [row[row.length - 1]];
        for (let j = 0; j < row.length; j++) next.push(next[j] + row[j]);
        row = next;
    }
    return row[0];
}

/** n-th Bell number: 1, 1, 2, 5, 15, 52, 203, … @param {number} n @returns {number} */
export function bell(n) {
    return Number(bellBig(n));
}

/* ------------------------------------------------------------------ *
 *  Stirling numbers
 * ------------------------------------------------------------------ */

/**
 * Exact Stirling number of the second kind S(n, k) — the number of ways to
 * partition n labelled items into k non-empty unlabelled subsets.
 * S(n,k) = k·S(n−1,k) + S(n−1,k−1).
 * @param {number} n
 * @param {number} k
 * @returns {bigint}
 */
export function stirlingSecondBig(n, k) {
    checkNonNegInt(n);
    checkNonNegInt(k);
    if (k > n) return 0n;
    if (k === 0) return n === 0 ? 1n : 0n;
    const dp = new Array(k + 1).fill(0n);
    dp[0] = 1n;
    for (let i = 1; i <= n; i++) {
        for (let j = Math.min(i, k); j >= 1; j--) {
            dp[j] = BigInt(j) * dp[j] + dp[j - 1];
        }
        dp[0] = 0n;
    }
    return dp[k];
}

/** Stirling number of the second kind S(n, k). @param {number} n @param {number} k @returns {number} */
export function stirlingSecond(n, k) {
    return Number(stirlingSecondBig(n, k));
}

/**
 * Exact unsigned Stirling number of the first kind c(n, k) — the number of
 * permutations of n elements with exactly k disjoint cycles.
 * c(n,k) = c(n−1,k−1) + (n−1)·c(n−1,k); Σ_k c(n,k) = n!.
 * @param {number} n
 * @param {number} k
 * @returns {bigint}
 */
export function stirlingFirstBig(n, k) {
    checkNonNegInt(n);
    checkNonNegInt(k);
    if (k > n) return 0n;
    if (k === 0) return n === 0 ? 1n : 0n;
    const dp = new Array(k + 1).fill(0n);
    dp[0] = 1n;
    for (let i = 1; i <= n; i++) {
        for (let j = Math.min(i, k); j >= 1; j--) {
            dp[j] = dp[j - 1] + BigInt(i - 1) * dp[j];
        }
        dp[0] = 0n;
    }
    return dp[k];
}

/** Unsigned Stirling number of the first kind c(n, k). @param {number} n @param {number} k @returns {number} */
export function stirlingFirst(n, k) {
    return Number(stirlingFirstBig(n, k));
}

/* ------------------------------------------------------------------ *
 *  Integer partition function p(n)
 * ------------------------------------------------------------------ */

/**
 * Exact integer partition count p(n) — the number of ways to write n as a sum
 * of positive integers (order irrelevant). Computed by the unbounded-knapsack
 * recurrence over parts 1…n.
 * @param {number} n
 * @returns {bigint}
 */
export function partitionsBig(n) {
    checkNonNegInt(n);
    const dp = new Array(n + 1).fill(0n);
    dp[0] = 1n;
    for (let part = 1; part <= n; part++) {
        for (let s = part; s <= n; s++) dp[s] += dp[s - part];
    }
    return dp[n];
}

/** Integer partition count p(n): 1, 1, 2, 3, 5, 7, 11, … @param {number} n @returns {number} */
export function partitions(n) {
    return Number(partitionsBig(n));
}

/* ------------------------------------------------------------------ *
 *  Derangements — permutations with no fixed point
 * ------------------------------------------------------------------ */

/**
 * Exact derangement count D(n): D(0)=1, D(1)=0, D(n)=(n−1)(D(n−1)+D(n−2)).
 * @param {number} n
 * @returns {bigint}
 */
export function derangementsBig(n) {
    checkNonNegInt(n);
    if (n === 0) return 1n;
    if (n === 1) return 0n;
    let a = 1n; // D(0)
    let b = 0n; // D(1)
    for (let i = 2; i <= n; i++) {
        const d = BigInt(i - 1) * (b + a);
        a = b;
        b = d;
    }
    return b;
}

/** Derangement count D(n): 1, 0, 1, 2, 9, 44, 265, … @param {number} n @returns {number} */
export function derangements(n) {
    return Number(derangementsBig(n));
}

/* ------------------------------------------------------------------ *
 *  Multinomial coefficient & combinations with repetition
 * ------------------------------------------------------------------ */

/**
 * Exact multinomial coefficient (Σkᵢ)! / Πkᵢ! — the number of ways to arrange a
 * multiset with the given group sizes.
 * @param {ReadonlyArray<number>} ks
 * @returns {bigint}
 */
export function multinomialBig(ks) {
    let total = 0;
    for (const k of ks) {
        checkNonNegInt(k);
        total += k;
    }
    let den = 1n;
    for (const k of ks) den *= factorialBig(k);
    return factorialBig(total) / den;
}

/** Multinomial coefficient (Σkᵢ)! / Πkᵢ!. @param {ReadonlyArray<number>} ks @returns {number} */
export function multinomial(ks) {
    return Number(multinomialBig(ks));
}

/**
 * Combinations with repetition ("multichoose"): the number of size-k
 * multisets drawn from n types, C(n + k − 1, k).
 * @param {number} n
 * @param {number} k
 * @returns {number}
 */
export function combinationsWithRepetition(n, k) {
    checkNonNegInt(n);
    checkNonNegInt(k);
    if (n === 0) return k === 0 ? 1 : 0;
    return Number(binomBig(n + k - 1, k));
}
