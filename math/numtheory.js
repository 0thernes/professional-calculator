// @ts-check
/**
 * Number theory — primality, factorization, and modular arithmetic.
 *
 * The heavy routines use BigInt internally for exactness: deterministic
 * Miller–Rabin primality (correct for all n < 3.3 × 10²⁴ via fixed witness
 * sets), modular exponentiation, modular inverse by the extended Euclidean
 * algorithm, Euler's totient, and Fibonacci by fast doubling. The public API
 * takes and returns plain numbers for ergonomics (results that exceed 2⁵³
 * lose precision — use the BigInt helpers directly for exact large values).
 *
 * @module math/numtheory
 */

/* ------------------------------------------------------------------ *
 *  GCD / LCM / extended Euclid
 * ------------------------------------------------------------------ */

/** @param {number} a @param {number} b @returns {number} */
export function gcd(a, b) {
    a = Math.abs(Math.trunc(a));
    b = Math.abs(Math.trunc(b));
    while (b) [a, b] = [b, a % b];
    return a;
}

/** @param {number} a @param {number} b @returns {number} */
export function lcm(a, b) {
    if (a === 0 || b === 0) return 0;
    return Math.abs(Math.trunc(a) / gcd(a, b) * Math.trunc(b));
}

/**
 * Extended Euclidean algorithm: returns {g, x, y} with a·x + b·y = g = gcd(a,b).
 * @param {bigint} a
 * @param {bigint} b
 * @returns {{ g: bigint, x: bigint, y: bigint }}
 */
export function extendedGcd(a, b) {
    let [oldR, r] = [a, b];
    let [oldS, s] = [1n, 0n];
    let [oldT, t] = [0n, 1n];
    while (r !== 0n) {
        const q = oldR / r;
        [oldR, r] = [r, oldR - q * r];
        [oldS, s] = [s, oldS - q * s];
        [oldT, t] = [t, oldT - q * t];
    }
    return { g: oldR, x: oldS, y: oldT };
}

/* ------------------------------------------------------------------ *
 *  Modular arithmetic
 * ------------------------------------------------------------------ */

/**
 * Modular exponentiation base^exp mod m (exact via BigInt, O(log exp)).
 * @param {number} base
 * @param {number} exp
 * @param {number} m
 * @returns {number}
 */
export function modPow(base, exp, m) {
    if (m === 1) return 0;
    return Number(modPowBig(BigInt(Math.trunc(base)), BigInt(Math.trunc(exp)), BigInt(Math.trunc(m))));
}

/**
 * BigInt modular exponentiation. Handles negative exponents via modInverse.
 * @param {bigint} base
 * @param {bigint} exp
 * @param {bigint} m
 * @returns {bigint}
 */
export function modPowBig(base, exp, m) {
    if (m === 1n) return 0n;
    if (exp < 0n) {
        base = modInverseBig(base, m);
        exp = -exp;
    }
    let result = 1n;
    base = ((base % m) + m) % m;
    while (exp > 0n) {
        if (exp & 1n) result = (result * base) % m;
        base = (base * base) % m;
        exp >>= 1n;
    }
    return result;
}

/**
 * Modular multiplicative inverse a⁻¹ mod m (throws if gcd(a,m) ≠ 1).
 * @param {number} a
 * @param {number} m
 * @returns {number}
 */
export function modInverse(a, m) {
    return Number(modInverseBig(BigInt(Math.trunc(a)), BigInt(Math.trunc(m))));
}

/** @param {bigint} a @param {bigint} m @returns {bigint} */
export function modInverseBig(a, m) {
    const { g, x } = extendedGcd(((a % m) + m) % m, m);
    if (g !== 1n) throw new RangeError(`${a} has no inverse modulo ${m}`);
    return ((x % m) + m) % m;
}

/* ------------------------------------------------------------------ *
 *  Primality & factorization
 * ------------------------------------------------------------------ */

/** Deterministic Miller–Rabin witnesses (cover all n < 3.3 × 10²⁴). */
const MR_WITNESSES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

/**
 * Deterministic primality test (Miller–Rabin). Exact for all safe-integer n.
 * @param {number} n
 * @returns {boolean}
 */
export function isPrime(n) {
    if (!Number.isInteger(n) || n < 2) return false;
    return isPrimeBig(BigInt(n));
}

