// @ts-check
/**
 * Seeded pseudo-random generation & sampling.
 *
 * A small, fast, **deterministic** RNG (mulberry32) wrapped in an {@link Rng}
 * class that draws from the common distributions and does the everyday sampling
 * chores: uniform reals/integers, Bernoulli, Gaussian (Box–Muller),
 * exponential, Poisson (Knuth), plus `choice` / `shuffle` (Fisher–Yates) /
 * `sample` (without replacement).
 *
 * Everything is seeded, so a given seed always reproduces the same stream —
 * which is what makes the statistics testable and keeps results reproducible
 * (the engine avoids the global, unseeded `Math.random`). `stats.js` provides
 * the distribution CDFs/quantiles; this module provides the sampling.
 *
 * @module math/random
 */

/**
 * mulberry32 — a 32-bit seeded PRNG returning a fresh `() => [0, 1)` stream.
 * Fast and statistically decent; not cryptographically secure.
 * @param {number} seed
 * @returns {() => number}
 */
export function createRng(seed) {
    let a = seed >>> 0;
    return function next() {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * A seeded random generator with distribution and sampling helpers.
 * Construct with an integer seed for reproducible streams.
 */
export class Rng {
    /** @param {number} [seed] */
    constructor(seed = 1) {
        this._next = createRng(seed >>> 0);
        /** @type {number | null} cached second Box–Muller normal */
        this._spare = null;
    }

    /** Uniform real in [0, 1). @returns {number} */
    next() {
        return this._next();
    }

    /** Uniform real in [a, b). @param {number} a @param {number} b @returns {number} */
    uniform(a, b) {
        return a + (b - a) * this.next();
    }

    /**
     * Uniform integer in [lo, hi] (both inclusive).
     * @param {number} lo
     * @param {number} hi
     * @returns {number}
     */
    int(lo, hi) {
        if (hi < lo) throw new RangeError('int: hi must be ≥ lo');
        return lo + Math.floor(this.next() * (hi - lo + 1));
    }

    /** Bernoulli trial: 1 with probability p, else 0. @param {number} [p] @returns {number} */
    bernoulli(p = 0.5) {
        return this.next() < p ? 1 : 0;
    }

    /**
     * Gaussian sample via Box–Muller (the paired value is cached for the next
     * call). @param {number} [mu] @param {number} [sigma] @returns {number}
     */
    normal(mu = 0, sigma = 1) {
        if (this._spare !== null) {
            const z = this._spare;
            this._spare = null;
            return mu + sigma * z;
        }
        let u1 = 0;
        while (u1 === 0) u1 = this.next(); // avoid log(0)
        const u2 = this.next();
        const r = Math.sqrt(-2 * Math.log(u1));
        this._spare = r * Math.sin(2 * Math.PI * u2);
        return mu + sigma * (r * Math.cos(2 * Math.PI * u2));
    }

    /** Exponential sample with rate λ (mean 1/λ). @param {number} [lambda] @returns {number} */
    exponential(lambda = 1) {
        if (lambda <= 0) throw new RangeError('exponential: lambda must be > 0');
        let u = 0;
        while (u === 0) u = this.next();
        return -Math.log(u) / lambda;
    }

    /**
     * Poisson sample with mean λ (Knuth's algorithm; intended for moderate λ).
     * @param {number} lambda
     * @returns {number}
     */
    poisson(lambda) {
        if (lambda < 0) throw new RangeError('poisson: lambda must be ≥ 0');
        const L = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        do {
            k++;
            p *= this.next();
        } while (p > L);
        return k - 1;
    }

    /**
     * Uniformly pick one element. @template T
     * @param {ReadonlyArray<T>} arr
     * @returns {T}
     */
    choice(arr) {
        if (arr.length === 0) throw new RangeError('choice: empty array');
        return arr[this.int(0, arr.length - 1)];
    }

    /**
     * Fisher–Yates shuffle returning a new array (input untouched). @template T
     * @param {ReadonlyArray<T>} arr
     * @returns {T[]}
     */
    shuffle(arr) {
        const a = Array.from(arr);
        for (let i = a.length - 1; i > 0; i--) {
            const j = this.int(0, i);
            const tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
        return a;
    }

    /**
     * Draw `k` distinct elements without replacement. @template T
     * @param {ReadonlyArray<T>} arr
     * @param {number} k
     * @returns {T[]}
     */
    sample(arr, k) {
        if (k < 0 || k > arr.length) throw new RangeError('sample: k out of range');
        return this.shuffle(arr).slice(0, k);
    }
}
