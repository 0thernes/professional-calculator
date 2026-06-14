// @ts-check
/**
 * Complex number arithmetic — the foundation for the scientific engine.
 *
 * A complex value is an immutable `{ re, im }` record. All operations are
 * pure functions returning new values; nothing is mutated. Real numbers are
 * treated as complex with `im === 0`, so the same code path serves both.
 *
 * Transcendental functions (exp, log, trig, hyperbolic, pow, sqrt) use the
 * standard principal-branch definitions. Branch cuts follow the C99 / Common
 * Lisp conventions (log/sqrt cut along the negative real axis).
 *
 * Numerical care:
 *  - division uses Smith's algorithm to avoid intermediate overflow,
 *  - abs() uses Math.hypot to avoid overflow/underflow,
 *  - arg() uses Math.atan2 for correct quadrant.
 *
 * @module math/complex
 */

/**
 * @typedef {object} Complex
 * @property {number} re  Real part.
 * @property {number} im  Imaginary part.
 */

/**
 * Construct a complex number.
 * @param {number} re
 * @param {number} [im]
 * @returns {Complex}
 */
export function complex(re, im = 0) {
    return { re, im };
}

/** Imaginary unit. @type {Complex} */
export const I = Object.freeze({ re: 0, im: 1 });
/** Complex zero. @type {Complex} */
export const ZERO = Object.freeze({ re: 0, im: 0 });
/** Complex one. @type {Complex} */
export const ONE = Object.freeze({ re: 1, im: 0 });

/**
 * Coerce a number or Complex into a Complex.
 * @param {number | Complex} x
 * @returns {Complex}
 */
export function toComplex(x) {
    return typeof x === 'number' ? { re: x, im: 0 } : x;
}

/**
 * True when the imaginary part is exactly zero (a pure real).
 * @param {Complex} z
 * @returns {boolean}
 */
export function isReal(z) {
    return z.im === 0;
}

/**
 * True if either component is NaN.
 * @param {Complex} z
 * @returns {boolean}
 */
export function isNaNC(z) {
    return Number.isNaN(z.re) || Number.isNaN(z.im);
}

/**
 * True if both components are finite.
 * @param {Complex} z
 * @returns {boolean}
 */
export function isFiniteC(z) {
    return Number.isFinite(z.re) && Number.isFinite(z.im);
}

/** @param {Complex} a @param {Complex} b @returns {Complex} */
export function add(a, b) {
    return { re: a.re + b.re, im: a.im + b.im };
}

/** @param {Complex} a @param {Complex} b @returns {Complex} */
export function sub(a, b) {
    return { re: a.re - b.re, im: a.im - b.im };
}

/** @param {Complex} a @param {Complex} b @returns {Complex} */
export function mul(a, b) {
    return {
        re: a.re * b.re - a.im * b.im,
        im: a.re * b.im + a.im * b.re,
    };
}

/**
 * Complex division using Smith's algorithm (scales by the larger denominator
 * component to avoid overflow when |b| is large or small).
 * @param {Complex} a
 * @param {Complex} b
 * @returns {Complex}
 */
export function div(a, b) {
    const { re: c, im: d } = b;
    if (Math.abs(c) >= Math.abs(d)) {
        if (c === 0 && d === 0) {
            // 0/0 → NaN; x/0 → Infinity, matching IEEE behaviour for reals.
            return { re: a.re / c, im: a.im / c };
        }
        const r = d / c;
        const den = c + d * r;
        return {
            re: (a.re + a.im * r) / den,
            im: (a.im - a.re * r) / den,
        };
    }
    const r = c / d;
    const den = c * r + d;
    return {
        re: (a.re * r + a.im) / den,
        im: (a.im * r - a.re) / den,
    };
}

/** Additive inverse. @param {Complex} z @returns {Complex} */
export function neg(z) {
    return { re: -z.re, im: -z.im };
}

/** Complex conjugate. @param {Complex} z @returns {Complex} */
export function conj(z) {
    return { re: z.re, im: -z.im };
}

/** Modulus |z| (overflow-safe). @param {Complex} z @returns {number} */
export function abs(z) {
    return Math.hypot(z.re, z.im);
}

/** Squared modulus |z|² (no sqrt). @param {Complex} z @returns {number} */
export function abs2(z) {
    return z.re * z.re + z.im * z.im;
}

/** Argument (phase) in (-π, π]. @param {Complex} z @returns {number} */
export function arg(z) {
    return Math.atan2(z.im, z.re);
}

/**
 * Construct from polar form r·e^{iθ}.
 * @param {number} r
 * @param {number} theta
 * @returns {Complex}
 */
export function fromPolar(r, theta) {
    return { re: r * Math.cos(theta), im: r * Math.sin(theta) };
}

/** Complex exponential e^z. @param {Complex} z @returns {Complex} */
export function exp(z) {
    const e = Math.exp(z.re);
    return { re: e * Math.cos(z.im), im: e * Math.sin(z.im) };
}

/** Principal natural logarithm. @param {Complex} z @returns {Complex} */
export function log(z) {
    return { re: Math.log(abs(z)), im: arg(z) };
}

