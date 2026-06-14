/**
 * @jest-environment jsdom
 */
import { mapToViewport, bounds, polyline, PAGES, StemController } from '../stem.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-9) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);
/** @param {string} id @returns {HTMLElement} */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

describe('stem — layout helpers', () => {
    test('bounds of a point set', () => {
        const b = bounds([{ x: -2, y: 1 }, { x: 3, y: -4 }, { x: 0, y: 0 }]);
        expect(b).toEqual({ minX: -2, maxX: 3, minY: -4, maxY: 1 });
    });
    test('bounds ignores non-finite', () => {
        const b = bounds([{ x: 0, y: 0 }, { x: NaN, y: 2 }, { x: 1, y: 1 }]);
        expect(b.maxX).toBe(1);
    });
    test('mapToViewport flips y (data max → top)', () => {
        const pts = mapToViewport(
            [{ x: 0, y: 0 }, { x: 1, y: 1 }],
            { size: 100, pad: 10, bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 } });
        // data y=1 should map to a smaller pixel-y (higher on screen) than y=0
        expect(pts[1].y).toBeLessThan(pts[0].y);
        near(pts[0].x, 10); near(pts[1].x, 90);
        near(pts[0].y, 90); near(pts[1].y, 10);
    });
    test('mapToViewport handles degenerate range', () => {
        const pts = mapToViewport([{ x: 5, y: 5 }], { size: 100, pad: 10 });
        expect(Number.isFinite(pts[0].x)).toBe(true);
        expect(Number.isFinite(pts[0].y)).toBe(true);
    });
    test('polyline formats and drops non-finite', () => {
        const s = polyline([{ x: 1, y: 2 }, { x: NaN, y: 3 }, { x: 4.567, y: 5 }], 1);
        expect(s).toBe('1.0,2.0 4.6,5.0');
    });
});

describe('stem — page registry', () => {
    test('has multiple STEM pages', () => expect(PAGES.length).toBeGreaterThanOrEqual(8));
    test('every page renders valid SVG', () => {
        for (const page of PAGES) {
            const out = page.render(0.5);
            expect(out.startsWith('<svg')).toBe(true);
            expect(out).toContain('</svg>');
        }
    });
    test('page ids are unique', () => {
        expect(new Set(PAGES.map((p) => p.id)).size).toBe(PAGES.length);
    });
    test('animated pages produce different frames over time', () => {
        const tess = /** @type {(typeof PAGES)[number]} */ (PAGES.find((p) => p.id === 'tesseract'));
        expect(tess.render(0)).not.toBe(tess.render(1.0));
    });
    test('static pages are stable across t', () => {
        const circuit = /** @type {(typeof PAGES)[number]} */ (PAGES.find((p) => p.id === 'circuit'));
        expect(circuit.render(0)).toBe(circuit.render(9));
    });
    test('FFT page exists and renders a bar-chart SVG', () => {
        const fft = /** @type {(typeof PAGES)[number]} */ (PAGES.find((p) => p.id === 'fft'));
        expect(fft).toBeTruthy();
        const out = fft.render(0);
        expect(out.startsWith('<svg')).toBe(true);
        expect(out).toContain('<rect');
        expect(fft.render(0)).toBe(fft.render(3)); // static
    });
});

describe('stem — cubic spline page', () => {
    test('spline page renders a curve + data points', () => {
        const sp = /** @type {(typeof PAGES)[number]} */ (PAGES.find((p) => p.id === 'spline'));
        expect(sp).toBeTruthy();
        const out = sp.render(0);
        expect(out.startsWith('<svg')).toBe(true);
        expect(out).toContain('<polyline');
        expect(out).toContain('<circle');
        expect(sp.render(0)).toBe(sp.render(2)); // static
    });
    test('the spline passes through its data nodes', async () => {
        const Interp = await import('../math/interpolate.js');
        const xs = [0, 1, 2, 3, 4, 5];
        const ys = [0, 2, 1, 3, 1, 4];
        const s = Interp.cubicSpline(xs, ys);
        xs.forEach((x, i) => expect(Math.abs(s(x) - ys[i])).toBeLessThan(1e-9));
    });
});

