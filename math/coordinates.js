// @ts-check
/**
 * Coordinate-system conversions.
 *
 * Conversions between Cartesian coordinates and the common curvilinear systems:
 * 2-D polar, 3-D spherical, and 3-D cylindrical, plus degree/radian helpers.
 *
 * **Conventions** (the physics/ISO convention):
 * - Polar: `x = r·cosθ`, `y = r·sinθ`; `θ ∈ (−π, π]` from `atan2`.
 * - Spherical: `θ` is the **polar** angle measured from +z in `[0, π]`, `φ` is
 *   the **azimuthal** angle in the xy-plane from +x. So
 *   `x = r·sinθ·cosφ`, `y = r·sinθ·sinφ`, `z = r·cosθ`.
 * - Cylindrical: `x = ρ·cosφ`, `y = ρ·sinφ`, `z = z`.
 *
 * Cartesian points are returned as `number[]` (so they compose with
 * {@link module:math/geometry}); curvilinear results are returned as named
 * objects. All angles are in radians. Nothing mutates its inputs.
 *
 * @module math/coordinates
 */

/* ------------------------------------------------------------------ *
 *  Angle helpers
 * ------------------------------------------------------------------ */

/** Degrees → radians. @param {number} deg @returns {number} */
export function degToRad(deg) {
    return (deg * Math.PI) / 180;
}

/** Radians → degrees. @param {number} rad @returns {number} */
export function radToDeg(rad) {
    return (rad * 180) / Math.PI;
}

/* ------------------------------------------------------------------ *
 *  2-D polar
 * ------------------------------------------------------------------ */

/**
 * Polar → Cartesian. `[x, y] = [r·cosθ, r·sinθ]`.
 * @param {number} r
 * @param {number} theta radians
 * @returns {number[]}
 */
export function polarToCartesian(r, theta) {
    return [r * Math.cos(theta), r * Math.sin(theta)];
}

/**
 * Cartesian → polar. `θ ∈ (−π, π]`.
 * @param {number} x
 * @param {number} y
 * @returns {{ r: number, theta: number }}
 */
export function cartesianToPolar(x, y) {
    return { r: Math.hypot(x, y), theta: Math.atan2(y, x) };
}

/* ------------------------------------------------------------------ *
 *  3-D spherical (polar angle θ from +z, azimuth φ)
 * ------------------------------------------------------------------ */

/**
 * Spherical → Cartesian. `θ` is the polar angle from +z; `φ` is the azimuth.
 * @param {number} r
 * @param {number} theta polar angle from +z, radians
 * @param {number} phi azimuthal angle in the xy-plane, radians
 * @returns {number[]}
 */
export function sphericalToCartesian(r, theta, phi) {
    const st = Math.sin(theta);
    return [
        r * st * Math.cos(phi),
        r * st * Math.sin(phi),
        r * Math.cos(theta),
    ];
}

/**
 * Cartesian → spherical. Returns `r ≥ 0`, polar `θ ∈ [0, π]`, azimuth
 * `φ ∈ (−π, π]`. At the origin `θ` and `φ` are 0.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {{ r: number, theta: number, phi: number }}
 */
export function cartesianToSpherical(x, y, z) {
    const r = Math.hypot(x, y, z);
    if (r === 0) return { r: 0, theta: 0, phi: 0 };
    return {
        r,
        theta: Math.acos(Math.min(1, Math.max(-1, z / r))),
        phi: Math.atan2(y, x),
    };
}

/* ------------------------------------------------------------------ *
 *  3-D cylindrical
 * ------------------------------------------------------------------ */

/**
 * Cylindrical → Cartesian. `[x, y, z] = [ρ·cosφ, ρ·sinφ, z]`.
 * @param {number} rho radial distance in the xy-plane
 * @param {number} phi azimuthal angle, radians
 * @param {number} z
 * @returns {number[]}
 */
export function cylindricalToCartesian(rho, phi, z) {
    return [rho * Math.cos(phi), rho * Math.sin(phi), z];
}

/**
 * Cartesian → cylindrical. `ρ ≥ 0`, `φ ∈ (−π, π]`.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {{ rho: number, phi: number, z: number }}
 */
export function cartesianToCylindrical(x, y, z) {
    return { rho: Math.hypot(x, y), phi: Math.atan2(y, x), z };
}
