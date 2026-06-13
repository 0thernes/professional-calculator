/**
 * @jest-environment node
 */
import {
    add, sub, scale, negate, dot, cross, tripleProduct,
    norm, distance, angleBetween, normalize, projection, reflect,
    lerp, centroid, rotate2D, rotate3D,
} from '../../math/geometry.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-12) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

/** @param {number[]} a @param {number[]} b */
const nearVec = (a, b, eps = 1e-12) => {
    expect(a.length).toBe(b.length);
    a.forEach((v, i) => near(v, b[i], eps));
};

describe('geometry — linear operations', () => {
    test('add / sub / scale / negate', () => {
        nearVec(add([1, 2, 3], [4, 5, 6]), [5, 7, 9]);
        nearVec(sub([4, 5, 6], [1, 2, 3]), [3, 3, 3]);
        nearVec(scale([1, -2, 3], 2), [2, -4, 6]);
        nearVec(negate([1, -2, 3]), [-1, 2, -3]);
    });
    test('length mismatch throws', () =>
        expect(() => add([1, 2], [1, 2, 3])).toThrow(RangeError));
    test('does not mutate inputs', () => {
        const a = [1, 2, 3];
        add(a, [1, 1, 1]);
        nearVec(a, [1, 2, 3]);
    });
});

describe('geometry — products', () => {
    test('dot product', () => near(dot([1, 2, 3], [4, 5, 6]), 32));
    test('dot of orthogonal vectors is 0', () => near(dot([1, 0], [0, 1]), 0));
    test('cross of basis vectors x̂ × ŷ = ẑ', () => {
        nearVec(cross([1, 0, 0], [0, 1, 0]), [0, 0, 1]);
        nearVec(cross([0, 1, 0], [0, 0, 1]), [1, 0, 0]);
        nearVec(cross([0, 0, 1], [1, 0, 0]), [0, 1, 0]);
    });
    test('cross is orthogonal to both operands', () => {
        const a = [2, -1, 3];
        const b = [0, 4, 1];
        const c = cross(a, b);
        near(dot(c, a), 0);
        near(dot(c, b), 0);
    });
    test('cross is anti-commutative', () =>
        nearVec(cross([1, 2, 3], [4, 5, 6]), negate(cross([4, 5, 6], [1, 2, 3]))));
    test('cross requires 3-vectors', () =>
        expect(() => cross([1, 2], [3, 4])).toThrow(RangeError));
    test('scalar triple product of the standard basis is 1', () =>
        near(tripleProduct([1, 0, 0], [0, 1, 0], [0, 0, 1]), 1));
    test('triple product = det → degenerate (coplanar) is 0', () =>
        near(tripleProduct([1, 0, 0], [0, 1, 0], [1, 1, 0]), 0));
});

describe('geometry — metric quantities', () => {
    test('norm of a 3-4-5 vector', () => near(norm([3, 4]), 5));
    test('norm of a 1-2-2 vector is 3', () => near(norm([1, 2, 2]), 3));
    test('distance', () => near(distance([0, 0], [3, 4]), 5));
    test('angle between x̂ and ŷ is π/2', () => near(angleBetween([1, 0], [0, 1]), Math.PI / 2));
    test('angle of parallel vectors is 0', () => near(angleBetween([2, 0], [5, 0]), 0));
    test('angle of antiparallel vectors is π', () => near(angleBetween([1, 0], [-1, 0]), Math.PI));
    test('angle with a zero vector throws', () =>
        expect(() => angleBetween([0, 0], [1, 1])).toThrow(RangeError));
});

describe('geometry — geometric maps', () => {
    test('normalize gives a unit vector', () => {
        nearVec(normalize([3, 4]), [0.6, 0.8]);
        near(norm(normalize([1, 2, 3, 4])), 1);
    });
    test('normalize zero throws', () => expect(() => normalize([0, 0])).toThrow(RangeError));
    test('projection of [3,3] onto x-axis is [3,0]', () =>
        nearVec(projection([3, 3], [1, 0]), [3, 0]));
    test('projection onto a longer parallel vector', () =>
        nearVec(projection([2, 0], [5, 0]), [2, 0]));
    test('reflect across the x-axis (normal ŷ) flips the y-component', () =>
        nearVec(reflect([1, -1], [0, 1]), [1, 1]));
    test('reflecting twice is the identity', () =>
        nearVec(reflect(reflect([3, 5], [0, 1]), [0, 1]), [3, 5]));
    test('lerp midpoint', () => nearVec(lerp([0, 0], [10, 10], 0.5), [5, 5]));
    test('lerp endpoints', () => {
        nearVec(lerp([1, 2], [3, 4], 0), [1, 2]);
        nearVec(lerp([1, 2], [3, 4], 1), [3, 4]);
    });
    test('centroid of a triangle', () =>
        nearVec(centroid([[0, 0], [3, 0], [0, 3]]), [1, 1]));
    test('centroid requires points', () => expect(() => centroid([])).toThrow(RangeError));
});

describe('geometry — rotations', () => {
    test('rotate2D x̂ by π/2 → ŷ', () => nearVec(rotate2D([1, 0], Math.PI / 2), [0, 1]));
    test('rotate2D preserves length', () =>
        near(norm(rotate2D([3, 4], 0.7)), 5));
    test('rotate2D by 2π is the identity', () =>
        nearVec(rotate2D([1, 2], 2 * Math.PI), [1, 2], 1e-9));
    test('rotate3D x̂ about ẑ by π/2 → ŷ', () =>
        nearVec(rotate3D([1, 0, 0], [0, 0, 1], Math.PI / 2), [0, 1, 0], 1e-12));
    test('rotate3D about an axis leaves that axis fixed', () =>
        nearVec(rotate3D([0, 0, 2], [0, 0, 1], 1.234), [0, 0, 2], 1e-12));
    test('rotate3D preserves length (non-unit axis)', () =>
        near(norm(rotate3D([1, 2, 3], [1, 1, 1], 0.9)), norm([1, 2, 3]), 1e-12));
});
