// @ts-check
/**
 * Simulation Lab — an interactive physics engine (chaotic double pendulum,
 * N-body gravity, projectile with drag) and a quantum 3D/4D visualizer
 * (hydrogen orbital probability clouds, a rotating 4D tesseract, and a free
 * Gaussian wave-packet). Canvas + requestAnimationFrame, zero-dep; integrators
 * are RK4 / velocity-Verlet with proper teardown (cancelAnimationFrame).
 *
 * @module simlab
 */

import { mkCanvas, palette, fmtN } from './grapher.js';

/* ============================================================= *
 *  Physics engine
 * ============================================================= */

/** RK4 step for an autonomous system y' = f(y). @param {(s:number[])=>number[]} f @param {number[]} y @param {number} h */
export function rk4Step(f, y, h) {
    const add = (/** @type {number[]} */ a, /** @type {number[]} */ b, /** @type {number} */ s) => a.map((v, i) => v + b[i] * s);
    const k1 = f(y);
    const k2 = f(add(y, k1, h / 2));
    const k3 = f(add(y, k2, h / 2));
    const k4 = f(add(y, k3, h));
    return y.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

/** Double pendulum (m1=m2=1, l1=l2=1). @param {number} g */
function doublePendulum(g) {
    let s = [Math.PI / 2 + 0.4, 0, Math.PI / 2 + 0.6, 0]; // θ1, ω1, θ2, ω2
    /** @type {{x:number,y:number}[]} */
    let trail = [];
    const deriv = (/** @type {number[]} */ st) => {
        const [t1, w1, t2, w2] = st;
        const d = t1 - t2, den = 2 - Math.cos(2 * d);
        const a1 = (-3 * g * Math.sin(t1) - g * Math.sin(t1 - 2 * t2) - 2 * Math.sin(d) * (w2 * w2 + w1 * w1 * Math.cos(d))) / den;
        const a2 = (2 * Math.sin(d) * (2 * w1 * w1 + 2 * g * Math.cos(t1) + w2 * w2 * Math.cos(d))) / den;
        return [w1, a1, w2, a2];
    };
    return {
        label: 'Double Pendulum — deterministic chaos',
        reset() { s = [Math.PI / 2 + 0.4, 0, Math.PI / 2 + 0.6, 0]; trail = []; },
        step(/** @type {number} */ dt) { for (let i = 0; i < 6; i++) s = rk4Step(deriv, s, dt / 6); },
        draw(/** @type {CanvasRenderingContext2D} */ ctx, /** @type {number} */ W, /** @type {number} */ H) {
            const p = palette(); const cx = W / 2, cy = H * 0.42, L = Math.min(W, H) * 0.2;
            const x1 = cx + L * Math.sin(s[0]), y1 = cy + L * Math.cos(s[0]);
            const x2 = x1 + L * Math.sin(s[2]), y2 = y1 + L * Math.cos(s[2]);
            trail.push({ x: x2, y: y2 }); if (trail.length > 320) trail.shift();
            ctx.lineWidth = 1.5;
            for (let i = 1; i < trail.length; i++) { ctx.globalAlpha = i / trail.length * 0.8; ctx.strokeStyle = p.amber; ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke(); }
            ctx.globalAlpha = 1;
            ctx.strokeStyle = p.dim; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            /** @type {[number,number,string][]} */
            const bobs = [[cx, cy, p.faint], [x1, y1, p.cyan], [x2, y2, p.violet]];
            for (const [x, y, c] of bobs) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); }
            return `θ₁=${fmtN(s[0])}  θ₂=${fmtN(s[2])}  ω₁=${fmtN(s[1])}`;
        },
    };
}

