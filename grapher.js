// @ts-check
/**
 * Interactive graphing — a TI/Casio-grade 2D function plotter (trace · pan ·
 * zoom) and a rotatable 3D surface grapher (z = f(x,y)). Both are canvas-based
 * (pixel-resolution curves, drag/wheel interaction, animation) and zero-dep,
 * driving the existing Pratt parser via `math.compute(expr, {x[, y]})`. Colors
 * are read live from the CSS theme so the grapher tracks light/dark mode.
 *
 * @module grapher
 */

/** @param {string} n @returns {string} */
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#8aa';
export const palette = () => ({
    ink: cssVar('--ink'), dim: cssVar('--ink-dim'), faint: cssVar('--ink-faint'),
    line: cssVar('--line'), panel: cssVar('--panel') || '#0e1421',
    cyan: cssVar('--cyan'), violet: cssVar('--violet'), green: cssVar('--green'),
    amber: cssVar('--amber'), red: cssVar('--red'),
});

/** Compact number for axis ticks / readouts. @param {number} x @returns {string} */
export function fmtN(x) {
    if (!Number.isFinite(x)) return x > 0 ? '∞' : (x < 0 ? '−∞' : 'NaN');
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a >= 1e5 || a < 1e-3) return x.toExponential(2);
    return parseFloat(x.toPrecision(5)).toString();
}

/**
 * Create a DPR-aware canvas mounted into `host`, redrawing via `onResize` when
 * the container width changes.
 * @param {HTMLElement} host
 * @param {number} cssHeight
 * @param {() => void} onResize
 */
export function mkCanvas(host, cssHeight, onResize) {
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, { width: '100%', height: cssHeight + 'px', display: 'block', touchAction: 'none', borderRadius: '6px' });
    host.replaceChildren(canvas);
    const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    const state = { W: 0, H: cssHeight };
    const measure = () => {
        const m = Math.floor(canvas.getBoundingClientRect().width || host.clientWidth || 0);
        return m > 1 ? m : 600; // fall back to a sane default if layout hasn't resolved a width yet
    };
    const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        state.W = measure();
        canvas.width = Math.floor(state.W * dpr);
        canvas.height = Math.floor(cssHeight * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    let w = state.W;
    const onChange = () => { const nw = measure(); if (nw !== w) { w = nw; resize(); onResize(); } };
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(onChange).observe(canvas);
    window.addEventListener('resize', onChange);
    return { canvas, ctx, state, resize };
}

/** Nice 1·2·5 tick step for a range across ~`target` divisions. @param {number} range @param {number} target */
function tickStep(range, target) {
    const raw = range / target;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}

/* ============================================================= *
 *  2D graphing calculator
 * ============================================================= */

