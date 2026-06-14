// @ts-check
/**
 * Exact rational arithmetic backed by BigInt — no floating-point error.
 *
 * A rational is an immutable `{ n, d }` with `d > 0` and `gcd(|n|, d) === 1`
 * (always stored in lowest terms with the sign carried by the numerator).
 * This gives exact results for +, −, ×, ÷ and integer powers, which is what
 * separates a serious math tool from a float-only calculator.
 *
 * @module math/rational
 */

/**
 * @typedef {object} Rational
 * @property {bigint} n  Numerator (carries the sign).
 * @property {bigint} d  Denominator (always > 0).
 */

/**
 * Euclidean GCD on non-negative BigInts.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
export function gcd(a, b) {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b) {
        [a, b] = [b, a % b];
    }
    return a;
}

/**
 * Least common multiple.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
export function lcm(a, b) {
    if (a === 0n || b === 0n) return 0n;
    const g = gcd(a, b);
    const prod = (a / g) * b;
    return prod < 0n ? -prod : prod;
}

/**
 * Construct a normalized rational n/d.
 * @param {bigint | number} n
 * @param {bigint | number} [d]
 * @returns {Rational}
 */
export function rational(n, d = 1n) {
    let nn = typeof n === 'bigint' ? n : BigInt(Math.trunc(n));
    let dd = typeof d === 'bigint' ? d : BigInt(Math.trunc(d));
    if (dd === 0n) throw new RangeError('Rational denominator is zero');
    if (dd < 0n) {
        nn = -nn;
        dd = -dd;
    }
    const g = gcd(nn, dd) || 1n;
    return { n: nn / g, d: dd / g };
}

/**
 * Convert a finite JS number to an exact rational by reading its binary
 * mantissa/exponent (so 0.5 → 1/2 exactly, 0.1 → its true dyadic-free form
 * via decimal-string fallback for terminating decimals).
 * @param {number} x
 * @returns {Rational}
 */
export function fromNumber(x) {
    if (!Number.isFinite(x)) throw new RangeError('Cannot convert non-finite to rational');
    if (Number.isInteger(x)) return { n: BigInt(x), d: 1n };
    // Use the decimal string for "nice" terminating decimals (1.25 → 5/4).
    const s = x.toString();
    if (!s.includes('e') && !s.includes('E')) {
        const [intPart, fracPart] = s.split('.');
        const sign = intPart.startsWith('-') ? -1n : 1n;
        const digits = (intPart.replace('-', '') + fracPart);
        const denom = 10n ** BigInt(fracPart.length);
        return rational(sign * BigInt(digits), denom);
    }
    // Fallback: exact IEEE-754 decomposition.
    const buf = new DataView(new ArrayBuffer(8));
    buf.setFloat64(0, x);
    const bits = buf.getBigUint64(0);
    const sign = bits >> 63n ? -1n : 1n;
    const exp = Number((bits >> 52n) & 0x7ffn);
    const mantissa = bits & 0xfffffffffffffn;
    const frac = exp === 0 ? mantissa : mantissa | 0x10000000000000n;
    const e = (exp === 0 ? -1074 : exp - 1075);
    if (e >= 0) return rational(sign * frac * (2n ** BigInt(e)), 1n);
    return rational(sign * frac, 2n ** BigInt(-e));
}

/** @param {Rational} a @param {Rational} b @returns {Rational} */
export function addR(a, b) {
    return rational(a.n * b.d + b.n * a.d, a.d * b.d);
}
/** @param {Rational} a @param {Rational} b @returns {Rational} */
export function subR(a, b) {
    return rational(a.n * b.d - b.n * a.d, a.d * b.d);
}
/** @param {Rational} a @param {Rational} b @returns {Rational} */
export function mulR(a, b) {
    return rational(a.n * b.n, a.d * b.d);
}
/** @param {Rational} a @param {Rational} b @returns {Rational} */
export function divR(a, b) {
    if (b.n === 0n) throw new RangeError('Division by zero rational');
    return rational(a.n * b.d, a.d * b.n);
}
/** @param {Rational} a @returns {Rational} */
export function negR(a) {
    return { n: -a.n, d: a.d };
}
/** Multiplicative inverse. @param {Rational} a @returns {Rational} */
export function invR(a) {
    if (a.n === 0n) throw new RangeError('Cannot invert zero');
    return rational(a.d, a.n);
}

/**
 * Integer power of a rational — exact, O(log|k|).
 * @param {Rational} a
 * @param {number} k
 * @returns {Rational}
 */
export function powR(a, k) {
    if (!Number.isInteger(k)) throw new RangeError('Rational power must be integer');
    if (k === 0) return { n: 1n, d: 1n };
    const base = k < 0 ? invR(a) : a;
    const e = BigInt(Math.abs(k));
    return rational(base.n ** e, base.d ** e);
}

/**
 * Compare two rationals. Returns −1, 0, or 1.
 * @param {Rational} a
 * @param {Rational} b
 * @returns {-1 | 0 | 1}
 */
export function cmpR(a, b) {
    const lhs = a.n * b.d;
    const rhs = b.n * a.d;
    if (lhs < rhs) return -1;
    if (lhs > rhs) return 1;
    return 0;
}

/** @param {Rational} a @param {Rational} b @returns {boolean} */
export function equalsR(a, b) {
    return a.n === b.n && a.d === b.d;
}

/** Convert to the nearest double. @param {Rational} a @returns {number} */
export function toNumber(a) {
    return Number(a.n) / Number(a.d);
}

/**
 * Render as "n/d", or "n" when the denominator is 1.
 * @param {Rational} a
 * @returns {string}
 */
export function toString(a) {
    return a.d === 1n ? a.n.toString() : `${a.n}/${a.d}`;
}