/** N-body gravity: a star + planets, velocity-Verlet with softening. @param {number} g */
function nBody(g) {
    const G = g;
    /** @type {{m:number,x:number,y:number,vx:number,vy:number,c:string,trail:{x:number,y:number}[]}[]} */
    let bodies = [];
    const init = () => {
        const p = palette();
        bodies = [{ m: 1200, x: 0, y: 0, vx: 0, vy: 0, c: p.amber, trail: [] }];
        const cols = [p.cyan, p.violet, p.green, p.red];
        for (let i = 0; i < 4; i++) {
            const r = 70 + i * 45, v = Math.sqrt(G * 1200 / r);
            bodies.push({ m: 4, x: r, y: 0, vx: 0, vy: v, c: cols[i % cols.length], trail: [] });
        }
    };
    init();
    const acc = () => {
        const a = bodies.map(() => ({ x: 0, y: 0 }));
        for (let i = 0; i < bodies.length; i++) for (let j = 0; j < bodies.length; j++) {
            if (i === j) continue;
            const dx = bodies[j].x - bodies[i].x, dy = bodies[j].y - bodies[i].y;
            const r2 = dx * dx + dy * dy + 25, inv = G * bodies[j].m / (r2 * Math.sqrt(r2));
            a[i].x += dx * inv; a[i].y += dy * inv;
        }
        return a;
    };
    return {
        label: 'N-Body Gravity — Newtonian orbits',
        reset() { init(); },
        step(/** @type {number} */ dt) {
            const sub = 4, h = dt / sub;
            for (let s = 0; s < sub; s++) {
                const a0 = acc();
                bodies.forEach((b, i) => { b.x += b.vx * h + 0.5 * a0[i].x * h * h; b.y += b.vy * h + 0.5 * a0[i].y * h * h; });
                const a1 = acc();
                bodies.forEach((b, i) => { b.vx += 0.5 * (a0[i].x + a1[i].x) * h; b.vy += 0.5 * (a0[i].y + a1[i].y) * h; });
            }
        },
        draw(/** @type {CanvasRenderingContext2D} */ ctx, /** @type {number} */ W, /** @type {number} */ H) {
            const cx = W / 2, cy = H / 2;
            for (const b of bodies) {
                b.trail.push({ x: cx + b.x, y: cy + b.y }); if (b.trail.length > 160) b.trail.shift();
                ctx.strokeStyle = b.c; ctx.lineWidth = 1;
                for (let i = 1; i < b.trail.length; i++) { ctx.globalAlpha = i / b.trail.length * 0.6; ctx.beginPath(); ctx.moveTo(b.trail[i - 1].x, b.trail[i - 1].y); ctx.lineTo(b.trail[i].x, b.trail[i].y); ctx.stroke(); }
                ctx.globalAlpha = 1; ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(cx + b.x, cy + b.y, b.m > 100 ? 8 : 4, 0, Math.PI * 2); ctx.fill();
            }
            return `${bodies.length} bodies · G=${fmtN(G)} · velocity-Verlet`;
        },
    };
}

