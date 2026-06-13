// @ts-check
/**
 * Mathematical and physical constants.
 *
 * Physical constants are CODATA 2018 recommended values (the basis of the
 * 2019 SI redefinition, in which c, h, e, k_B, N_A are exact). Each entry
 * carries its value, SI unit, and a short description so the UI/REPL can
 * surface provenance.
 *
 * @module math/constants
 */

/**
 * @typedef {object} PhysicalConstant
 * @property {number} value
 * @property {string} unit
 * @property {string} symbol
 * @property {string} name
 * @property {boolean} exact  True when the value is exact by SI definition.
 */

/** Mathematical constants (dimensionless). */
export const MATH = Object.freeze({
    pi: Math.PI,
    e: Math.E,
    tau: 2 * Math.PI,
    phi: (1 + Math.sqrt(5)) / 2, // golden ratio
    gamma: 0.5772156649015329, // Euler–Mascheroni (nearest f64)
    sqrt2: Math.SQRT2,
    sqrt1_2: Math.SQRT1_2,
    ln2: Math.LN2,
    ln10: Math.LN10,
    log2e: Math.LOG2E,
    log10e: Math.LOG10E,
    catalan: 0.915965594177219, // Catalan's constant (nearest f64)
});

/** @type {Readonly<Record<string, PhysicalConstant>>} */
export const PHYSICAL = Object.freeze({
    c: { value: 299792458, unit: 'm/s', symbol: 'c', name: 'Speed of light in vacuum', exact: true },
    h: { value: 6.62607015e-34, unit: 'J·s', symbol: 'h', name: 'Planck constant', exact: true },
    hbar: { value: 1.054571817e-34, unit: 'J·s', symbol: 'ℏ', name: 'Reduced Planck constant', exact: false },
    G: { value: 6.6743e-11, unit: 'm³/(kg·s²)', symbol: 'G', name: 'Newtonian gravitation', exact: false },
    e: { value: 1.602176634e-19, unit: 'C', symbol: 'e', name: 'Elementary charge', exact: true },
    kB: { value: 1.380649e-23, unit: 'J/K', symbol: 'k_B', name: 'Boltzmann constant', exact: true },
    NA: { value: 6.02214076e23, unit: '1/mol', symbol: 'N_A', name: 'Avogadro constant', exact: true },
    R: { value: 8.314462618, unit: 'J/(mol·K)', symbol: 'R', name: 'Molar gas constant', exact: false },
    me: { value: 9.1093837015e-31, unit: 'kg', symbol: 'mₑ', name: 'Electron mass', exact: false },
    mp: { value: 1.67262192369e-27, unit: 'kg', symbol: 'mₚ', name: 'Proton mass', exact: false },
    mn: { value: 1.67492749804e-27, unit: 'kg', symbol: 'mₙ', name: 'Neutron mass', exact: false },
    alpha: { value: 7.2973525693e-3, unit: '1', symbol: 'α', name: 'Fine-structure constant', exact: false },
    eps0: { value: 8.8541878128e-12, unit: 'F/m', symbol: 'ε₀', name: 'Vacuum electric permittivity', exact: false },
    mu0: { value: 1.25663706212e-6, unit: 'N/A²', symbol: 'μ₀', name: 'Vacuum magnetic permeability', exact: false },
    sigma: { value: 5.670374419e-8, unit: 'W/(m²·K⁴)', symbol: 'σ', name: 'Stefan–Boltzmann constant', exact: false },
    g0: { value: 9.80665, unit: 'm/s²', symbol: 'g₀', name: 'Standard gravity', exact: true },
    atm: { value: 101325, unit: 'Pa', symbol: 'atm', name: 'Standard atmosphere', exact: true },
    Rinf: { value: 10973731.568160, unit: '1/m', symbol: 'R∞', name: 'Rydberg constant', exact: false },
    a0: { value: 5.29177210903e-11, unit: 'm', symbol: 'a₀', name: 'Bohr radius', exact: false },
    F: { value: 96485.33212, unit: 'C/mol', symbol: 'F', name: 'Faraday constant', exact: false },
});

/**
 * Resolve a named constant (math first, then physical) to its numeric value,
 * or `undefined` if unknown.
 * @param {string} name
 * @returns {number | undefined}
 */
export function constantValue(name) {
    if (name in MATH) return /** @type {Record<string, number>} */ (MATH)[name];
    if (name in PHYSICAL) return PHYSICAL[name].value;
    return undefined;
}
