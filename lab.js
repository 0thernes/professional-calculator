// @ts-check
/**
 * Interactive engine surfaces layered on top of the REPL:
 *
 *  - {@link initPalette}   wires the capability "chips" so a click inserts a
 *    real, runnable expression into the REPL and evaluates it.
 *  - {@link initMatrixLab} drives the Linear Algebra Lab: it parses a matrix
 *    literal through the engine's own parser, then runs det / eigenvalues /
 *    inverse / SVD / condition number / … live and renders the result.
 *
 * Pure presentation glue — all DOM writes use textContent / createElement
 * (no innerHTML), so nothing here is an injection surface.
 *
 * @module lab
 */

/** @typedef {import('./math/complex.js').Complex} Complex */
/** @typedef {number[][]} Matrix */

/* ------------------------------------------------------------------ *
 *  Capability palette
 * ------------------------------------------------------------------ */

/**
 * Wire every `[data-insert]` chip: click → fill the REPL input with the
 * expression and submit it.
 * @param {import('./repl.js').ScientificREPL} repl
 */
export function initPalette(repl) {
    const chips = document.querySelectorAll('[data-insert]');
    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            const expr = /** @type {HTMLElement} */ (chip).dataset.insert;
            if (!expr) return;
            repl.input.value = expr;
            repl.input.focus();
            repl.submitCurrent();
        });
    });
}

/* ------------------------------------------------------------------ *
 *  Linear Algebra Lab
 * ------------------------------------------------------------------ */

/** Format a real number for compact, readable display. @param {number} x @returns {string} */
function fmt(x) {
    if (!Number.isFinite(x)) return String(x);
    const r = Math.abs(x) < 1e-12 ? 0 : x;
    return Number.isInteger(r) ? String(r) : parseFloat(r.toPrecision(6)).toString();
}

/** Format a complex number. @param {Complex} z @returns {string} */
function fmtComplex(z) {
    if (Math.abs(z.im) < 1e-12) return fmt(z.re);
    const sign = z.im < 0 ? '−' : '+';
    return `${fmt(z.re)} ${sign} ${fmt(Math.abs(z.im))}i`;
}

/** Build a titled block. @param {string} title @returns {HTMLDivElement} */
function block(title) {
    const wrap = document.createElement('div');
    const t = document.createElement('span');
    t.className = 'ml-title';
    t.textContent = title;
    wrap.appendChild(t);
    return wrap;
}

/** Render a matrix as a bracketed grid. @param {Matrix} m @returns {HTMLElement} */
function renderMatrix(m) {
    const grid = document.createElement('div');
    grid.className = 'mtx';
    const cols = m.length ? m[0].length : 0;
    grid.style.gridTemplateColumns = `repeat(${cols}, auto)`;
    for (const row of m) {
        for (const cell of row) {
            const c = document.createElement('span');
            c.className = 'mtx-cell';
            c.textContent = fmt(cell);
            grid.appendChild(c);
        }
    }
    return grid;
}

/** Render a list of strings as stacked rows. @param {string[]} items @returns {HTMLElement} */
function renderList(items) {
    const ul = document.createElement('div');
    ul.className = 'ml-list';
    for (const it of items) {
        const li = document.createElement('span');
        li.textContent = it;
        ul.appendChild(li);
    }
    return ul;
}

/** @param {number} x @returns {HTMLElement} */
function renderScalar(x) {
    const s = document.createElement('span');
    s.className = 'ml-scalar';
    s.textContent = fmt(x);
    return s;
}

/**
 * Wire the Matrix Lab operation buttons to the engine.
 * @param {typeof import('./math/index.js')} math
 */