/** Projectile with quadratic drag. @param {number} g */
function projectile(g) {
    const k = 0.02;
    let s = [0, 0, 28, 34]; // x, y, vx, vy
    /** @type {{x:number,y:number}[]} */
    let path = [];
    let landed = false, apex = 0, range = 0;
    const deriv = (/** @type {number[]} */ st) => {
        const v = Math.hypot(st[2], st[3]);
        return [st[2], st[3], -k * v * st[2], -g - k * v * st[3]];
    };
    return {
        label: 'Projectile — gravity + quadratic drag',
        reset() { s = [0, 0, 28, 34]; path = []; landed = false; apex = 0; range = 0; },
        step(/** @type {number} */ dt) {
            if (landed) return;
            s = rk4Step(deriv, s, dt);
            apex = Math.max(apex, s[1]);
            if (s[1] <= 0 && path.length > 2) { landed = true; range = s[0]; }
            path.push({ x: s[0], y: s[1] });
        },
        draw(/** @type {CanvasRenderingContext2D} */ ctx, /** @type {number} */ W, /** @type {number} */ H) {
            const p = palette();
            const maxX = Math.max(120, range || s[0] + 20), maxY = Math.max(80, apex + 20);
            const sx = (/** @type {number} */ x) => 40 + x / maxX * (W - 60);
            const sy = (/** @type {number} */ y) => H - 24 - y / maxY * (H - 50);
            ctx.strokeStyle = p.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(30, sy(0)); ctx.lineTo(W - 10, sy(0)); ctx.stroke();
            ctx.strokeStyle = p.green; ctx.lineWidth = 2; ctx.beginPath();
            path.forEach((pt, i) => { const X = sx(pt.x), Y = sy(pt.y); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
            if (path.length) { const last = path[path.length - 1]; ctx.fillStyle = p.amber; ctx.beginPath(); ctx.arc(sx(last.x), sy(last.y), 4, 0, Math.PI * 2); ctx.fill(); }
            return landed ? `landed · range=${fmtN(range)} m · apex=${fmtN(apex)} m` : `x=${fmtN(s[0])} y=${fmtN(s[1])} (drag k=${k})`;
        },
    };
}

/** @param {any} _math */
export function initPhysicsEngine(_math) {
    const stage = document.getElementById('phys-stage');
    if (!stage) return;
    const sel = /** @type {HTMLSelectElement|null} */ (document.getElementById('phys-sim'));
    const gEl = /** @type {HTMLInputElement|null} */ (document.getElementById('phys-g'));
    const readout = document.getElementById('phys-read');
    const cv = mkCanvas(stage, 300, () => { });

    const gravity = () => { const v = gEl ? parseFloat(gEl.value) : 9.8; return Number.isFinite(v) ? v : 9.8; };
    const make = () => {
        const m = sel ? sel.value : 'pendulum';
        return m === 'nbody' ? nBody(gravity() * 0.6) : m === 'projectile' ? projectile(gravity()) : doublePendulum(gravity());
    };
    let sim = make(), running = false, raf = 0;

    const frame = () => {
        const { ctx, state: { W, H } } = cv; const p = palette();
        if (running) sim.step(0.05);
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = p.panel; ctx.fillRect(0, 0, W, H);
        const info = sim.draw(ctx, W, H);
        if (readout) readout.textContent = `${sim.label}  ·  ${info}`;
        if (running) raf = requestAnimationFrame(frame);
    };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    const start = () => { if (running) return; running = true; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); };

    document.querySelectorAll('.physlab [data-phys]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const op = /** @type {HTMLElement} */ (btn).dataset.phys;
            if (op === 'play') start();
            else if (op === 'pause') stop();
            else if (op === 'reset') { sim.reset(); frame(); }
        });
    });
    sel?.addEventListener('change', () => { stop(); sim = make(); frame(); });
    gEl?.addEventListener('change', () => { sim = make(); frame(); });

    frame(); // initial paint
}

/* ============================================================= *
 *  Quantum 3D / 4D visualizer
 * ============================================================= */

/** Relative |ψ|² density (atomic units, a0=1) for a curated set of hydrogen orbitals, plus the sign of the angular lobe for phase coloring. */
export const ORBITALS = {
    '1s': { R: 14, rho: (/** @type {number} */ r) => Math.exp(-2 * r), sign: () => 1 },
    '2s': { R: 22, rho: (/** @type {number} */ r) => Math.pow(2 - r, 2) * Math.exp(-r), sign: (/** @type {number} */ r) => (r < 2 ? 1 : -1) },
    '2p_z': { R: 22, rho: (/** @type {number} */ r, /** @type {number} */ ct) => r * r * Math.exp(-r) * ct * ct, sign: (/** @type {number} */ r, /** @type {number} */ ct) => Math.sign(ct) || 1 },
    '3d_z2': { R: 34, rho: (/** @type {number} */ r, /** @type {number} */ ct) => Math.pow(r, 4) * Math.exp(-2 * r / 3) * Math.pow(3 * ct * ct - 1, 2), sign: (/** @type {number} */ r, /** @type {number} */ ct) => Math.sign(3 * ct * ct - 1) || 1 },
    '3d_xy': { R: 34, rho: (/** @type {number} */ r, /** @type {number} */ ct, /** @type {number} */ ph) => Math.pow(r, 4) * Math.exp(-2 * r / 3) * (1 - ct * ct) * Math.pow(Math.sin(2 * ph), 2), sign: (/** @type {number} */ r, /** @type {number} */ ct, /** @type {number} */ ph) => Math.sign(Math.sin(2 * ph)) || 1 },
    '4f_z3': { R: 50, rho: (/** @type {number} */ r, /** @type {number} */ ct) => Math.pow(r, 6) * Math.exp(-r / 2) * Math.pow(5 * ct * ct * ct - 3 * ct, 2), sign: (/** @type {number} */ r, /** @type {number} */ ct) => Math.sign(5 * ct * ct * ct - 3 * ct) || 1 },
};

