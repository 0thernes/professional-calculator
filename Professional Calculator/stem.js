// @ts-check
/**
 * STEM Lab — a paged panel of live SVG visualizations you cycle through.
 *
 * Each "page" is a self-contained STEM visual (2-D function, parametric curve,
 * 3-D surface wireframe, Bloch sphere, rotating 4-D tesseract, quantum-circuit
 * probabilities, hydrogen spectrum, option payoff) rendered from the pure
 * generators in {@link module:math/plot} and the engine modules. Drawing is
 * done by building inline-SVG strings from fully numeric, controlled data —
 * no user input is interpolated, so there is no injection surface.
 *
 * The pure layout helpers (`mapToViewport`, `polyline`) are unit-tested; the
 * controller's navigation (next/prev/goto with wrap-around) is tested in jsdom.
 *
 * @module stem
 */

import * as Plot from './math/plot.js';
import * as Q from './math/quantum.js';
import * as Phys from './math/physics.js';
import { blackScholes } from './math/finance.js';

/** @typedef {{ x: number, y: number }} Point2 */

const VIEW = 360; // square SVG viewbox edge
const PAD = 28;

/* ------------------------------------------------------------------ *
 *  Pure layout helpers (tested)
 * ------------------------------------------------------------------ */

/**
 * Map data-space points into an SVG viewport, preserving aspect by independent
 * x/y scaling to the given bounds, flipping y (SVG y grows downward). Returns
 * pixel-space points. Degenerate (zero-width) ranges are padded.
 * @param {Point2[]} points
 * @param {object} [opts]
 * @param {number} [opts.size]    viewport edge
 * @param {number} [opts.pad]     inner padding
 * @param {{minX:number,maxX:number,minY:number,maxY:number}} [opts.bounds]
 * @returns {Point2[]}
 */
export function mapToViewport(points, opts = {}) {
    const size = opts.size ?? VIEW;
    const pad = opts.pad ?? PAD;
    let { minX, maxX, minY, maxY } = opts.bounds ?? bounds(points);
    if (maxX - minX === 0) { minX -= 1; maxX += 1; }
    if (maxY - minY === 0) { minY -= 1; maxY += 1; }
    const w = size - 2 * pad;
    const sx = w / (maxX - minX);
    const sy = w / (maxY - minY);
    return points.map((p) => ({
        x: pad + (p.x - minX) * sx,
        y: size - pad - (p.y - minY) * sy, // flip y
    }));
}

/**
 * Bounding box of a point set.
 * @param {Point2[]} points
 * @returns {{minX:number,maxX:number,minY:number,maxY:number}}
 */
export function bounds(points) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    if (!Number.isFinite(minX)) { minX = -1; maxX = 1; minY = -1; maxY = 1; }
    return { minX, maxX, minY, maxY };
}

/**
 * Join points into an SVG polyline/polygon "x,y x,y …" points string.
 * @param {Point2[]} points
 * @param {number} [dp]  decimal places
 * @returns {string}
 */
export function polyline(points, dp = 2) {
    return points
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
        .map((p) => `${p.x.toFixed(dp)},${p.y.toFixed(dp)}`)
        .join(' ');
}

const ACCENT = '#60a5fa';
const ACCENT2 = '#4ade80';
const GRID = 'rgba(255,255,255,0.08)';
const FG = '#e6e9ec';

/** @param {string} inner @returns {string} */
function svg(inner) {
    return `<svg viewBox="0 0 ${VIEW} ${VIEW}" xmlns="http://www.w3.org/2000/svg" width="100%" role="img">${inner}</svg>`;
}

/* ------------------------------------------------------------------ *
 *  Page renderers — each returns an SVG string
 * ------------------------------------------------------------------ */

