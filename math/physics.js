// @ts-check
/**
 * Physics & cosmology formula engine.
 *
 * Closed-form relations across quantum/atomic physics, special relativity,
 * and cosmology, built on the CODATA constants in {@link module:math/constants}.
 * Every function is a pure scalar relation; SI units throughout (noted per
 * function). These are the "what's the number" tools a physicist reaches for.
 *
 * @module math/physics
 */

import { PHYSICAL, MATH } from './constants.js';

const c = PHYSICAL.c.value;          // speed of light, m/s
const h = PHYSICAL.h.value;          // Planck, J·s
const hbar = PHYSICAL.hbar.value;    // reduced Planck, J·s
const G = PHYSICAL.G.value;          // gravitation, m³/(kg·s²)
const kB = PHYSICAL.kB.value;        // Boltzmann, J/K
const me = PHYSICAL.me.value;        // electron mass, kg
const eCharge = PHYSICAL.e.value;    // elementary charge, C
const sigma = PHYSICAL.sigma.value;  // Stefan–Boltzmann, W/(m²K⁴)

/* ------------------------------------------------------------------ *
 *  Quantum & atomic
 * ------------------------------------------------------------------ */

/**
 * Photon energy E = hf (joules) from frequency `f` (Hz).
 * @param {number} f
 * @returns {number}
 */
export function photonEnergy(f) {
    return h * f;
}

/**
 * Photon energy from wavelength λ (m): E = hc/λ.
 * @param {number} lambda
 * @returns {number}
 */
export function photonEnergyFromWavelength(lambda) {
    return (h * c) / lambda;
}

/**
 * de Broglie wavelength λ = h/p (m) for momentum `p` (kg·m/s).
 * @param {number} p
 * @returns {number}
 */
export function deBroglieWavelength(p) {
    return h / p;
}

/**
 * Convert energy in joules to electron-volts.
 * @param {number} joules
 * @returns {number}
 */
export function toEV(joules) {
    return joules / eCharge;
}

/**
 * Hydrogen (Bohr) energy level Eₙ = −13.6 eV / n², returned in joules.
 * @param {number} n  principal quantum number (≥1)
 * @returns {number}
 */
export function hydrogenEnergyLevel(n) {
    if (!Number.isInteger(n) || n < 1) throw new RangeError('n must be a positive integer');
    const E0_eV = 13.605693122; // Rydberg energy in eV
    return (-E0_eV / (n * n)) * eCharge; // joules
}

/**
 * Rydberg formula: photon wavenumber 1/λ (1/m) for a transition n₁→n₂.
 * @param {number} n1  lower level
 * @param {number} n2  upper level (> n1)
 * @returns {number}
 */
export function rydbergWavelength(n1, n2) {
    const Rinf = PHYSICAL.Rinf.value; // 1/m
    const inv = Rinf * (1 / (n1 * n1) - 1 / (n2 * n2));
    return 1 / inv; // wavelength in m
}

/**
 * Particle in a 1-D infinite well: energy Eₙ = n²h²/(8mL²) (joules).
 * @param {number} n  quantum number (≥1)
 * @param {number} mass  particle mass (kg)
 * @param {number} L  box width (m)
 * @returns {number}
 */
export function particleInBox(n, mass, L) {
    return (n * n * h * h) / (8 * mass * L * L);
}

/**
 * Quantum harmonic oscillator energy Eₙ = ℏω(n + ½) (joules).
 * @param {number} n  level (≥0)
 * @param {number} omega  angular frequency (rad/s)
 * @returns {number}
 */
export function harmonicOscillator(n, omega) {
    return hbar * omega * (n + 0.5);
}

/**
 * Heisenberg minimum momentum uncertainty Δp ≥ ℏ/(2Δx) given Δx (m).
 * @param {number} dx
 * @returns {number}
 */
export function heisenbergMomentum(dx) {
    return hbar / (2 * dx);
}

/**
 * Compton wavelength shift Δλ = (h/mₑc)(1 − cos θ) (m).
 * @param {number} thetaRad  scattering angle (radians)
 * @returns {number}
 */
export function comptonShift(thetaRad) {
    return (h / (me * c)) * (1 - Math.cos(thetaRad));
}

/* ------------------------------------------------------------------ *
 *  Special relativity
 * ------------------------------------------------------------------ */

/**
 * Lorentz factor γ = 1/√(1 − v²/c²) for speed `v` (m/s).
 * @param {number} v
 * @returns {number}
 */