/** Rejection-sample a hydrogen orbital into a 3D point cloud (relative density). @param {keyof typeof ORBITALS} key @param {number} n */
export function sampleOrbital(key, n) {
    const o = ORBITALS[key]; const R = o.R;
    // estimate max density on a coarse scan
    let max = 0;
    for (let i = 0; i < 4000; i++) {
        const r = Math.random() * R, ct = Math.random() * 2 - 1, ph = Math.random() * Math.PI * 2;
        const d = o.rho(r, ct, ph) * r * r; // r² volume weight
        if (d > max) max = d;
    }
    max = max || 1;
    /** @type {{x:number,y:number,z:number,s:number}[]} */
    const pts = [];
    let guard = 0;
    while (pts.length < n && guard < n * 200) {
        guard++;
        const r = Math.random() * R, ct = Math.random() * 2 - 1, ph = Math.random() * Math.PI * 2;
        const d = o.rho(r, ct, ph) * r * r;
        if (Math.random() * max <= d) {
            const st = Math.sqrt(1 - ct * ct);
            pts.push({ x: r * st * Math.cos(ph), y: r * st * Math.sin(ph), z: r * ct, s: o.sign(r, ct, ph), });
        }
    }
    return { pts, R };
}

/** @param {any} math */
export function initQuantum3D(math) {
    const stage = document.getElementById('q3d-stage');
    if (!stage) return;
    const modeEl = /** @type {HTMLSelectElement|null} */ (document.getElementById('q3d-mode'));
    const orbEl = /** @type {HTMLSelectElement|null} */ (document.getElementById('q3d-orbital'));
    const readout = document.getElementById('q3d-read');
    const cv = mkCanvas(stage, 320, () => draw());

    let yaw = 0.6, pitch = 0.4, spin = true, raf = 0, t = 0;
    /** @type {{pts:{x:number,y:number,z:number,s:number}[],R:number}} */
    let cloud = sampleOrbital('2p_z', 2600);

    function rebuildCloud() {
        const key = /** @type {keyof typeof ORBITALS} */ (orbEl ? orbEl.value : '2p_z');
        cloud = sampleOrbital(key, 2600);
    }

    function drawOrbital() {
        const { ctx, state: { W, H } } = cv; const p = palette();
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = p.panel; ctx.fillRect(0, 0, W, H);
        const scale = Math.min(W, H) * 0.42 / cloud.R, cx = W / 2, cy = H / 2;
        const proj = cloud.pts.map((q) => {
            const r = math.Plot.rotate3D({ x: q.x, y: q.y, z: q.z }, pitch, yaw, 0);
            const pr = math.Plot.project3Dto2D({ x: r.x, y: r.y, z: r.z }, cloud.R * 2.4);
            return { X: cx + pr.x * scale, Y: cy - pr.y * scale, depth: r.z, s: q.s };
        }).sort((a, b) => a.depth - b.depth);
        for (const q of proj) {
            const t01 = (q.depth + cloud.R) / (2 * cloud.R);
            ctx.globalAlpha = 0.25 + 0.55 * t01;
            ctx.fillStyle = q.s >= 0 ? p.cyan : p.violet;
            ctx.beginPath(); ctx.arc(q.X, q.Y, 1.3 + 1.6 * t01, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (readout) readout.textContent = `H orbital ${orbEl ? orbEl.value : ''} · |ψ|² cloud (${cloud.pts.length} pts) · cyan/violet = phase ±`;
    }

    function drawTesseract() {
        const { ctx, state: { W, H } } = cv; const p = palette();
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = p.panel; ctx.fillRect(0, 0, W, H);
        const { points, edges } = math.Plot.renderTesseract({ angleXW: t * 0.7, angleZW: t * 0.5, angle3D: yaw });
        const scale = Math.min(W, H) * 0.18, cx = W / 2, cy = H / 2;
        ctx.strokeStyle = p.cyan; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.85;
        for (const [a, b] of edges) {
            ctx.beginPath(); ctx.moveTo(cx + points[a].x * scale, cy + points[a].y * scale); ctx.lineTo(cx + points[b].x * scale, cy + points[b].y * scale); ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.fillStyle = p.violet;
        for (const pt of points) { ctx.beginPath(); ctx.arc(cx + pt.x * scale, cy + pt.y * scale, 2.5, 0, Math.PI * 2); ctx.fill(); }
        if (readout) readout.textContent = 'Tesseract — 4-cube rotating in the xw / zw planes, projected 4D→3D→2D';
    }

    function drawWavepacket() {
        const { ctx, state: { W, H } } = cv; const p = palette();
        ctx.clearRect(0, 0, W, H); ctx.fillStyle = p.panel; ctx.fillRect(0, 0, W, H);
        // free Gaussian packet: |ψ(x,t)|² spreads, group velocity k0
        const k0 = 3, sig0 = 0.6, time = t * 0.25;
        const sig = Math.sqrt(sig0 * sig0 + (time / (2 * sig0)) * (time / (2 * sig0)));
        const x0 = -6 + ((k0 * time) % 12);
        ctx.strokeStyle = p.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, H - 24); ctx.lineTo(W, H - 24); ctx.stroke();
        ctx.strokeStyle = p.green; ctx.lineWidth = 2; ctx.beginPath();
        for (let px = 0; px <= W; px++) {
            const x = -8 + px / W * 16;
            const amp = Math.exp(-Math.pow(x - x0, 2) / (2 * sig * sig)) / sig;
            const Y = H - 24 - amp * (H - 50) * 0.5;
            px ? ctx.lineTo(px, Y) : ctx.moveTo(px, Y);
        }
        ctx.stroke();
        if (readout) readout.textContent = `Free Gaussian wave-packet · |ψ(x,t)|² dispersing · σ(t)=${fmtN(sig)}`;
    }

    function draw() {
        const mode = modeEl ? modeEl.value : 'orbital';
        if (mode === 'tesseract') drawTesseract();
        else if (mode === 'wavepacket') drawWavepacket();
        else drawOrbital();
    }

    const loop = () => { if (!spin) return; t += 0.03; if ((modeEl ? modeEl.value : 'orbital') === 'orbital') yaw += 0.012; draw(); raf = requestAnimationFrame(loop); };
    const startSpin = () => { cancelAnimationFrame(raf); if (spin) raf = requestAnimationFrame(loop); };

    /** @type {any} */
    let drag = null;
    cv.canvas.style.cursor = 'grab';
    cv.canvas.addEventListener('pointerdown', (e) => { drag = { px: e.offsetX, py: e.offsetY, yaw, pitch }; cv.canvas.setPointerCapture(e.pointerId); cv.canvas.style.cursor = 'grabbing'; });
    cv.canvas.addEventListener('pointermove', (e) => { if (!drag) return; yaw = drag.yaw + (e.offsetX - drag.px) * 0.01; pitch = Math.max(-1.5, Math.min(1.5, drag.pitch + (e.offsetY - drag.py) * 0.01)); draw(); });
    const end = () => { drag = null; cv.canvas.style.cursor = 'grab'; };
    cv.canvas.addEventListener('pointerup', end);
    cv.canvas.addEventListener('pointerleave', end);

    document.querySelectorAll('.quantum3d [data-q3d]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const op = /** @type {HTMLElement} */ (btn).dataset.q3d;
            if (op === 'spin') { spin = !spin; startSpin(); }
            else if (op === 'reset') { yaw = 0.6; pitch = 0.4; t = 0; draw(); }
        });
    });
    orbEl?.addEventListener('change', () => { rebuildCloud(); draw(); });
    modeEl?.addEventListener('change', () => { if (modeEl.value === 'orbital') rebuildCloud(); draw(); });

    draw(); startSpin();
}
