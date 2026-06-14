// @ts-check
/**
 * Visualization data layer — pure generators that turn functions and shapes
 * into sampled geometry for the UI to render (SVG/canvas). Nothing here
 * touches the DOM, so every routine is unit-testable: sampling, 3-D rotation
 * and perspective projection, parametric/surface meshes, and a genuine 4-D
 * hypercube (tesseract) rotated in 4-space and projected 4D→3D→2D.
 *
 * @module math/plot
 */

/** @typedef {{ x: number, y: number }} Point2 */
/** @typedef {{ x: number, y: number, z: number }} Point3 */
/** @typedef {[number, number, number, number]} Point4 */

/**
 * `n` evenly-spaced samples on [a, b], inclusive of both endpoints.
 * @param {number} a
 * @param {number} b
 * @param {number} n  number of points (≥2)
 * @returns {number[]}
 */
export function linspace(a, b, n) {
    if (n < 2) throw new RangeError('linspace needs at least 2 points');
    const step = (b - a) / (n - 1);
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = a + i * step;
    out[n - 1] = b; // exact endpoint (avoid float drift)
    return out;
}

/**
 * Sample y = f(x) over [x0, x1]. Non-finite values are marked so the renderer
 * can break the line (asymptotes).
 * @param {(x: number) => number} f
 * @param {number} x0
 * @param {number} x1
 * @param {number} [n]
 * @returns {Array<{ x: number, y: number, defined: boolean }>}
 */
export function sampleFunction(f, x0, x1, n = 200) {
    return linspace(x0, x1, n).map((x) => {
        const y = f(x);
        return { x, y, defined: Number.isFinite(y) };
    });
}

/**
 * Sample a parametric curve (fx(t), fy(t)) over [t0, t1].
 * @param {(t: number) => number} fx
 * @param {(t: number) => number} fy
 * @param {number} t0
 * @param {number} t1
 * @param {number} [n]
 * @returns {Point2[]}
 */
export function sampleParametric(fx, fy, t0, t1, n = 300) {
    return linspace(t0, t1, n).map((t) => ({ x: fx(t), y: fy(t) }));
}

/**
 * @param {number} r
 * @param {number} theta  radians
 * @returns {Point2}
 */
export function polarToCartesian(r, theta) {
    return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}

/* ------------------------------------------------------------------ *
 *  3-D rotation & projection
 * ------------------------------------------------------------------ */

/**
 * Rotate a 3-D point by Euler angles (applied X, then Y, then Z), radians.
 * @param {Point3} p
 * @param {number} ax
 * @param {number} ay
 * @param {number} az
 * @returns {Point3}
 */
export function rotate3D(p, ax, ay, az) {
    let { x, y, z } = p;
    // X
    let cs = Math.cos(ax), sn = Math.sin(ax);
    [y, z] = [y * cs - z * sn, y * sn + z * cs];
    // Y
    cs = Math.cos(ay); sn = Math.sin(ay);
    [x, z] = [x * cs + z * sn, -x * sn + z * cs];
    // Z
    cs = Math.cos(az); sn = Math.sin(az);
    [x, y] = [x * cs - y * sn, x * sn + y * cs];
    return { x, y, z };
}

/**
 * Perspective projection of a 3-D point onto the 2-D plane. `distance` is the
 * camera's distance along +z; points are scaled by distance/(distance − z).
 * @param {Point3} p
 * @param {number} [distance]
 * @returns {Point2}
 */
export function project3Dto2D(p, distance = 5) {
    const denom = distance - p.z;
    const f = denom === 0 ? 1e6 : distance / denom;
    return { x: p.x * f, y: p.y * f };
}

/**
 * Euclidean norm of a 3-D point.
 * @param {Point3} p
 * @returns {number}
 */
export function norm3(p) {
    return Math.hypot(p.x, p.y, p.z);
}