export function initMatrixLab(math) {
    const input = /** @type {HTMLTextAreaElement | null} */ (document.getElementById('ml-input'));
    const output = document.getElementById('ml-output');
    if (!input || !output) return;
    const buttons = document.querySelectorAll('.ml-ops [data-op]');
    const { Matrix, Decomposition } = math;

    /** @param {HTMLElement} node */
    const show = (node) => output.replaceChildren(node);

    /** @param {string} msg */
    const showError = (msg) => {
        const e = document.createElement('span');
        e.className = 'ml-err';
        e.textContent = `⚠ ${msg}`;
        show(e);
    };

    /** Parse the textarea into a real matrix via the engine's own parser. @returns {Matrix} */
    const readMatrix = () => {
        const res = math.compute(input.value.trim());
        if (!res.isMatrix) throw new Error('enter a matrix literal, e.g. [[1,2],[3,4]]');
        return /** @type {Matrix} */ (res.value);
    };

    /** @param {string} op */
    const run = (op) => {
        try {
            const m = readMatrix();
            switch (op) {
                case 'det':       return show(wrap('det A', renderScalar(Matrix.det(m))));
                case 'trace':     return show(wrap('tr A', renderScalar(Matrix.trace(m))));
                case 'rank':      return show(wrap('rank A', renderScalar(Matrix.rank(m))));
                case 'norm':      return show(wrap('‖A‖_F', renderScalar(Matrix.normFro(m))));
                case 'transpose': return show(wrap('Aᵀ', renderMatrix(Matrix.transpose(m))));
                case 'inv':       return show(wrap('A⁻¹', renderMatrix(Matrix.inv(m))));
                case 'cond':      return show(wrap('cond₂(A) = κ', renderScalar(Decomposition.conditionNumber(m))));
                case 'svd':
                    return show(wrap('singular values σ', renderList(Decomposition.singularValues(m).map(fmt))));
                case 'eig':
                    return show(wrap('eigenvalues λ', renderList(Matrix.eigenvalues(m).map(fmtComplex))));
                default:
                    return showError(`unknown operation '${op}'`);
            }
        } catch (err) {
            showError(err instanceof Error ? err.message : String(err));
        }
    };

    /** @param {string} title @param {HTMLElement} body @returns {HTMLElement} */
    function wrap(title, body) {
        const b = block(title);
        b.appendChild(body);
        return b;
    }

    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const op = /** @type {HTMLElement} */ (btn).dataset.op;
            if (op) run(op);
        });
    });
}

/* ------------------------------------------------------------------ *
 *  Shared helpers for the live engine panels
 * ------------------------------------------------------------------ */

const SVGNS = 'http://www.w3.org/2000/svg';

/** @param {string} tag @param {Record<string, string|number>} attrs @returns {Element} */
function svg(tag, attrs) {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs) el.setAttribute(k, String(attrs[k]));
    return el;
}

/** @param {string} id @returns {HTMLInputElement | null} */
function inputEl(id) {
    return /** @type {HTMLInputElement | null} */ (document.getElementById(id));
}

/** @param {string} id @returns {number} */
function numVal(id) {
    const el = inputEl(id);
    return el ? parseFloat(el.value) : NaN;
}

/** @param {string} id @param {number} v */
function setNum(id, v) {
    const el = inputEl(id);
    if (el) el.value = String(v);
}

/** @param {unknown} e @returns {HTMLElement} */
function errSpan(e) {
    const s = document.createElement('span');
    s.className = 'ml-err';
    s.textContent = '⚠ ' + (e instanceof Error ? e.message : String(e));
    return s;
}

/** @param {string} txt @returns {HTMLElement} */
function line(txt) {
    const s = document.createElement('span');
    s.textContent = txt;
    return s;
}

/** @param {string} str @returns {number[]} */
function parseNums(str) {
    return str.split(',').map((s) => parseFloat(s.trim())).filter((n) => Number.isFinite(n));
}

/** SVG line plot from sampled points; breaks the path at undefined/non-finite y.
 * @param {{x:number,y:number,defined?:boolean}[]} pts @param {string} label @returns {Element} */