/** @param {number} t  animation phase (radians) @returns {string} */
function drawFunction(t) {
    const f = (/** @type {number} */ x) => Math.sin(x + t) * Math.exp(-Math.abs(x) / 6);
    const raw = Plot.sampleFunction(f, -12, 12, 240).filter((p) => p.defined);
    const pts = mapToViewport(raw, { bounds: { minX: -12, maxX: 12, minY: -1.1, maxY: 1.1 } });
    const mid = VIEW / 2;
    return svg(`
        <line x1="${PAD}" y1="${mid}" x2="${VIEW - PAD}" y2="${mid}" stroke="${GRID}"/>
        <line x1="${mid}" y1="${PAD}" x2="${mid}" y2="${VIEW - PAD}" stroke="${GRID}"/>
        <polyline points="${polyline(pts)}" fill="none" stroke="${ACCENT2}" stroke-width="2"/>`);
}

/** @param {number} t @returns {string} */
function drawParametric(t) {
    const raw = Plot.sampleParametric(
        (u) => Math.sin(3 * u + t), (u) => Math.sin(2 * u), 0, 2 * Math.PI, 400);
    const pts = mapToViewport(raw, { bounds: { minX: -1.1, maxX: 1.1, minY: -1.1, maxY: 1.1 } });
    return svg(`<polyline points="${polyline(pts)}" fill="none" stroke="${ACCENT}" stroke-width="1.5"/>`);
}

/** @param {number} t @returns {string} */
function drawSurface(t) {
    const g = Plot.surfaceGrid((x, y) => Math.cos(Math.hypot(x, y)) , -4, 4, -4, 4, 22, 22);
    /** @type {string[]} */
    const lines = [];
    const projAll = [];
    for (let j = 0; j < g.ys.length; j++) {
        for (let i = 0; i < g.xs.length; i++) {
            const p3 = Plot.rotate3D({ x: g.xs[i] / 4, y: g.z[j][i] / 2, z: g.ys[j] / 4 }, 0.5, t, 0);
            projAll.push({ ...Plot.project3Dto2D(p3, 4), i, j });
        }
    }
    const mapped = mapToViewport(projAll, { bounds: { minX: -1.3, maxX: 1.3, minY: -1.3, maxY: 1.3 } });
    const idx = (/** @type {number} */ i, /** @type {number} */ j) => j * g.xs.length + i;
    for (let j = 0; j < g.ys.length; j++) {
        const row = [];
        for (let i = 0; i < g.xs.length; i++) row.push(mapped[idx(i, j)]);
        lines.push(`<polyline points="${polyline(row)}" fill="none" stroke="${ACCENT}" stroke-width="0.6" opacity="0.7"/>`);
    }
    for (let i = 0; i < g.xs.length; i++) {
        const col = [];
        for (let j = 0; j < g.ys.length; j++) col.push(mapped[idx(i, j)]);
        lines.push(`<polyline points="${polyline(col)}" fill="none" stroke="${ACCENT2}" stroke-width="0.6" opacity="0.5"/>`);
    }
    return svg(lines.join(''));
}

/** @param {number} t @returns {string} */
function drawBloch(t) {
    // qubit rotating around the Bloch sphere via Ry then Rz
    const state = Q.applyGate(Q.applyGate(Q.basisState(1, 0), Q.ry(0.9), 0), Q.rz(t), 0);
    const b = Q.blochVector(state);
    const mid = VIEW / 2;
    const R = (VIEW - 2 * PAD) / 2;
    // project bloch vector (x right, z up, y into screen via slight tilt)
    const px = mid + b.x * R;
    const py = mid - b.z * R + b.y * R * 0.25;
    return svg(`
        <circle cx="${mid}" cy="${mid}" r="${R}" fill="none" stroke="${GRID}" stroke-width="1.5"/>
        <ellipse cx="${mid}" cy="${mid}" rx="${R}" ry="${(R * 0.32).toFixed(2)}" fill="none" stroke="${GRID}"/>
        <line x1="${mid}" y1="${mid - R}" x2="${mid}" y2="${mid + R}" stroke="${GRID}"/>
        <line x1="${mid - R}" y1="${mid}" x2="${mid + R}" y2="${mid}" stroke="${GRID}"/>
        <line x1="${mid}" y1="${mid}" x2="${px.toFixed(2)}" y2="${py.toFixed(2)}" stroke="${ACCENT2}" stroke-width="2.5"/>
        <circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="5" fill="${ACCENT2}"/>
        <text x="${mid + 4}" y="${mid - R + 14}" fill="${FG}" font-size="11">|0⟩</text>
        <text x="${mid + 4}" y="${mid + R - 4}" fill="${FG}" font-size="11">|1⟩</text>`);
}

