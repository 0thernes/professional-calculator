/**
 * @jest-environment node
 */
import {
    photonEnergy, photonEnergyFromWavelength, deBroglieWavelength, toEV,
    hydrogenEnergyLevel, rydbergWavelength, particleInBox, harmonicOscillator,
    heisenbergMomentum, comptonShift,
    lorentzFactor, timeDilation, lengthContraction, restEnergy,
    relativisticEnergy, velocityAddition,
    gravitationalForce, escapeVelocity, schwarzschildRadius,
    hubbleVelocity, redshift, relativisticRedshift,
    wienPeakWavelength, stefanBoltzmann, planckRadiance, orbitalPeriod,
} from '../../math/physics.js';

const C = 299792458;
/** @param {number} a @param {number} b @param {number} [rel] */
const close = (a, b, rel = 1e-6) => expect(Math.abs(a - b)).toBeLessThanOrEqual(Math.abs(b) * rel + 1e-30);

describe('physics — quantum & atomic', () => {
    test('photon E=hf for 1 Hz = h', () => close(photonEnergy(1), 6.62607015e-34));
    test('500nm photon ≈ 2.48 eV', () => close(toEV(photonEnergyFromWavelength(500e-9)), 2.4797, 1e-3));
    test('de Broglie λ = h/p', () => close(deBroglieWavelength(6.62607015e-34), 1));
    test('hydrogen ground state ≈ -13.6 eV', () => close(toEV(hydrogenEnergyLevel(1)), -13.6057, 1e-4));
    test('hydrogen n=2 is 1/4 of ground', () => close(hydrogenEnergyLevel(2), hydrogenEnergyLevel(1) / 4));
    test('hydrogen n<1 throws', () => expect(() => hydrogenEnergyLevel(0)).toThrow(RangeError));
    test('Balmer-α (3→2) ≈ 656 nm', () => close(rydbergWavelength(2, 3) * 1e9, 656.3, 1e-3));
    test('Lyman-α (1→2) ≈ 121.5 nm', () => close(rydbergWavelength(1, 2) * 1e9, 121.5, 1e-2));
    test('particle in box scales as n²', () =>
        close(particleInBox(2, 9.109e-31, 1e-9), 4 * particleInBox(1, 9.109e-31, 1e-9)));
    test('harmonic oscillator ground = ½ℏω', () => close(harmonicOscillator(0, 1e15), 0.5 * 1.054571817e-34 * 1e15));
    test('harmonic spacing = ℏω', () =>
        close(harmonicOscillator(1, 1e15) - harmonicOscillator(0, 1e15), 1.054571817e-34 * 1e15));
    test('Heisenberg Δp = ℏ/2Δx', () => close(heisenbergMomentum(1e-10), 1.054571817e-34 / 2e-10));
    test('Compton shift max at θ=π', () => close(comptonShift(Math.PI), 2 * 2.426310238e-12, 1e-4));
    test('Compton shift zero at θ=0', () => close(comptonShift(0), 0));
});

describe('physics — special relativity', () => {
    test('γ → 1 at low speed', () => close(lorentzFactor(0), 1));
    test('γ at 0.6c = 1.25', () => close(lorentzFactor(0.6 * C), 1.25, 1e-9));
    test('γ at 0.8c = 5/3', () => close(lorentzFactor(0.8 * C), 5 / 3, 1e-9));
    test('v≥c throws', () => expect(() => lorentzFactor(C)).toThrow(RangeError));
    test('time dilation at 0.6c', () => close(timeDilation(10, 0.6 * C), 12.5, 1e-9));
    test('length contraction at 0.8c', () => close(lengthContraction(10, 0.8 * C), 6, 1e-9));
    test('rest energy of 1kg = c²', () => close(restEnergy(1), C * C));
    test('total energy ≥ rest energy', () =>
        expect(relativisticEnergy(1, 0.5 * C)).toBeGreaterThan(restEnergy(1)));
    test('velocity addition caps at c: 0.8c⊕0.8c < c', () => {
        const w = velocityAddition(0.8 * C, 0.8 * C);
        expect(w).toBeLessThan(C);
        close(w, 0.9756 * C, 1e-3);
    });
    test('velocity addition with c gives c', () => close(velocityAddition(C, 0.5 * C), C));
});

describe('physics — gravitation & cosmology', () => {
    test('gravitational force symmetric & inverse-square', () => {
        const f1 = gravitationalForce(5, 5, 1);
        const f2 = gravitationalForce(5, 5, 2);
        close(f1 / f2, 4); // quarter at double distance
    });
    test('Earth escape velocity ≈ 11.2 km/s', () =>
        close(escapeVelocity(5.972e24, 6.371e6), 11186, 1e-2));
    test('Schwarzschild radius of Sun ≈ 2.95 km', () =>
        close(schwarzschildRadius(1.989e30), 2953, 1e-2));
    test('Schwarzschild radius linear in mass', () =>
        close(schwarzschildRadius(2e30), 2 * schwarzschildRadius(1e30)));
    test('Hubble velocity v=H0·d', () => close(hubbleVelocity(70, 100), 7000));
    test('redshift z=v/c', () => close(redshift(0.1 * C), 0.1));
    test('relativistic redshift > classical at high v', () =>
        expect(relativisticRedshift(0.5 * C)).toBeGreaterThan(redshift(0.5 * C)));
    test('Wien: Sun (5778K) peaks ≈ 501 nm', () =>
        close(wienPeakWavelength(5778) * 1e9, 501.5, 1e-2));
    test('Stefan–Boltzmann ∝ T⁴', () =>
        close(stefanBoltzmann(2 * 300) / stefanBoltzmann(300), 16));
    test('Planck radiance positive & finite', () => {
        const b = planckRadiance(500e-9, 5778);
        expect(b).toBeGreaterThan(0);
        expect(Number.isFinite(b)).toBe(true);
    });
    test('Kepler: Earth orbital period ≈ 1 year', () =>
        close(orbitalPeriod(1.496e11, 1.989e30) / 86400, 365.3, 1e-2));
});