function linePlotSvg(pts, label) {
    const W = 300, H = 190, pad = 26;
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': label });
    const def = pts.filter((p) => p.defined !== false && Number.isFinite(p.y));
    if (!def.length) {
        const t = svg('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle', fill: '#9fb0c6', 'font-size': 11 });
        t.textContent = 'no finite values'; root.appendChild(t); return root;
    }
    const xmin = Math.min(...def.map((p) => p.x));
    let xmax = Math.max(...def.map((p) => p.x));
    const ymin = Math.min(...def.map((p) => p.y));
    let ymax = Math.max(...def.map((p) => p.y));
    if (xmax === xmin) xmax = xmin + 1;
    if (ymax === ymin) ymax = ymin + 1;
    const px = (/** @type {number} */ x) => pad + ((x - xmin) / (xmax - xmin)) * (W - 2 * pad);
    const py = (/** @type {number} */ y) => (H - pad) - ((y - ymin) / (ymax - ymin)) * (H - 2 * pad);
    if (ymin < 0 && ymax > 0) root.appendChild(svg('line', { x1: pad, y1: py(0), x2: W - pad, y2: py(0), stroke: '#1f2a3f', 'stroke-width': 1 }));
    if (xmin < 0 && xmax > 0) root.appendChild(svg('line', { x1: px(0), y1: pad, x2: px(0), y2: H - pad, stroke: '#1f2a3f', 'stroke-width': 1 }));
    let d = '', pen = false;
    for (const p of pts) {
        if (p.defined === false || !Number.isFinite(p.y)) { pen = false; continue; }
        const X = px(p.x).toFixed(2), Y = py(p.y).toFixed(2);
        d += pen ? ` L ${X} ${Y}` : ` M ${X} ${Y}`;
        pen = true;
    }
    root.appendChild(svg('path', { d: d.trim(), fill: 'none', stroke: '#22d3ee', 'stroke-width': 1.8 }));
    const lab = svg('text', { x: pad, y: 14, fill: '#a78bfa', 'font-size': 10, 'font-family': 'monospace' });
    lab.textContent = label; root.appendChild(lab);
    const yr = svg('text', { x: W - pad, y: 14, fill: '#5e6f88', 'font-size': 9, 'text-anchor': 'end', 'font-family': 'monospace' });
    yr.textContent = `y∈[${fmt(ymin)}, ${fmt(ymax)}]`; root.appendChild(yr);
    const xr = svg('text', { x: W / 2, y: H - 6, fill: '#5e6f88', 'font-size': 9, 'text-anchor': 'middle', 'font-family': 'monospace' });
    xr.textContent = `x∈[${fmt(xmin)}, ${fmt(xmax)}]`; root.appendChild(xr);
    return root;
}

/** SVG bar chart (FFT magnitude spectrum). @param {number[]} vals @param {string} label @returns {Element} */
function barChartSvg(vals, label) {
    const W = 300, H = 170, pad = 22, n = vals.length;
    const max = Math.max(...vals, 1e-12);
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': label });
    const bw = (W - 2 * pad) / n;
    vals.forEach((v, i) => {
        const h = (v / max) * (H - 2 * pad);
        root.appendChild(svg('rect', { x: (pad + i * bw + 0.5).toFixed(2), y: (H - pad - h).toFixed(2), width: Math.max(1, bw - 1.5).toFixed(2), height: h.toFixed(2), fill: '#22d3ee', opacity: 0.85 }));
    });
    root.appendChild(svg('line', { x1: pad, y1: H - pad, x2: W - pad, y2: H - pad, stroke: '#1f2a3f', 'stroke-width': 1 }));
    const lab = svg('text', { x: pad, y: 14, fill: '#a78bfa', 'font-size': 10, 'font-family': 'monospace' });
    lab.textContent = `${label} · N=${n}`; root.appendChild(lab);
    return root;
}