/**
 * Sample z = f(x, y) on a regular grid — a surface mesh for 3-D plotting.
 * @param {(x: number, y: number) => number} f
 * @param {number} x0
 * @param {number} x1
 * @param {number} y0
 * @param {number} y1
 * @param {number} [nx]
 * @param {number} [ny]
 * @returns {{ xs: number[], ys: number[], z: number[][] }}
 */
export function surfaceGrid(f, x0, x1, y0, y1, nx = 30, ny = 30) {
    const xs = linspace(x0, x1, nx);
    const ys = linspace(y0, y1, ny);
    const z = ys.map((y) => xs.map((x) => f(x, y)));
    return { xs, ys, z };
}

/* ------------------------------------------------------------------ *
 *  4-D hypercube (tesseract)
 * ------------------------------------------------------------------ */

/**
 * The 16 vertices of a unit tesseract: every (±1, ±1, ±1, ±1).
 * @returns {Point4[]}
 */
export function tesseractVertices() {
    /** @type {Point4[]} */
    const v = [];
    for (let i = 0; i < 16; i++) {
        v.push([
            i & 1 ? 1 : -1,
            i & 2 ? 1 : -1,
            i & 4 ? 1 : -1,
            i & 8 ? 1 : -1,
        ]);
    }
    return v;
}

/**
 * The 32 edges of a tesseract as index pairs (vertices differing in one bit).
 * @returns {Array<[number, number]>}
 */
export function tesseractEdges() {
    /** @type {Array<[number, number]>} */
    const edges = [];
    for (let i = 0; i < 16; i++) {
        for (let b = 0; b < 4; b++) {
            const j = i ^ (1 << b);
            if (j > i) edges.push([i, j]);
        }
    }
    return edges;
}

/**
 * Rotate a 4-D point in the chosen pair of planes (xw and zw), radians — the
 * rotations with no 3-D analogue that make a tesseract appear to "turn inside
 * out" when projected.
 * @param {Point4} p
 * @param {number} angleXW
 * @param {number} angleZW
 * @returns {Point4}
 */
export function rotate4D(p, angleXW, angleZW) {
    const y = p[1]; // y is fixed by xw/zw-plane rotations
    let x = p[0], z = p[2], w = p[3];
    let cs = Math.cos(angleXW), sn = Math.sin(angleXW);
    [x, w] = [x * cs - w * sn, x * sn + w * cs];
    cs = Math.cos(angleZW); sn = Math.sin(angleZW);
    [z, w] = [z * cs - w * sn, z * sn + w * cs];
    return [x, y, z, w];
}

/**
 * Project a 4-D point to 3-D by perspective along the w-axis.
 * @param {Point4} p
 * @param {number} [distance]
 * @returns {Point3}
 */
export function project4Dto3D(p, distance = 3) {
    const [x, y, z, w] = p;
    const denom = distance - w;
    const f = denom === 0 ? 1e6 : distance / denom;
    return { x: x * f, y: y * f, z: z * f };
}

/**
 * Euclidean norm of a 4-D point.
 * @param {Point4} p
 * @returns {number}
 */
export function norm4(p) {
    return Math.hypot(p[0], p[1], p[2], p[3]);
}

/**
 * Full tesseract render pipeline: rotate in 4-D, project 4D→3D, optionally
 * rotate in 3-D, then project 3D→2D. Returns projected vertices + edges ready
 * for SVG line drawing.
 * @param {object} [opts]
 * @param {number} [opts.angleXW]
 * @param {number} [opts.angleZW]
 * @param {number} [opts.angle3D]
 * @returns {{ points: Point2[], edges: Array<[number, number]> }}
 */
export function renderTesseract(opts = {}) {
    const { angleXW = 0, angleZW = 0, angle3D = 0 } = opts;
    const points = tesseractVertices().map((v) => {
        const r4 = rotate4D(v, angleXW, angleZW);
        const p3 = project4Dto3D(r4);
        const r3 = rotate3D(p3, angle3D, angle3D, 0);
        return project3Dto2D(r3, 5);
    });
    return { points, edges: tesseractEdges() };
}
