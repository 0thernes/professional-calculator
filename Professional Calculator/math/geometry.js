// @ts-check
/**
 * Vector geometry — Euclidean operations on real n-vectors.
 *
 * The engine already has dense matrices ({@link module:math/matrix}) and a 3-D
 * renderer ({@link module:math/plot}); this module fills the gap for everyday
 * vector algebra: the linear operations (add/sub/scale), the products (dot,
 * 3-D cross, scalar triple product), metric quantities (norm, distance, angle),
 * and the geometric maps (normalize, projection, reflection, 2-D rotation, and
 * 3-D rotation about an arbitrary axis via Rodrigues' formula).
 *
 * Vectors are plain `number[]`. Element-wise binary operations require equal
 * lengths; `cross`/`rotate3D` require length 3; `rotate2D` requires length 2.
 * Nothing mutates its inputs.
 *
 * @module math/geometry
 */

/** @typedef {ReadonlyArray<number>} Vec */

/**
 * @param {Vec} a
 * @param {Vec} b
 * @returns {void}
 */
function checkSameLength(a, b) {
    if (a.length !== b.length) {
        throw new RangeError('vectors must have equal length');
    }
}

/* ------------------------------------------------------------------ *
 *  Linear operations
 * ------------------------------------------------------------------ */

/** Vector sum a + b. @param {Vec} a @param {Vec} b @returns {number[]} */
export function add(a, b) {
    checkSameLength(a, b);
    return a.map((ai, i) => ai + b[i]);
}

/** Vector difference a − b. @param {Vec} a @param {Vec} b @returns {number[]} */
export function sub(a, b) {
    checkSameLength(a, b);
    return a.map((ai, i) => ai - b[i]);
}

/** Scalar multiple s·a. @param {Vec} a @param {number} s @returns {number[]} */
export function scale(a, s) {
    return a.map((ai) => ai * s);
}

/** Negation −a. @param {Vec} a @returns {number[]} */
export function negate(a) {
    return a.map((ai) => -ai);
}

/* ------------------------------------------------------------------ *
 *  Products
 * ------------------------------------------------------------------ */

/** Dot product a · b. @param {Vec} a @param {Vec} b @returns {number} */
export function dot(a, b) {
    checkSameLength(a, b);
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
}

/**
 * 3-D cross product a × b (right-handed). Both vectors must have length 3.
 * @param {Vec} a
 * @param {Vec} b
 * @returns {number[]}
 */
export function cross(a, b) {
    if (a.length !== 3 || b.length !== 3) {
        throw new RangeError('cross product is defined for 3-vectors');
    }
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ];
}

/**
 * Scalar triple product a · (b × c) — the signed volume of the parallelepiped
 * spanned by the three 3-vectors.
 * @param {Vec} a
 * @param {Vec} b
 * @param {Vec} c
 * @returns {number}
 */
export function tripleProduct(a, b, c) {
    return dot(a, cross(b, c));
}

/* ------------------------------------------------------------------ *
 *  Metric quantities
 * ------------------------------------------------------------------ */

/** Euclidean norm ‖a‖. @param {Vec} a @returns {number} */
export function norm(a) {
    return Math.hypot(...a);
}

/** Euclidean distance ‖a − b‖. @param {Vec} a @param {Vec} b @returns {number} */
export function distance(a, b) {
    checkSameLength(a, b);
    return Math.hypot(...a.map((ai, i) => ai - b[i]));
}

/**
 * Angle between two non-zero vectors, in radians, in [0, π].
 * Clamps the cosine to [−1, 1] to stay robust against rounding.
 * @param {Vec} a
 * @param {Vec} b
 * @returns {number}
 */
export function angleBetween(a, b) {
    const na = norm(a);
    const nb = norm(b);
    if (na === 0 || nb === 0) throw new RangeError('angle undefined for a zero vector');
    const c = Math.min(1, Math.max(-1, dot(a, b) / (na * nb)));
    return Math.acos(c);
}

/* ------------------------------------------------------------------ *
 *  Geometric maps
 * ------------------------------------------------------------------ */

/**
 * Unit vector in the direction of `a`.
 * @param {Vec} a
 * @returns {number[]}
 */
export function normalize(a) {
    const n = norm(a);
    if (n === 0) throw new RangeError('cannot normalize a zero vector');
    return a.map((ai) => ai / n);
}

/**
 * Vector projection of `a` onto `b`: the component of `a` along `b`.
 * @param {Vec} a
 * @param {Vec} b
 * @returns {number[]}
 */
export function projection(a, b) {
    const bb = dot(b, b);
    if (bb === 0) throw new RangeError('cannot project onto a zero vector');
    const k = dot(a, b) / bb;
    return b.map((bi) => bi * k);
}

/**
 * Reflect vector `v` in the hyperplane through the origin with normal `n`
 * (`n` need not be unit): v − 2 (v·n̂) n̂.
 * @param {Vec} v
 * @param {Vec} n
 * @returns {number[]}
 */
export function reflect(v, n) {
    checkSameLength(v, n);
    const nn = dot(n, n);
    if (nn === 0) throw new RangeError('reflection normal must be non-zero');
    const k = (2 * dot(v, n)) / nn;
    return v.map((vi, i) => vi - k * n[i]);
}

/**
 * Linear interpolation (1−t)·a + t·b.
 * @param {Vec} a
 * @param {Vec} b
 * @param {number} t
 * @returns {number[]}
 */
export function lerp(a, b, t) {
    checkSameLength(a, b);
    return a.map((ai, i) => ai + t * (b[i] - ai));
}

/**
 * Centroid (mean) of a set of vectors of equal length.
 * @param {ReadonlyArray<Vec>} points
 * @returns {number[]}
 */
export function centroid(points) {
    if (points.length === 0) throw new RangeError('need at least one point');
    const d = points[0].length;
    const sum = new Array(d).fill(0);
    for (const p of points) {
        if (p.length !== d) throw new RangeError('all points must have equal length');
        for (let i = 0; i < d; i++) sum[i] += p[i];
    }
    return sum.map((s) => s / points.length);
}

/* ------------------------------------------------------------------ *
 *  Rotations
 * ------------------------------------------------------------------ */

/**
 * Rotate a 2-D vector counter-clockwise by `theta` radians.
 * @param {Vec} v length-2 vector
 * @param {number} theta
 * @returns {number[]}
 */
export function rotate2D(v, theta) {
    if (v.length !== 2) throw new RangeError('rotate2D needs a 2-vector');
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return [c * v[0] - s * v[1], s * v[0] + c * v[1]];
}

/**
 * Rotate a 3-D vector by `theta` radians about `axis` (right-hand rule), using
 * Rodrigues' rotation formula. `axis` need not be unit length.
 * @param {Vec} v length-3 vector
 * @param {Vec} axis length-3 rotation axis
 * @param {number} theta
 * @returns {number[]}
 */
export function rotate3D(v, axis, theta) {
    if (v.length !== 3 || axis.length !== 3) {
        throw new RangeError('rotate3D needs 3-vectors');
    }
    const k = normalize(axis);
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const kv = cross(k, v);
    const kk = dot(k, v) * (1 - c);
    // v·c + (k×v)·s + k·(k·v)(1−c)
    return v.map((vi, i) => vi * c + kv[i] * s + k[i] * kk);
}