/** @param {any} math */
export function init2DGrapher(math) {
    const stage = document.getElementById('g2d-stage');
    if (!stage) return;
    const inputs = ['g2d-f1', 'g2d-f2', 'g2d-f3']
        .map((id) => /** @type {HTMLInputElement|null} */ (document.getElementById(id)))
        .filter((/** @type {HTMLInputElement|null} */ e) => !!e);
    const readout = document.getElementById('g2d-read');

    const cv = mkCanvas(stage, 300, () => draw());
    /** @type {{xmin:number,xmax:number,ymin:number,ymax:number}} */
    let view = { xmin: -10, xmax: 10, ymin: -6.5, ymax: 6.5 };
    /** @type {any[]} */
    let fns = [];
    /** @type {number|null} */
    let traceX = null;

    const compile = (/** @type {string} */ expr) => (/** @type {number} */ x) => {
        const r = math.compute(expr, { x });
        return r.isMatrix ? NaN : r.value.re;
    };
    function readFns() {
        const p = palette();
        const cols = [p.cyan, p.violet, p.green];
        fns = inputs.map((inp, i) => ({ expr: (inp.value || '').trim(), color: cols[i % cols.length] }))
            .filter((o) => o.expr)
            .map((o) => { try { const f = compile(o.expr); f(0); return { ...o, f }; } catch { return null; } })
            .filter((/** @type {any} */ o) => !!o);
    }

    const sx = (/** @type {number} */ x) => (x - view.xmin) / (view.xmax - view.xmin) * cv.state.W;
    const sy = (/** @type {number} */ y) => cv.state.H - (y - view.ymin) / (view.ymax - view.ymin) * cv.state.H;
    const wx = (/** @type {number} */ px) => view.xmin + px / cv.state.W * (view.xmax - view.xmin);

    function draw() {
        const { ctx, state: { W, H } } = cv;
        const p = palette();
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = p.panel; ctx.fillRect(0, 0, W, H);
        ctx.font = '10px ui-monospace, monospace';

        // grid
        const xStep = tickStep(view.xmax - view.xmin, 10);
        const yStep = tickStep(view.ymax - view.ymin, 8);
        const x0 = sx(0), y0 = sy(0);
        ctx.lineWidth = 1;
        for (let x = Math.ceil(view.xmin / xStep) * xStep; x <= view.xmax; x += xStep) {
            const X = sx(x);
            ctx.strokeStyle = p.line; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.moveTo(X, 0); ctx.lineTo(X, H); ctx.stroke(); ctx.globalAlpha = 1;
            if (Math.abs(x) > 1e-9) { ctx.fillStyle = p.faint; ctx.fillText(fmtN(x), X + 2, Math.min(Math.max(y0 + 11, 11), H - 2)); }
        }
        for (let y = Math.ceil(view.ymin / yStep) * yStep; y <= view.ymax; y += yStep) {
            const Y = sy(y);
            ctx.strokeStyle = p.line; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.moveTo(0, Y); ctx.lineTo(W, Y); ctx.stroke(); ctx.globalAlpha = 1;
            if (Math.abs(y) > 1e-9) { ctx.fillStyle = p.faint; ctx.fillText(fmtN(y), Math.min(Math.max(x0 + 3, 2), W - 28), Y - 2); }
        }
        // axes
        ctx.strokeStyle = p.dim; ctx.lineWidth = 1.5;
        if (view.ymin < 0 && view.ymax > 0) { ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0); ctx.stroke(); }
        if (view.xmin < 0 && view.xmax > 0) { ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, H); ctx.stroke(); }

        // curves — one sample per pixel column, breaking on poles / non-finite
        ctx.lineWidth = 2; ctx.lineJoin = 'round';
        for (const o of fns) {
            ctx.strokeStyle = o.color; ctx.beginPath();
            let pen = false, prevY = NaN;
            for (let px = 0; px <= W; px++) {
                let y; try { y = o.f(wx(px)); } catch { y = NaN; }
                if (!Number.isFinite(y)) { pen = false; continue; }
                const Y = sy(y);
                if (!pen) { ctx.moveTo(px, Y); pen = true; }
                else if (Math.abs(Y - prevY) > H * 1.5) { ctx.moveTo(px, Y); }
                else { ctx.lineTo(px, Y); }
                prevY = Y;
            }
            ctx.stroke();
        }

        // trace cursor
        if (traceX != null && fns.length) {
            const tx = traceX;
            const px = sx(tx);
            ctx.strokeStyle = p.amber; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
            ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke(); ctx.setLineDash([]);
            const parts = [`x = ${fmtN(tx)}`];
            fns.forEach((o, i) => {
                let y; try { y = o.f(tx); } catch { y = NaN; }
                if (Number.isFinite(y)) {
                    ctx.fillStyle = o.color; ctx.beginPath(); ctx.arc(px, sy(y), 3.5, 0, Math.PI * 2); ctx.fill();
                    parts.push(`f${i + 1} = ${fmtN(y)}`);
                }
            });
            if (readout) readout.textContent = parts.join('    ');
        } else if (readout) {
            readout.textContent = fns.length ? 'hover to trace · drag to pan · scroll to zoom' : 'enter a function and press Plot';
        }
    }

    function replot() { readFns(); draw(); }

    // pan
    /** @type {any} */
    let drag = null;
    cv.canvas.addEventListener('pointerdown', (e) => {
        drag = { px: e.offsetX, py: e.offsetY, v: { ...view } }; traceX = null;
        cv.canvas.setPointerCapture(e.pointerId); cv.canvas.style.cursor = 'grabbing';
    });
    cv.canvas.addEventListener('pointermove', (e) => {
        if (drag) {
            const dx = (e.offsetX - drag.px) / cv.state.W * (drag.v.xmax - drag.v.xmin);
            const dy = (e.offsetY - drag.py) / cv.state.H * (drag.v.ymax - drag.v.ymin);
            view = { xmin: drag.v.xmin - dx, xmax: drag.v.xmax - dx, ymin: drag.v.ymin + dy, ymax: drag.v.ymax + dy };
            draw();
        } else { traceX = wx(e.offsetX); draw(); }
    });
    const endDrag = () => { drag = null; cv.canvas.style.cursor = 'crosshair'; };
    cv.canvas.addEventListener('pointerup', endDrag);
    cv.canvas.addEventListener('pointerleave', () => { traceX = null; endDrag(); draw(); });
    cv.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const k = e.deltaY > 0 ? 1.12 : 1 / 1.12;
        const cxw = wx(e.offsetX), cyw = view.ymin + (cv.state.H - e.offsetY) / cv.state.H * (view.ymax - view.ymin);
        view = {
            xmin: cxw + (view.xmin - cxw) * k, xmax: cxw + (view.xmax - cxw) * k,
            ymin: cyw + (view.ymin - cyw) * k, ymax: cyw + (view.ymax - cyw) * k,
        };
        draw();
    }, { passive: false });

    // controls
    document.querySelectorAll('.grapher2d [data-g2d]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const op = /** @type {HTMLElement} */ (btn).dataset.g2d;
            const cx = (view.xmin + view.xmax) / 2, cy = (view.ymin + view.ymax) / 2;
            if (op === 'plot') replot();
            else if (op === 'zin' || op === 'zout') {
                const k = op === 'zin' ? 1 / 1.4 : 1.4;
                view = { xmin: cx + (view.xmin - cx) * k, xmax: cx + (view.xmax - cx) * k, ymin: cy + (view.ymin - cy) * k, ymax: cy + (view.ymax - cy) * k };
                draw();
            } else if (op === 'reset') { view = { xmin: -10, xmax: 10, ymin: -6.5, ymax: 6.5 }; draw(); }
        });
    });
    inputs.forEach((inp) => inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') replot(); }));

    replot();
}