/** Bloch-sphere SVG for a single-qubit state vector. @param {{x:number,y:number,z:number}} v @returns {Element} */
function blochSvg(v) {
    const cx = 75, cy = 75, R = 55;
    const root = svg('svg', { viewBox: '0 0 150 150', width: '150', height: '150', role: 'img', 'aria-label': `Bloch vector (${fmt(v.x)}, ${fmt(v.y)}, ${fmt(v.z)})` });
    root.appendChild(svg('circle', { cx, cy, r: R, fill: 'none', stroke: '#1f2a3f', 'stroke-width': 1 }));
    root.appendChild(svg('ellipse', { cx, cy, rx: R, ry: R * 0.32, fill: 'none', stroke: '#16203a', 'stroke-width': 1 }));
    root.appendChild(svg('line', { x1: cx, y1: cy - R, x2: cx, y2: cy + R, stroke: '#16203a', 'stroke-width': 1 }));
    root.appendChild(svg('line', { x1: cx - R, y1: cy, x2: cx + R, y2: cy, stroke: '#16203a', 'stroke-width': 1 }));
    const tx = (cx + v.x * R).toFixed(1), ty = (cy - v.z * R).toFixed(1);
    root.appendChild(svg('line', { x1: cx, y1: cy, x2: tx, y2: ty, stroke: '#4ade80', 'stroke-width': 2 }));
    root.appendChild(svg('circle', { cx: tx, cy: ty, r: 4, fill: '#4ade80' }));
    const z0 = svg('text', { x: cx + 4, y: cy - R + 11, fill: '#5e6f88', 'font-size': 9 }); z0.textContent = '|0⟩'; root.appendChild(z0);
    const z1 = svg('text', { x: cx + 4, y: cy + R - 2, fill: '#5e6f88', 'font-size': 9 }); z1.textContent = '|1⟩'; root.appendChild(z1);
    return root;
}

/** Probability bars for the computational basis. @param {number[]} probs @param {number} n @returns {DocumentFragment} */
function probBars(probs, n) {
    const frag = document.createDocumentFragment();
    probs.forEach((p, i) => {
        if (p < 1e-6) return;
        const row = document.createElement('div'); row.className = 'q-prob-row';
        const lab = document.createElement('span'); lab.className = 'q-prob-label'; lab.textContent = '|' + i.toString(2).padStart(n, '0') + '⟩';
        const track = document.createElement('span'); track.className = 'q-prob-track';
        const fill = document.createElement('span'); fill.className = 'q-prob-fill'; fill.style.width = (p * 100).toFixed(1) + '%';
        track.appendChild(fill);
        const pct = document.createElement('span'); pct.className = 'q-prob-pct'; pct.textContent = (p * 100).toFixed(1) + '%';
        row.append(lab, track, pct); frag.appendChild(row);
    });
    return frag;
}

/* ------------------------------------------------------------------ *
 *  Quantum Lab — fluent circuit → ket / probabilities / Bloch
 * ------------------------------------------------------------------ */

/** @param {typeof import('./math/index.js')} math */
function initQuantumLab(math) {
    const diagramEl = document.getElementById('q-diagram');
    const ketEl = document.getElementById('q-ket');
    const probsEl = document.getElementById('q-probs');
    const blochEl = document.getElementById('q-bloch');
    const nqEl = inputEl('q-nqubits');
    if (!diagramEl || !ketEl || !probsEl || !blochEl || !nqEl) return;
    const Circuit = math.Circuit;
    let qc = new Circuit.QuantumCircuit(2);

    const target = () => {
        const t = parseInt(inputEl('q-target')?.value ?? '0', 10) || 0;
        return Math.max(0, Math.min(qc.qubits - 1, t));
    };
    const nqubits = () => Math.max(1, Math.min(4, parseInt(nqEl.value, 10) || 2));

    const render = () => {
        diagramEl.textContent = qc.diagram();
        ketEl.textContent = 'ψ = ' + qc.toKet();
        probsEl.replaceChildren(probBars(qc.probabilities(), qc.qubits));
        if (qc.qubits === 1) {
            blochEl.replaceChildren(blochSvg(math.Quantum.blochVector(qc.run())));
        } else {
            const h = document.createElement('span'); h.className = 'ml-hint';
            h.textContent = 'Bloch sphere renders for a single qubit — set qubits = 1, then Reset.';
            blochEl.replaceChildren(h);
        }
    };

    document.querySelectorAll('.quantum [data-q]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const op = /** @type {HTMLElement} */ (btn).dataset.q;
            const n = nqubits();
            switch (op) {
                case 'h': qc.h(target()); break;
                case 'x': qc.x(target()); break;
                case 'y': qc.y(target()); break;
                case 'z': qc.z(target()); break;
                case 's': qc.s(target()); break;
                case 't': qc.t(target()); break;
                case 'cnot': { const t = target(); if (t < qc.qubits - 1) qc.cnot(t, t + 1); break; }
                case 'bell': qc = Circuit.bell(); nqEl.value = '2'; break;
                case 'ghz': qc = Circuit.ghz(Math.max(2, n)); nqEl.value = String(Math.max(2, n)); break;
                case 'reset': qc = new Circuit.QuantumCircuit(n); break;
                default: break;
            }
            render();
        });
    });
    nqEl.addEventListener('change', () => { nqEl.value = String(nqubits()); qc = new Circuit.QuantumCircuit(nqubits()); render(); });
    render();
}