describe('stem — MST graph page', () => {
    test('graph page exists and renders an SVG with nodes & edges', () => {
        const g = /** @type {(typeof PAGES)[number]} */ (PAGES.find((p) => p.id === 'graph'));
        expect(g).toBeTruthy();
        const out = g.render(0);
        expect(out.startsWith('<svg')).toBe(true);
        expect(out).toContain('<circle');
        expect(out).toContain('<line');
        expect(g.render(0)).toBe(g.render(5)); // static
    });
    test('the demo graph MST has weight 33 over 5 edges', async () => {
        const Graph = await import('../math/graph.js');
        const edges = [
            { u: 0, v: 1, w: 7 }, { u: 0, v: 2, w: 9 }, { u: 0, v: 5, w: 14 },
            { u: 1, v: 2, w: 10 }, { u: 1, v: 3, w: 15 }, { u: 2, v: 3, w: 11 },
            { u: 2, v: 5, w: 2 }, { u: 3, v: 4, w: 6 }, { u: 4, v: 5, w: 9 },
        ];
        const tree = Graph.mst(6, edges);
        expect(tree.weight).toBe(33);
        expect(tree.edges.length).toBe(5);
    });
});

describe('stem — FFT page is functionally correct', () => {
    test('magnitude spectrum of sin(3)+½sin(7) peaks at bins 3 and 7', async () => {
        const Sig = await import('../math/signal.js');
        const N = 64;
        const signal = Array.from({ length: N }, (_, k) =>
            Math.sin((2 * Math.PI * 3 * k) / N) + 0.5 * Math.sin((2 * Math.PI * 7 * k) / N));
        const mag = Sig.magnitude(Sig.fft(signal)).slice(0, N / 2);
        // the two largest bins are 3 (full amplitude) then 7 (half amplitude)
        const ranked = mag.map((m, i) => ({ m, i })).sort((a, b) => b.m - a.m);
        expect(ranked[0].i).toBe(3);
        expect(ranked[1].i).toBe(7);
        expect(ranked[0].m).toBeGreaterThan(ranked[1].m);
    });
});

function setup() {
    document.body.innerHTML = `
        <div id="stem-stage"></div>
        <span id="stem-title"></span>
        <span id="stem-caption"></span>
        <span id="stem-indicator"></span>`;
    // injected, controllable host (no real RAF/clock)
    const controller = new StemController(
        {
            stage: /** @type {HTMLElement} */ ($('stem-stage')),
            title: /** @type {HTMLElement} */ ($('stem-title')),
            caption: /** @type {HTMLElement} */ (document.getElementById('stem-caption')),
            indicator: /** @type {HTMLElement} */ ($('stem-indicator')),
        },
        { now: () => 0, raf: () => 0, caf: () => {} } // no-op animation in tests
    );
    return controller;
}

describe('stem — controller navigation', () => {
    test('renders current page on start', () => {
        const c = setup();
        c.start();
        expect($('stem-stage').innerHTML).toContain('<svg');
        expect($('stem-title').textContent).toBe(PAGES[0].title);
        expect($('stem-indicator').textContent).toBe(`1 / ${PAGES.length}`);
    });
    test('next advances', () => {
        const c = setup();
        c.start();
        c.next();
        expect(c.index).toBe(1);
        expect($('stem-title').textContent).toBe(PAGES[1].title);
    });
    test('prev from 0 wraps to last', () => {
        const c = setup();
        c.start();
        c.prev();
        expect(c.index).toBe(PAGES.length - 1);
    });
    test('next from last wraps to 0', () => {
        const c = setup();
        c.goto(PAGES.length - 1);
        c.next();
        expect(c.index).toBe(0);
    });
    test('goto clamps via modulo', () => {
        const c = setup();
        c.goto(PAGES.length + 2);
        expect(c.index).toBe(2);
    });
    test('current() returns the page object', () => {
        const c = setup();
        c.goto(4);
        expect(c.current()).toBe(PAGES[4]);
    });
    test('stop is safe to call', () => {
        const c = setup();
        c.start();
        expect(() => c.stop()).not.toThrow();
    });
});