/**
 * Principal square root (branch cut on the negative real axis).
 * Uses a numerically stable formula avoiding cancellation.
 * @param {Complex} z
 * @returns {Complex}
 */
export function sqrt(z) {
    if (z.re === 0 && z.im === 0) return { re: 0, im: 0 };
    const r = abs(z);
    const re = Math.sqrt((r + z.re) / 2);
    let im = Math.sqrt((r - z.re) / 2);
    if (z.im < 0) im = -im;
    return { re, im };
}

/**
 * Complex power a^b = exp(b · log a), with shortcuts for real integer
 * exponents (exact, via binary exponentiation) and a^0 = 1.
 * @param {Complex} a
 * @param {Complex} b
 * @returns {Complex}
 */
export function pow(a, b) {
    if (b.im === 0 && Number.isInteger(b.re)) {
        return powInt(a, b.re);
    }
    if (a.re === 0 && a.im === 0) {
        // 0^b: 0 for Re(b) > 0, else NaN/Inf via log path.
        if (b.re > 0) return { re: 0, im: 0 };
    }
    return exp(mul(b, log(a)));
}

/**
 * Integer power via binary exponentiation — O(log|n|), exact for Gaussian
 * integers up to floating range.
 * @param {Complex} a
 * @param {number} n
 * @returns {Complex}
 */
export function powInt(a, n) {
    if (n === 0) return { re: 1, im: 0 };
    let base = n < 0 ? div(ONE, a) : a;
    let exponent = Math.abs(n);
    let result = { re: 1, im: 0 };
    while (exponent > 0) {
        if (exponent & 1) result = mul(result, base);
        base = mul(base, base);
        exponent = Math.floor(exponent / 2);
    }
    return result;
}

/* ---- trigonometric ---- */

/** @param {Complex} z @returns {Complex} */
export function sin(z) {
    return { re: Math.sin(z.re) * Math.cosh(z.im), im: Math.cos(z.re) * Math.sinh(z.im) };
}
/** @param {Complex} z @returns {Complex} */
export function cos(z) {
    return { re: Math.cos(z.re) * Math.cosh(z.im), im: -Math.sin(z.re) * Math.sinh(z.im) };
}
/** @param {Complex} z @returns {Complex} */
export function tan(z) {
    return div(sin(z), cos(z));
}

/* ---- hyperbolic ---- */

/** @param {Complex} z @returns {Complex} */
export function sinh(z) {
    return { re: Math.sinh(z.re) * Math.cos(z.im), im: Math.cosh(z.re) * Math.sin(z.im) };
}
/** @param {Complex} z @returns {Complex} */
export function cosh(z) {
    return { re: Math.cosh(z.re) * Math.cos(z.im), im: Math.sinh(z.re) * Math.sin(z.im) };
}
/** @param {Complex} z @returns {Complex} */
export function tanh(z) {
    return div(sinh(z), cosh(z));
}

/* ---- inverse trigonometric (principal branches) ---- */

/** @param {Complex} z @returns {Complex} */
export function asin(z) {
    // asin(z) = -i·log(i·z + sqrt(1 - z²))
    const iz = { re: -z.im, im: z.re };
    const oneMinusZ2 = sub(ONE, mul(z, z));
    const root = sqrt(oneMinusZ2);
    const inner = add(iz, root);
    const l = log(inner);
    return { re: l.im, im: -l.re };
}

/** @param {Complex} z @returns {Complex} */
export function acos(z) {
    // acos(z) = π/2 - asin(z)
    const a = asin(z);
    return { re: Math.PI / 2 - a.re, im: -a.im };
}

/** @param {Complex} z @returns {Complex} */
export function atan(z) {
    // atan(z) = (i/2)·(log(1 - i z) - log(1 + i z))
    const iz = { re: -z.im, im: z.re };
    const l1 = log(sub(ONE, iz));
    const l2 = log(add(ONE, iz));
    const d = sub(l1, l2);
    // multiply by i/2
    return { re: -d.im / 2, im: d.re / 2 };
}

/**
 * Structural / numeric equality within a tolerance.
 * @param {Complex} a
 * @param {Complex} b
 * @param {number} [eps]
 * @returns {boolean}
 */
export function equals(a, b, eps = 1e-12) {
    return Math.abs(a.re - b.re) <= eps && Math.abs(a.im - b.im) <= eps;
}

/**
 * Render a complex value as a human-readable string, e.g. "3 + 2i", "-i",
 * "5", "2 - 3i". Reals collapse to plain numbers.
 * @param {Complex} z
 * @param {number} [precision]  significant digits (default 12)
 * @returns {string}
 */
export function toString(z, precision = 12) {
    const fmt = (/** @type {number} */ x) => {
        if (Number.isInteger(x)) return String(x);
        return parseFloat(x.toPrecision(precision)).toString();
    };
    if (z.im === 0) return fmt(z.re);
    if (z.re === 0) {
        if (z.im === 1) return 'i';
        if (z.im === -1) return '-i';
        return `${fmt(z.im)}i`;
    }
    const sign = z.im < 0 ? '-' : '+';
    const imAbs = Math.abs(z.im);
    const imPart = imAbs === 1 ? 'i' : `${fmt(imAbs)}i`;
    return `${fmt(z.re)} ${sign} ${imPart}`;
}
