/**
 * Graphing & Simulation Lab — headless anchors for the pure math behind the
 * canvas tools (the canvas drawing itself needs a browser, but the integrators,
 * the orbital sampler, and the formatting are verifiable against closed-form
 * values). jsdom is fine here: none of these touch the DOM.
 */
import { rk4Step, sampleOrbital, ORBITALS } from '../simlab.js';
import { fmtN } from '../grapher.js';

const mean = (/** @type {number[]} */ a) => a.reduce((s, v) => s + v, 0) / a.length;

describe('simlab — RK4 integrator', () => {
    test('exponential decay y′ = −y matches e⁻¹ at t = 1', () => {
        let y = [1];
        const h = 0.01;
        for (let i = 0; i < 100; i++) y = rk4Step((s) => [-s[0]], y, h);
        expect(y[0]).toBeCloseTo(Math.exp(-1), 4);
    });

    test('harmonic oscillator conserves energy over 2000 steps', () => {
        // x'' = −x  →  state [x, v], E = ½(x² + v²)
        let s = [1, 0];
        const E0 = 0.5 * (s[0] * s[0] + s[1] * s[1]);
        const h = 0.01;
        for (let i = 0; i < 2000; i++) s = rk4Step((st) => [st[1], -st[0]], s, h);
        const E = 0.5 * (s[0] * s[0] + s[1] * s[1]);
        expect(Math.abs(E - E0)).toBeLessThan(1e-3);
    });
});

describe('simlab — hydrogen orbital sampler', () => {
    /** @param {{x:number,y:number,z:number}} p */
    const radius = (p) => Math.hypot(p.x, p.y, p.z);

    test('1s cloud: points inside the box and ⟨r⟩ ≈ 1.5 a₀', () => {
        const { pts, R } = sampleOrbital('1s', 3000);
        expect(pts.length).toBeGreaterThan(2800);
        expect(pts.every((p) => radius(p) <= R + 1e-9)).toBe(true);
        expect(mean(pts.map(radius))).toBeCloseTo(1.5, 0); // ⟨r⟩₁ₛ = 3a₀/2
    });

    test('2p_z cloud: ⟨r⟩ ≈ 5 a₀ and a node in the z=0 plane (dumbbell)', () => {
        const { pts } = sampleOrbital('2p_z', 3000);
        expect(mean(pts.map(radius))).toBeCloseTo(5, 0); // ⟨r⟩₂ₚ = 5a₀
        // density ∝ cos²θ → far more points near the poles than the equator
        const polar = pts.filter((p) => Math.abs(p.z) / radius(p) > 0.5).length;
        const equator = pts.filter((p) => Math.abs(p.z) / radius(p) < 0.2).length;
        expect(polar).toBeGreaterThan(equator * 3);
    });

    test('every curated orbital samples a non-empty signed cloud', () => {
        for (const key of /** @type {(keyof typeof ORBITALS)[]} */ (Object.keys(ORBITALS))) {
            const { pts } = sampleOrbital(key, 400);
            expect(pts.length).toBeGreaterThan(300);
            expect(pts.every((p) => p.s === 1 || p.s === -1)).toBe(true);
        }
    });
});

describe('grapher — number formatting', () => {
    test('compact and edge cases', () => {
        expect(fmtN(0)).toBe('0');
        expect(fmtN(2)).toBe('2');
        expect(fmtN(Infinity)).toBe('∞');
        expect(fmtN(-Infinity)).toBe('−∞');
        expect(fmtN(1234.5678)).toBe('1234.6');
        expect(fmtN(1e-6)).toBe('1.00e-6');
    });
});