/* ============================================================= *
 *  3D surface grapher — z = f(x, y)
 * ============================================================= */

/** Blue→cyan→green→amber→red ramp for height shading. @param {number} t 0..1 */
function heat(t) {
    const h = 240 - 240 * Math.max(0, Math.min(1, t));
    return `hsl(${h}, 78%, 56%)`;
}

/** @param {any} math */
export function init3DSurface(math) {
    const stage = document.getElementById('g3d-stage');
    if (!stage) return;
    const exprElRaw = document.getElementById('g3d-expr');
    const readout = document.getElementById('g3d-read');
    if (!exprElRaw) return;
    const exprEl = /** @type {HTMLInputElement} */ (exprElRaw);

    const cv = mkCanvas(stage, 320, () => draw());
    let yaw = 0.7, pitch = 0.55, zoom = 1;
    const dom = { x0: -3, x1: 3, y0: -3, y1: 3, n: 32 };
    /** @type {{xs:number[],ys:number[],z:number[][],zmin:number,zmax:number}|null} */
    let surf = null;
    let spin = false, raf = 0;

    function build() {
        const expr = exprEl.value.trim();
        const f = (/** @type {number} */ x, /** @type {number} */ y) => {
            const r = math.compute(expr, { x, y });
            return r.isMatrix ? NaN : r.value.re;
        };
        const g = math.Plot.surfaceGrid(f, dom.x0, dom.x1, dom.y0, dom.y1, dom.n, dom.n);
        let zmin = Infinity, zmax = -Infinity;
        for (const row of g.z) for (const v of row) if (Number.isFinite(v)) { if (v < zmin) zmin = v; if (v > zmax) zmax = v; }
        if (!Number.isFinite(zmin)) { zmin = -1; zmax = 1; }
        surf = { ...g, zmin, zmax };
    }

    function draw() {
        if (!surf) return;
        const { ctx, state: { W, H } } = cv;
        const p = palette();
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = p.panel; ctx.fillRect(0, 0, W, H);
        const { xs, ys, z, zmin, zmax } = surf;
        const zc = (zmax + zmin) / 2, zr = (zmax - zmin) || 1;
        const sxr = (dom.x1 - dom.x0) || 1, syr = (dom.y1 - dom.y0) || 1;
        const scale = Math.min(W, H) * 0.34 * zoom, cx = W / 2, cy = H / 2;
        const proj = (/** @type {number} */ i, /** @type {number} */ j) => {
            const x = (xs[i] - (dom.x0 + dom.x1) / 2) / sxr * 3;
            const y = (ys[j] - (dom.y0 + dom.y1) / 2) / syr * 3;
            const zz = ((z[j][i] - zc) / zr) * 2.2;
            const r = math.Plot.rotate3D({ x, y: zz, z: y }, pitch, yaw, 0);
            const pr = math.Plot.project3Dto2D({ x: r.x, y: r.y, z: r.z }, 6);
            return { X: cx + pr.x * scale, Y: cy - pr.y * scale, depth: r.z, zval: z[j][i] };
        };
        /** @type {any[]} */
        const quads = [];
        for (let j = 0; j < ys.length - 1; j++) for (let i = 0; i < xs.length - 1; i++) {
            const a = proj(i, j), b = proj(i + 1, j), c = proj(i + 1, j + 1), d = proj(i, j + 1);
            if (![a, b, c, d].every((q) => Number.isFinite(q.X) && Number.isFinite(q.Y) && Number.isFinite(q.zval))) continue;
            quads.push({ a, b, c, d, depth: (a.depth + b.depth + c.depth + d.depth) / 4, zval: (a.zval + b.zval + c.zval + d.zval) / 4 });
        }
        quads.sort((q1, q2) => q1.depth - q2.depth);
        ctx.lineWidth = 0.5; ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        for (const q of quads) {
            ctx.fillStyle = heat((q.zval - zmin) / (zmax - zmin || 1));
            ctx.beginPath(); ctx.moveTo(q.a.X, q.a.Y); ctx.lineTo(q.b.X, q.b.Y); ctx.lineTo(q.c.X, q.c.Y); ctx.lineTo(q.d.X, q.d.Y); ctx.closePath();
            ctx.fill(); ctx.stroke();
        }
        if (readout) readout.textContent = `z ∈ [${fmtN(zmin)}, ${fmtN(zmax)}]  ·  drag to rotate · scroll to zoom`;
    }

    function rebuild() { try { build(); draw(); } catch (e) { if (readout) readout.textContent = '⚠ ' + (e instanceof Error ? e.message : String(e)); } }

    /** @type {any} */
    let drag = null;
    cv.canvas.style.cursor = 'grab';
    cv.canvas.addEventListener('pointerdown', (e) => { drag = { px: e.offsetX, py: e.offsetY, yaw, pitch }; cv.canvas.setPointerCapture(e.pointerId); cv.canvas.style.cursor = 'grabbing'; });
    cv.canvas.addEventListener('pointermove', (e) => {
        if (!drag) return;
        yaw = drag.yaw + (e.offsetX - drag.px) * 0.01;
        pitch = Math.max(-1.5, Math.min(1.5, drag.pitch + (e.offsetY - drag.py) * 0.01));
        draw();
    });
    const end = () => { drag = null; cv.canvas.style.cursor = 'grab'; };
    cv.canvas.addEventListener('pointerup', end);
    cv.canvas.addEventListener('pointerleave', end);
    cv.canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoom *= e.deltaY > 0 ? 1 / 1.1 : 1.1; zoom = Math.max(0.3, Math.min(4, zoom)); draw(); }, { passive: false });

    const loop = () => { if (!spin) return; yaw += 0.01; draw(); raf = requestAnimationFrame(loop); };
    document.querySelectorAll('.grapher3d [data-g3d]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const op = /** @type {HTMLElement} */ (btn).dataset.g3d;
            if (op === 'plot') rebuild();
            else if (op === 'spin') { spin = !spin; if (spin) { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); } else cancelAnimationFrame(raf); }
            else if (op === 'reset') { yaw = 0.7; pitch = 0.55; zoom = 1; draw(); }
        });
    });
    exprEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') rebuild(); });

    rebuild();
}