export function lorentzFactor(v) {
    const beta = v / c;
    if (Math.abs(beta) >= 1) throw new RangeError('speed must be below c');
    return 1 / Math.sqrt(1 - beta * beta);
}

/**
 * Relativistic time dilation: proper time Δt₀ dilates to γΔt₀.
 * @param {number} properTime  Δt₀ (s)
 * @param {number} v  relative speed (m/s)
 * @returns {number}
 */
export function timeDilation(properTime, v) {
    return lorentzFactor(v) * properTime;
}

/**
 * Length contraction: proper length L₀ contracts to L₀/γ.
 * @param {number} properLength  L₀ (m)
 * @param {number} v
 * @returns {number}
 */
export function lengthContraction(properLength, v) {
    return properLength / lorentzFactor(v);
}

/**
 * Rest energy E = mc² (joules) for mass `m` (kg).
 * @param {number} m
 * @returns {number}
 */
export function restEnergy(m) {
    return m * c * c;
}

/**
 * Total relativistic energy E = γmc² (joules).
 * @param {number} m  rest mass (kg)
 * @param {number} v  speed (m/s)
 * @returns {number}
 */
export function relativisticEnergy(m, v) {
    return lorentzFactor(v) * m * c * c;
}

/**
 * Relativistic velocity addition (1-D): (u+v)/(1+uv/c²).
 * @param {number} u
 * @param {number} v
 * @returns {number}
 */
export function velocityAddition(u, v) {
    return (u + v) / (1 + (u * v) / (c * c));
}

/* ------------------------------------------------------------------ *
 *  Gravitation & cosmology
 * ------------------------------------------------------------------ */

/**
 * Newtonian gravitational force F = G m₁ m₂ / r² (N).
 * @param {number} m1
 * @param {number} m2
 * @param {number} r
 * @returns {number}
 */
export function gravitationalForce(m1, m2, r) {
    return (G * m1 * m2) / (r * r);
}

/**
 * Escape velocity √(2GM/r) (m/s).
 * @param {number} M  body mass (kg)
 * @param {number} r  radius (m)
 * @returns {number}
 */
export function escapeVelocity(M, r) {
    return Math.sqrt((2 * G * M) / r);
}

/**
 * Schwarzschild radius r_s = 2GM/c² (m) — the event-horizon radius.
 * @param {number} M  mass (kg)
 * @returns {number}
 */
export function schwarzschildRadius(M) {
    return (2 * G * M) / (c * c);
}

/**
 * Hubble recession velocity v = H₀ d. `H0` in (km/s)/Mpc, `dMpc` in Mpc;
 * returns km/s.
 * @param {number} H0
 * @param {number} dMpc
 * @returns {number}
 */
export function hubbleVelocity(H0, dMpc) {
    return H0 * dMpc;
}

/**
 * Non-relativistic Doppler redshift z = v/c (dimensionless) for recession
 * speed `v` (m/s).
 * @param {number} v
 * @returns {number}
 */
export function redshift(v) {
    return v / c;
}

/**
 * Relativistic Doppler redshift z = √((1+β)/(1−β)) − 1, β = v/c.
 * @param {number} v
 * @returns {number}
 */
export function relativisticRedshift(v) {
    const beta = v / c;
    return Math.sqrt((1 + beta) / (1 - beta)) - 1;
}

/**
 * Wien's displacement law: peak wavelength λ_max = b/T (m).
 * @param {number} T  temperature (K)
 * @returns {number}
 */
export function wienPeakWavelength(T) {
    const b = 2.897771955e-3; // Wien constant, m·K
    return b / T;
}

/**
 * Stefan–Boltzmann radiated power per unit area j = σT⁴ (W/m²).
 * @param {number} T
 * @returns {number}
 */
export function stefanBoltzmann(T) {
    return sigma * Math.pow(T, 4);
}

/**
 * Blackbody spectral radiance (Planck's law) B(λ,T) in W·sr⁻¹·m⁻³.
 * @param {number} lambda  wavelength (m)
 * @param {number} T  temperature (K)
 * @returns {number}
 */
export function planckRadiance(lambda, T) {
    const a = (2 * h * c * c) / Math.pow(lambda, 5);
    const exponent = (h * c) / (lambda * kB * T);
    return a / (Math.exp(exponent) - 1);
}

/**
 * Orbital period (Kepler's third law) T = 2π√(a³/GM) (s).
 * @param {number} a  semi-major axis (m)
 * @param {number} M  central mass (kg)
 * @returns {number}
 */
export function orbitalPeriod(a, M) {
    return 2 * MATH.pi * Math.sqrt((a * a * a) / (G * M));
}