/* ------------------------------------------------------------------ *
 *  Signal · FFT Lab
 * ------------------------------------------------------------------ */

/** @param {typeof import('./math/index.js')} math */
function initSignalLab(math) {
    const input = inputEl('sig-input');
    const out = document.getElementById('sig-output');
    if (!input || !out) return;
    const twoTone = Array.from({ length: 32 }, (_unused, i) =>
        (Math.sin((2 * Math.PI * 3 * i) / 32) + 0.5 * Math.sin((2 * Math.PI * 7 * i) / 32)).toFixed(4)).join(', ');
    document.querySelectorAll('.signal [data-sig]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const op = /** @type {HTMLElement} */ (btn).dataset.sig;
            if (op === 'twotone') { input.value = twoTone; return; }
            if (op === 'impulse') { input.value = '1, 0, 0, 0, 0, 0, 0, 0'; return; }
            try {
                const samples = parseNums(input.value);
                if (samples.length < 2) throw new Error('enter at least 2 samples');
                const mag = math.Signal.magnitude(math.Signal.fft(samples));
                out.replaceChildren(barChartSvg(mag, 'magnitude |X(k)|'));
            } catch (e) { out.replaceChildren(errSpan(e)); }
        });
    });
}

/* ------------------------------------------------------------------ *
 *  Quant Finance Lab — Black–Scholes + Greeks
 * ------------------------------------------------------------------ */

/** @param {typeof import('./math/index.js')} math */
function initFinanceLab(math) {
    const out = document.getElementById('fin-output');
    const btn = document.querySelector('.finance [data-fin="price"]');
    if (!out || !btn) return;
    btn.addEventListener('click', () => {
        try {
            const S = numVal('fin-S'), K = numVal('fin-K'), r = numVal('fin-r'), sig = numVal('fin-sig'), T = numVal('fin-T');
            if ([S, K, r, sig, T].some((v) => !Number.isFinite(v))) throw new Error('all fields must be numbers');
            const bs = math.Finance.blackScholes(S, K, r, sig, T);
            const g = math.Finance.greeks(S, K, r, sig, T, 'call');
            const wrap = document.createElement('div');
            const head = document.createElement('div'); head.className = 'ml-scalar';
            head.textContent = `call ${fmt(bs.call)}   put ${fmt(bs.put)}`;
            const sub = document.createElement('div'); sub.className = 'ml-list';
            sub.appendChild(line(`d₁ = ${fmt(bs.d1)}    d₂ = ${fmt(bs.d2)}`));
            sub.appendChild(line(`Δ ${fmt(g.delta)}    Γ ${fmt(g.gamma)}    vega ${fmt(g.vega)}`));
            sub.appendChild(line(`Θ ${fmt(g.theta)}    ρ ${fmt(g.rho)}`));
            wrap.append(head, sub);
            out.replaceChildren(wrap);
        } catch (e) { out.replaceChildren(errSpan(e)); }
    });
}