/** @param {bigint} n @returns {boolean} */
export function isPrimeBig(n) {
    if (n < 2n) return false;
    for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
        if (n % p === 0n) return n === p;
    }
    // write n-1 = d · 2^r
    let d = n - 1n;
    let r = 0n;
    while ((d & 1n) === 0n) { d >>= 1n; r++; }
    witnessLoop:
    for (const a of MR_WITNESSES) {
        if (a >= n) continue;
        let x = modPowBig(a, d, n);
        if (x === 1n || x === n - 1n) continue;
        for (let i = 0n; i < r - 1n; i++) {
            x = (x * x) % n;
            if (x === n - 1n) continue witnessLoop;
        }
        return false;
    }
    return true;
}

/**
 * Prime factorization as a sorted list with multiplicity (e.g. 360 →
 * [2,2,2,3,3,5]). Trial division — practical for n up to ~10¹².
 * @param {number} n
 * @returns {number[]}
 */
export function primeFactors(n) {
    n = Math.trunc(Math.abs(n));
    if (n < 2) return [];
    /** @type {number[]} */
    const factors = [];
    while (n % 2 === 0) { factors.push(2); n /= 2; }
    for (let f = 3; f * f <= n; f += 2) {
        while (n % f === 0) { factors.push(f); n /= f; }
    }
    if (n > 1) factors.push(n);
    return factors;
}

/**
 * Distinct prime factors with exponents, e.g. 360 → [[2,3],[3,2],[5,1]].
 * @param {number} n
 * @returns {Array<[number, number]>}
 */
export function factorization(n) {
    const flat = primeFactors(n);
    /** @type {Array<[number, number]>} */
    const out = [];
    for (const p of flat) {
        const last = out[out.length - 1];
        if (last && last[0] === p) last[1]++;
        else out.push([p, 1]);
    }
    return out;
}

/**
 * All positive divisors of n in ascending order (e.g. 28 → [1,2,4,7,14,28]).
 * @param {number} n
 * @returns {number[]}
 */
export function divisors(n) {
    n = Math.trunc(Math.abs(n));
    if (n < 1) return [];
    /** @type {number[]} */
    const small = [];
    /** @type {number[]} */
    const large = [];
    for (let i = 1; i * i <= n; i++) {
        if (n % i === 0) {
            small.push(i);
            if (i !== n / i) large.push(n / i);
        }
    }
    return small.concat(large.reverse());
}

/**
 * The next prime strictly greater than n.
 * @param {number} n
 * @returns {number}
 */
export function nextPrime(n) {
    let c = Math.max(1, Math.trunc(n)) + 1;
    if (c <= 2) return 2;
    if (c % 2 === 0) c++;
    while (!isPrime(c)) c += 2;
    return c;
}

/* ------------------------------------------------------------------ *
 *  Arithmetic functions & sequences
 * ------------------------------------------------------------------ */

/**
 * Euler's totient φ(n): count of integers in [1,n] coprime to n.
 * @param {number} n
 * @returns {number}
 */
export function eulerTotient(n) {
    n = Math.trunc(n);
    if (n < 1) return 0;
    let result = n;
    for (const [p] of factorization(n)) {
        result -= result / p;
    }
    return Math.round(result);
}

/**
 * Fibonacci F(n) by fast doubling (O(log n)). Exact via BigInt; the returned
 * number is exact for n ≤ 78 (beyond 2⁵³ it is the nearest double).
 * @param {number} n
 * @returns {number}
 */
export function fibonacci(n) {
    if (n < 0 || !Number.isInteger(n)) throw new RangeError('fibonacci index must be a non-negative integer');
    return Number(fibonacciBig(n));
}

/** @param {number} n @returns {bigint} */
export function fibonacciBig(n) {
    /** @param {number} k @returns {[bigint, bigint]} */
    const fib = (k) => {
        if (k === 0) return [0n, 1n];
        const [a, b] = fib(Math.floor(k / 2));
        const c = a * (2n * b - a);
        const d = a * a + b * b;
        return (k & 1) ? [d, c + d] : [c, d];
    };
    return fib(n)[0];
}

/**
 * True if n is a perfect square.
 * @param {number} n
 * @returns {boolean}
 */
export function isPerfectSquare(n) {
    if (n < 0 || !Number.isInteger(n)) return false;
    const r = Math.round(Math.sqrt(n));
    return r * r === n;
}
