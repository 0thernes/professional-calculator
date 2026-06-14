/**
 * @jest-environment node
 */
import {
    linspace, sampleFunction, sampleParametric, polarToCartesian,
    rotate3D, project3Dto2D, norm3, surfaceGrid,
    tesseractVertices, tesseractEdges, rotate4D, project4Dto3D, norm4,
    renderTesseract,
} from '../../math/plot.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-12) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

describe('plot — sampling', () => {
    test('linspace endpoints + count', () => {
        const xs = linspace(0, 10, 11);
        expect(xs.length).toBe(11);
        near(xs[0], 0); near(xs[10], 10); near(xs[5], 5);
    });
    test('linspace <2 throws', () => expect(() => linspace(0, 1, 1)).toThrow(RangeError));
    test('sampleFunction of x²', () => {
        const pts = sampleFunction((x) => x * x, -2, 2, 5);
        near(pts[0].y, 4); near(pts[2].y, 0); near(pts[4].y, 4);
        expect(pts.every((p) => p.defined)).toBe(true);
    });
    test('sampleFunction flags non-finite', () => {
        const pts = sampleFunction((x) => 1 / x, -1, 1, 3); // hits x=0
        expect(pts.some((p) => !p.defined)).toBe(true);
    });
    test('sampleParametric unit circle', () => {
        const pts = sampleParametric(Math.cos, Math.sin, 0, 2 * Math.PI, 100);
        expect(pts.every((p) => Math.abs(Math.hypot(p.x, p.y) - 1) < 1e-12)).toBe(true);
    });
    test('polarToCartesian', () => {
        const p = polarToCartesian(2, 0);
        near(p.x, 2); near(p.y, 0);
        const q = polarToCartesian(1, Math.PI / 2);
        near(q.x, 0); near(q.y, 1);
    });
});

describe('plot — 3D rotation & projection', () => {
    test('rotate by 0 is identity', () => {
        const p = rotate3D({ x: 1, y: 2, z: 3 }, 0, 0, 0);
        near(p.x, 1); near(p.y, 2); near(p.z, 3);
    });
    test('rotate π/2 about z: (1,0,0)→(0,1,0)', () => {
        const p = rotate3D({ x: 1, y: 0, z: 0 }, 0, 0, Math.PI / 2);
        near(p.x, 0); near(p.y, 1);
    });
    test('rotate 2π returns to start', () => {
        const p = rotate3D({ x: 1, y: -2, z: 0.5 }, 2 * Math.PI, 2 * Math.PI, 2 * Math.PI);
        near(p.x, 1); near(p.y, -2); near(p.z, 0.5, 1e-12);
    });
    test('rotation preserves norm', () => {
        const p0 = { x: 1.2, y: -3.4, z: 0.7 };
        const p1 = rotate3D(p0, 0.5, 1.1, -0.3);
        near(norm3(p1), norm3(p0));
    });
    test('projection at z=0 is identity scaled by 1', () => {
        const p = project3Dto2D({ x: 2, y: 3, z: 0 }, 5);
        near(p.x, 2); near(p.y, 3);
    });
    test('nearer points (z>0) appear larger', () => {
        const far = project3Dto2D({ x: 1, y: 0, z: -4 }, 5);
        const near_ = project3Dto2D({ x: 1, y: 0, z: 4 }, 5);
        expect(Math.abs(near_.x)).toBeGreaterThan(Math.abs(far.x));
    });
});

describe('plot — surface grid', () => {
    test('grid dimensions', () => {
        const g = surfaceGrid((x, y) => x + y, 0, 1, 0, 1, 4, 3);
        expect(g.xs.length).toBe(4);
        expect(g.ys.length).toBe(3);
        expect(g.z.length).toBe(3);     // ny rows
        expect(g.z[0].length).toBe(4);  // nx cols
    });
    test('paraboloid z=x²+y² at origin', () => {
        const g = surfaceGrid((x, y) => x * x + y * y, -1, 1, -1, 1, 3, 3);
        near(g.z[1][1], 0); // center
        near(g.z[0][0], 2); // corner (-1,-1)
    });
});

describe('plot — 4D tesseract', () => {
    test('16 vertices, all coords ±1', () => {
        const v = tesseractVertices();
        expect(v.length).toBe(16);
        expect(v.every((p) => p.every((c) => c === 1 || c === -1))).toBe(true);
    });
    test('all 16 vertices distinct', () => {
        const v = tesseractVertices();
        const set = new Set(v.map((p) => p.join(',')));
        expect(set.size).toBe(16);
    });
    test('32 edges (each vertex degree 4)', () => {
        expect(tesseractEdges().length).toBe(32);
    });
    test('edges connect vertices differing in one coordinate', () => {
        const v = tesseractVertices();
        for (const [a, b] of tesseractEdges()) {
            const diffs = v[a].filter((c, i) => c !== v[b][i]).length;
            expect(diffs).toBe(1);
        }
    });
    test('rotate4D preserves 4D norm', () => {
        const p = /** @type {[number,number,number,number]} */ ([1, -1, 1, -1]);
        const r = rotate4D(p, 0.7, 1.3);
        near(norm4(r), norm4(p));
    });
    test('rotate4D by 0 is identity', () => {
        const p = /** @type {[number,number,number,number]} */ ([1, 2, 3, 4]);
        const r = rotate4D(p, 0, 0);
        expect(r).toEqual([1, 2, 3, 4]);
    });
    test('project4Dto3D drops w with perspective', () => {
        const p3 = project4Dto3D([2, 0, 0, 0], 3);
        near(p3.x, 2); near(p3.z, 0);
    });
    test('renderTesseract yields 16 projected points + 32 edges', () => {
        const r = renderTesseract({ angleXW: 0.3, angleZW: 0.6, angle3D: 0.2 });
        expect(r.points.length).toBe(16);
        expect(r.edges.length).toBe(32);
        expect(r.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
    });
});