/* ------------------------------------------------------------------ *
 *  Plot Studio — f(x) over [a, b] + distribution presets
 * ------------------------------------------------------------------ */

/** @param {typeof import('./math/index.js')} math */
function initPlotStudio(math) {
    const exprEl = inputEl('plot-expr');
    const out = document.getElementById('plot-output');
    if (!exprEl || !out) return;
    /** @param {string} expr @returns {(x:number)=>number} */
    const fromExpr = (expr) => (x) => {
        const r = math.compute(expr, { x });
        if (r.isMatrix) throw new Error('expression must be scalar');
        return /** @type {{re:number}} */ (r.value).re;
    };
    document.querySelectorAll('.plot-studio [data-plot]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const op = /** @type {HTMLElement} */ (btn).dataset.plot;
            try {
                /** @type {(x:number)=>number} */ let f;
                let a = numVal('plot-a'), b = numVal('plot-b'), label;
                if (op === 'normal') {
                    f = (x) => math.Stats.normalPdf(x, 0, 1); a = -4; b = 4; setNum('plot-a', a); setNum('plot-b', b); label = 'Normal(0,1) pdf';
                } else if (op === 'chi2') {
                    f = (x) => math.Stats.chiSquarePdf(x, 3); a = 0.05; b = 14; setNum('plot-a', a); setNum('plot-b', b); label = 'χ²(3) pdf';
                } else if (op === 'sinc') {
                    exprEl.value = 'sin(x)/x'; f = fromExpr('sin(x)/x'); label = 'sinc';
                } else {
                    f = fromExpr(exprEl.value); label = `f(x) = ${exprEl.value}`;
                }
                if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b) throw new Error('need a < b');
                out.replaceChildren(linePlotSvg(math.Plot.sampleFunction(f, a, b, 240), label));
            } catch (e) { out.replaceChildren(errSpan(e)); }
        });
    });
}

/* ------------------------------------------------------------------ *
 *  ODE Lab — RK4 on y′ = f(t, y)
 * ------------------------------------------------------------------ */

/** @param {typeof import('./math/index.js')} math */
function initOdeLab(math) {
    const exprEl = inputEl('ode-expr');
    const out = document.getElementById('ode-output');
    if (!exprEl || !out) return;
    document.querySelectorAll('.ode [data-ode]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const op = /** @type {HTMLElement} */ (btn).dataset.ode;
            if (op === 'decay') { exprEl.value = '-0.6*y'; setNum('ode-y0', 5); setNum('ode-t1', 8); }
            else if (op === 'logistic') { exprEl.value = '0.8*y*(1 - y/10)'; setNum('ode-y0', 0.5); setNum('ode-t1', 14); }
            try {
                const expr = exprEl.value, y0 = numVal('ode-y0'), t1 = numVal('ode-t1');
                if (!Number.isFinite(y0) || !Number.isFinite(t1) || t1 <= 0) throw new Error('need y(0) and t₁ > 0');
                /** @type {(t:number, y:number[])=>number[]} */
                const f = (t, y) => {
                    const r = math.compute(expr, { t, y: y[0] });
                    if (r.isMatrix) throw new Error('RHS must be scalar');
                    return [/** @type {{re:number}} */ (r.value).re];
                };
                const sol = math.Calculus.rk4(f, 0, t1, [y0], 160);
                const pts = sol.t.map((t, i) => ({ x: t, y: sol.y[i][0], defined: Number.isFinite(sol.y[i][0]) }));
                out.replaceChildren(linePlotSvg(pts, `y(t),  y(0)=${fmt(y0)}`));
            } catch (e) { out.replaceChildren(errSpan(e)); }
        });
    });
}

/**
 * Wire all live engine panels (quantum / signal / finance / plot / ODE).
 * @param {typeof import('./math/index.js')} math
 */
export function initLabs(math) {
    initQuantumLab(math);
    initSignalLab(math);
    initFinanceLab(math);
    initPlotStudio(math);
    initOdeLab(math);
}
