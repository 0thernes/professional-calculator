/**
 * @jest-environment node
 */
import {
    degToRad, radToDeg,
    polarToCartesian, cartesianToPolar,
    sphericalToCartesian, cartesianToSpherical,
    cylindricalToCartesian, cartesianToCylindrical,
} from '../../math/coordinates.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-12) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

/** @param {number[]} a @param {number[]} b */
const nearVec = (a, b, eps = 1e-12) => {
    expect(a.length).toBe(b.length);
    a.forEach((v, i) => near(v, b[i], eps));
};

describe('coordinates — angle helpers', () => {
    test('degToRad', () => { near(degToRad(180), Math.PI); near(degToRad(90), Math.PI / 2); });
    test('radToDeg', () => { near(radToDeg(Math.PI), 180); near(radToDeg(Math.PI / 2), 90); });
    test('round-trip', () => near(radToDeg(degToRad(57)), 57));
});

describe('coordinates — polar', () => {
    test('polarToCartesian basics', () => {
        nearVec(polarToCartesian(1, 0), [1, 0]);
        nearVec(polarToCartesian(1, Math.PI / 2), [0, 1]);
        nearVec(polarToCartesian(Math.SQRT2, Math.PI / 4), [1, 1]);
    });
    test('cartesianToPolar basics', () => {
        const p = cartesianToPolar(1, 1);
        near(p.r, Math.SQRT2); near(p.theta, Math.PI / 4);
        const q = cartesianToPolar(0, 1);
        near(q.r, 1); near(q.theta, Math.PI / 2);
    });
    test('round-trip cartesian → polar → cartesian', () => {
        const { r, theta } = cartesianToPolar(-3, 4);
        nearVec(polarToCartesian(r, theta), [-3, 4], 1e-10);
    });
});

describe('coordinates — spherical (θ polar from +z, φ azimuth)', () => {
    test('on the equator, azimuth 0 → +x', () =>
        nearVec(sphericalToCartesian(1, Math.PI / 2, 0), [1, 0, 0]));
    test('equator, azimuth π/2 → +y', () =>
        nearVec(sphericalToCartesian(1, Math.PI / 2, Math.PI / 2), [0, 1, 0]));
    test('north pole (θ = 0) → +z regardless of φ', () => {
        nearVec(sphericalToCartesian(1, 0, 0), [0, 0, 1]);
        nearVec(sphericalToCartesian(2, 0, 1.234), [0, 0, 2]);
    });
    test('cartesianToSpherical of +z', () => {
        const s = cartesianToSpherical(0, 0, 5);
        near(s.r, 5); near(s.theta, 0);
    });
    test('cartesianToSpherical of [1,1,√2]', () => {
        const s = cartesianToSpherical(1, 1, Math.SQRT2);
        near(s.r, 2);                 // √(1+1+2)
        near(s.theta, Math.PI / 4);   // acos(√2/2)
        near(s.phi, Math.PI / 4);
    });
    test('origin maps to zeros', () => {
        const s = cartesianToSpherical(0, 0, 0);
        near(s.r, 0); near(s.theta, 0); near(s.phi, 0);
    });
    test('round-trip', () => {
        const s = cartesianToSpherical(2, -3, 6);
        nearVec(sphericalToCartesian(s.r, s.theta, s.phi), [2, -3, 6], 1e-10);
    });
});

describe('coordinates — cylindrical', () => {
    test('cylindricalToCartesian basics', () => {
        nearVec(cylindricalToCartesian(1, 0, 5), [1, 0, 5]);
        nearVec(cylindricalToCartesian(1, Math.PI / 2, 5), [0, 1, 5]);
    });
    test('cartesianToCylindrical basics', () => {
        const c = cartesianToCylindrical(3, 4, 7);
        near(c.rho, 5); near(c.phi, Math.atan2(4, 3)); near(c.z, 7);
    });
    test('round-trip', () => {
        const c = cartesianToCylindrical(-2, 5, -1);
        nearVec(cylindricalToCartesian(c.rho, c.phi, c.z), [-2, 5, -1], 1e-10);
    });
});
