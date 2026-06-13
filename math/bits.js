// @ts-check
/**
 * Base conversion & bit manipulation on non-negative integers.
 *
 * Radix conversion to/from any base 2…36 (a staple calculator feature), the
 * binary/octal/hex shorthands, and the common bit-twiddling primitives —
 * population count, Hamming distance, power-of-two test, bit length, and Gray
 * code. All arithmetic is done with **BigInt** internally, so conversions are
 * exact for integers of any size; the bit-counting helpers accept a `number`
 * or `bigint` and return a `number` (and `fromBaseBig` returns the exact
 * `bigint`).
 *
 * @module math/bits
 */

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

/**
 * Coerce a non-negative integer (number or bigint) to bigint.
 * @param {number | bigint} n
 * @returns {bigint}
 */
function toBig(n) {
    if (typeof n === 'bigint') return n;
    if (!Number.isInteger(n)) throw new RangeError('expected an integer');
    return BigInt(n);
}

/**
 * @param {number} base
 * @returns {void}
 */
function checkBase(base) {
    if (!Number.isInteger(base) || base < 2 || base > 36) {
        throw new RangeError('base must be an integer in 2..36');
    }
}

/* ------------------------------------------------------------------ *
 *  Radix conversion
 * ------------------------------------------------------------------ */

/**
 * Render a non-negative integer in the given base (2…36) as a lowercase string.
 * @param {number | bigint} n
 * @param {number} base
 * @returns {string}
 */
export function toBase(n, base) {
    checkBase(base);
    let v = toBig(n);
    if (v < 0n) throw new RangeError('toBase expects a non-negative integer');
    if (v === 0n) return '0';
    const b = BigInt(base);
    let s = '';
    while (v > 0n) {
        s = DIGITS[Number(v % b)] + s;
        v /= b;
    }
    return s;
}

/**
 * Parse a string in the given base (2…36) to an exact bigint.
 * @param {string} str
 * @param {number} base
 * @returns {bigint}
 */
export function fromBaseBig(str, base) {
    checkBase(base);
    const s = str.trim().toLowerCase();
    if (s.length === 0) throw new RangeError('fromBase: empty string');
    const b = BigInt(base);
    let v = 0n;
    for (const ch of s) {
        const d = DIGITS.indexOf(ch);
        if (d < 0 || d >= base) {
            throw new RangeError(`invalid digit '${ch}' for base ${base}`);
        }
        v = v * b + BigInt(d);
    }
    return v;
}

/**
 * Parse a string in the given base (2…36) to a number.
 * @param {string} str
 * @param {number} base
 * @returns {number}
 */
export function fromBase(str, base) {
    return Number(fromBaseBig(str, base));
}

/** Binary string of a non-negative integer. @param {number | bigint} n @returns {string} */
export function toBinary(n) {
    return toBase(n, 2);
}

/** Octal string of a non-negative integer. @param {number | bigint} n @returns {string} */
export function toOctal(n) {
    return toBase(n, 8);
}

/** Hexadecimal (lowercase) string of a non-negative integer. @param {number | bigint} n @returns {string} */
export function toHex(n) {
    return toBase(n, 16);
}

/* ------------------------------------------------------------------ *
 *  Bit manipulation
 * ------------------------------------------------------------------ */

/**
 * Population count — the number of set bits in a non-negative integer.
 * @param {number | bigint} n
 * @returns {number}
 */
export function popcount(n) {
    let v = toBig(n);
    if (v < 0n) throw new RangeError('popcount expects a non-negative integer');
    let c = 0;
    while (v > 0n) {
        c += Number(v & 1n);
        v >>= 1n;
    }
    return c;
}

/**
 * Hamming distance — the number of differing bits between two non-negative
 * integers (= popcount of their XOR).
 * @param {number | bigint} a
 * @param {number | bigint} b
 * @returns {number}
 */
export function hammingDistance(a, b) {
    const x = toBig(a);
    const y = toBig(b);
    if (x < 0n || y < 0n) throw new RangeError('hammingDistance expects non-negative integers');
    return popcount(x ^ y);
}

/**
 * Is `n` a power of two (1, 2, 4, 8, …)?
 * @param {number | bigint} n
 * @returns {boolean}
 */
export function isPowerOfTwo(n) {
    const v = toBig(n);
    return v > 0n && (v & (v - 1n)) === 0n;
}

/**
 * Number of bits needed to represent `n` (0 for 0).
 * @param {number | bigint} n
 * @returns {number}
 */
export function bitLength(n) {
    let v = toBig(n);
    if (v < 0n) throw new RangeError('bitLength expects a non-negative integer');
    let c = 0;
    while (v > 0n) {
        c += 1;
        v >>= 1n;
    }
    return c;
}

/**
 * Binary → reflected Gray code: `n ⊕ (n >> 1)`.
 * @param {number | bigint} n
 * @returns {number}
 */
export function grayEncode(n) {
    const v = toBig(n);
    if (v < 0n) throw new RangeError('grayEncode expects a non-negative integer');
    return Number(v ^ (v >> 1n));
}

/**
 * Reflected Gray code → binary (inverse of {@link grayEncode}).
 * @param {number | bigint} g
 * @returns {number}
 */
export function grayDecode(g) {
    let v = toBig(g);
    if (v < 0n) throw new RangeError('grayDecode expects a non-negative integer');
    let mask = v >> 1n;
    while (mask > 0n) {
        v ^= mask;
        mask >>= 1n;
    }
    return Number(v);
}