/** @param {number} t @returns {string} */
function drawTesseract(t) {
    const { points, edges } = Plot.renderTesseract({ angleXW: t * 0.7, angleZW: t * 0.4, angle3D: t * 0.3 });
    const mapped = mapToViewport(points, { bounds: { minX: -3, maxX: 3, minY: -3, maxY: 3 } });
    const segs = edges
        .map(([a, b]) => `<line x1="${mapped[a].x.toFixed(2)}" y1="${mapped[a].y.toFixed(2)}" x2="${mapped[b].x.toFixed(2)}" y2="${mapped[b].y.toFixed(2)}" stroke="${ACCENT}" stroke-width="1" opacity="0.8"/>`)
        .join('');
    const dots = mapped.map((p) => `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="2.5" fill="${ACCENT2}"/>`).join('');
    return svg(segs + dots);
}

/** @returns {string} */
function drawCircuit() {
    // Bell state probabilities as a bar chart
    const probs = Q.probabilities(Q.bellState());
    const labels = ['00', '01', '10', '11'];
    const barW = (VIEW - 2 * PAD) / 4;
    const maxH = VIEW - 2 * PAD - 20;
    const bars = probs.map((p, i) => {
        const h = p * maxH;
        const x = PAD + i * barW + barW * 0.2;
        const y = VIEW - PAD - h;
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(barW * 0.6).toFixed(1)}" height="${h.toFixed(1)}" fill="${ACCENT}"/>
                <text x="${(x + barW * 0.3).toFixed(1)}" y="${VIEW - PAD + 14}" fill="${FG}" font-size="11" text-anchor="middle">|${labels[i]}⟩</text>
                <text x="${(x + barW * 0.3).toFixed(1)}" y="${(y - 4).toFixed(1)}" fill="${ACCENT2}" font-size="10" text-anchor="middle">${(p * 100).toFixed(0)}%</text>`;
    }).join('');
    return svg(bars);
}

/** @returns {string} */
function drawSpectrum() {
    // hydrogen Balmer series spectral lines (visible, n→2)
    const lines = [3, 4, 5, 6].map((n) => Phys.rydbergWavelength(2, n) * 1e9); // nm
    const lo = 380, hi = 700;
    const colors = ['#e23b3b', '#3bb0e2', '#5b6bff', '#9b5bff'];
    const segs = lines.map((nm, i) => {
        const x = PAD + ((nm - lo) / (hi - lo)) * (VIEW - 2 * PAD);
        return `<line x1="${x.toFixed(1)}" y1="${PAD}" x2="${x.toFixed(1)}" y2="${VIEW - PAD - 18}" stroke="${colors[i]}" stroke-width="3"/>
                <text x="${x.toFixed(1)}" y="${VIEW - PAD - 4}" fill="${FG}" font-size="9" text-anchor="middle">${nm.toFixed(0)}nm</text>`;
    }).join('');
    return svg(`<rect x="${PAD}" y="${PAD}" width="${VIEW - 2 * PAD}" height="${VIEW - 2 * PAD - 18}" fill="rgba(0,0,0,0.3)"/>${segs}`);
}

/** @returns {string} */
function drawPayoff() {
    // European call: price (BS) and payoff at expiry vs spot
    const K = 100, r = 0.05, sigma = 0.2, T = 1;
    const spots = Plot.linspace(40, 160, 120);
    const priceRaw = spots.map((S) => ({ x: S, y: blackScholes(S, K, r, sigma, T).call }));
    const payoffRaw = spots.map((S) => ({ x: S, y: Math.max(0, S - K) }));
    const bnd = { minX: 40, maxX: 160, minY: 0, maxY: 60 };
    const price = mapToViewport(priceRaw, { bounds: bnd });
    const payoff = mapToViewport(payoffRaw, { bounds: bnd });
    return svg(`
        <polyline points="${polyline(payoff)}" fill="none" stroke="${GRID}" stroke-width="2" stroke-dasharray="4 3"/>
        <polyline points="${polyline(price)}" fill="none" stroke="${ACCENT2}" stroke-width="2"/>
        <text x="${PAD}" y="${PAD + 4}" fill="${ACCENT2}" font-size="11">BS call price</text>
        <text x="${PAD}" y="${PAD + 20}" fill="${FG}" font-size="10" opacity="0.7">payoff at expiry (dashed)</text>`);
}

/* ------------------------------------------------------------------ *
 *  Page registry
 * ------------------------------------------------------------------ */

/**
 * @typedef {object} StemPage
 * @property {string} id
 * @property {string} title
 * @property {string} caption
 * @property {boolean} animated
 * @property {(t: number) => string} render  returns an SVG string
 */

/** @type {StemPage[]} */
export const PAGES = [
    { id: 'function',  title: 'Damped Wave',        caption: 'y = sin(x+t)·e^(−|x|/6)',        animated: true,  render: drawFunction },
    { id: 'parametric',title: 'Lissajous Curve',    caption: 'x=sin(3t+φ), y=sin(2t)',         animated: true,  render: drawParametric },
    { id: 'surface',   title: '3D Surface',         caption: 'z = cos(√(x²+y²)) — rotating',    animated: true,  render: drawSurface },
    { id: 'bloch',     title: 'Bloch Sphere',       caption: 'qubit under Ry(0.9)·Rz(t)',      animated: true,  render: drawBloch },
    { id: 'tesseract', title: '4D Tesseract',       caption: 'hypercube rotating in xw/zw',    animated: true,  render: drawTesseract },
    { id: 'circuit',   title: 'Quantum Circuit',    caption: 'Bell state |Φ+⟩ probabilities',  animated: false, render: drawCircuit },
    { id: 'spectrum',  title: 'Hydrogen Spectrum',  caption: 'Balmer series (n→2)',            animated: false, render: drawSpectrum },
    { id: 'payoff',    title: 'Option Pricing',     caption: 'Black–Scholes call vs payoff',   animated: false, render: drawPayoff },
];

/* ------------------------------------------------------------------ *
 *  Controller
 * ------------------------------------------------------------------ */

export class StemController {
    /**
     * @param {{ stage: HTMLElement, title: HTMLElement, caption: HTMLElement, indicator: HTMLElement }} el
     * @param {{ now?: () => number, raf?: (cb: (t:number)=>void)=>number, caf?: (id:number)=>void }} [host]
     */
    constructor(el, host = {}) {
        this.el = el;
        this.pages = PAGES;
        this.index = 0;
        this._t = 0;
        this._rafId = 0;
        this._now = host.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : 0));
        this._raf = host.raf ?? ((cb) => (typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame(cb) : 0));
        this._caf = host.caf ?? ((id) => { if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(id); });
        this._loop = this._loop.bind(this);
    }

    /** @returns {StemPage} */
    current() {
        return this.pages[this.index];
    }

    /** Render the current page once (static frame at phase t). @param {number} [t] */
    renderOnce(t = this._t) {
        const page = this.current();
        this.el.title.textContent = page.title;
        this.el.caption.textContent = page.caption;
        this.el.indicator.textContent = `${this.index + 1} / ${this.pages.length}`;
        this.el.stage.innerHTML = page.render(t);
    }

    /** @param {number} i */
    goto(i) {
        const n = this.pages.length;
        this.index = ((i % n) + n) % n; // wrap-around
        this.renderOnce();
        this._restartAnimation();
    }

    next() { this.goto(this.index + 1); }
    prev() { this.goto(this.index - 1); }

    start() {
        this.renderOnce();
        this._restartAnimation();
    }

    stop() {
        if (this._rafId) this._caf(this._rafId);
        this._rafId = 0;
    }

    _restartAnimation() {
        this.stop();
        if (this.current().animated) {
            this._t0 = this._now();
            this._rafId = this._raf(this._loop);
        }
    }

    /** @param {number} now */
    _loop(now) {
        this._t = ((now - (this._t0 ?? now)) / 1000) % (Math.PI * 200);
        this.el.stage.innerHTML = this.current().render(this._t);
        this._rafId = this._raf(this._loop);
    }
}
