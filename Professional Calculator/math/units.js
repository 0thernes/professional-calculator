// @ts-check
/**
 * Dimensional analysis and unit conversion.
 *
 * Every quantity carries a 7-vector of exponents over the SI base
 * dimensions [kg, m, s, A, K, mol, cd]. Arithmetic enforces dimensional
 * consistency: you can only add commensurate quantities, multiplication adds
 * exponents, and conversion is rejected across incompatible dimensions. This
 * is the safeguard that stops "3 kg + 2 m" — exactly the dimensional checking
 * an engineering tool must have.
 *
 * @module math/units
 */

/** Order of base SI dimensions. */
export const BASE_DIMENSIONS = Object.freeze(['mass', 'length', 'time', 'current', 'temperature', 'amount', 'luminosity']);

/**
 * Exponent vector over BASE_DIMENSIONS (length 7 by construction).
 * @typedef {number[]} Dim
 */

/**
 * @typedef {object} Quantity
 * @property {number} value  magnitude in SI base units
 * @property {Dim} dim       exponents over BASE_DIMENSIONS
 */

/** @returns {Dim} */
const dimless = () => [0, 0, 0, 0, 0, 0, 0];

/**
 * @param {Partial<Record<'mass'|'length'|'time'|'current'|'temperature'|'amount'|'luminosity', number>>} spec
 * @returns {Dim}
 */
function makeDim(spec) {
    return /** @type {Dim} */ (BASE_DIMENSIONS.map((d) => spec[/** @type {keyof typeof spec} */ (d)] ?? 0));
}

/**
 * Unit registry: name → { factor, dim, shift }. A magnitude in this unit maps
 * to SI base units by `SI = value·factor + shift`. `shift` is zero for all
 * multiplicative units and non-zero only for affine temperature scales
 * (°C, °F), which is the only correct way to convert between them.
 * @type {Readonly<Record<string, { factor: number, dim: Dim, shift?: number }>>}
 */
export const UNITS = Object.freeze({
    // base
    kg: { factor: 1, dim: makeDim({ mass: 1 }) },
    g: { factor: 1e-3, dim: makeDim({ mass: 1 }) },
    m: { factor: 1, dim: makeDim({ length: 1 }) },
    s: { factor: 1, dim: makeDim({ time: 1 }) },
    A: { factor: 1, dim: makeDim({ current: 1 }) },
    K: { factor: 1, dim: makeDim({ temperature: 1 }) },
    mol: { factor: 1, dim: makeDim({ amount: 1 }) },
    cd: { factor: 1, dim: makeDim({ luminosity: 1 }) },
    // length
    cm: { factor: 1e-2, dim: makeDim({ length: 1 }) },
    mm: { factor: 1e-3, dim: makeDim({ length: 1 }) },
    km: { factor: 1e3, dim: makeDim({ length: 1 }) },
    inch: { factor: 0.0254, dim: makeDim({ length: 1 }) },
    ft: { factor: 0.3048, dim: makeDim({ length: 1 }) },
    mile: { factor: 1609.344, dim: makeDim({ length: 1 }) },
    // mass
    lb: { factor: 0.45359237, dim: makeDim({ mass: 1 }) },
    // time
    min: { factor: 60, dim: makeDim({ time: 1 }) },
    hr: { factor: 3600, dim: makeDim({ time: 1 }) },
    day: { factor: 86400, dim: makeDim({ time: 1 }) },
    // derived
    N: { factor: 1, dim: makeDim({ mass: 1, length: 1, time: -2 }) },
    J: { factor: 1, dim: makeDim({ mass: 1, length: 2, time: -2 }) },
    W: { factor: 1, dim: makeDim({ mass: 1, length: 2, time: -3 }) },
    Pa: { factor: 1, dim: makeDim({ mass: 1, length: -1, time: -2 }) },
    Hz: { factor: 1, dim: makeDim({ time: -1 }) },
    C: { factor: 1, dim: makeDim({ current: 1, time: 1 }) },
    V: { factor: 1, dim: makeDim({ mass: 1, length: 2, time: -3, current: -1 }) },
    ohm: { factor: 1, dim: makeDim({ mass: 1, length: 2, time: -3, current: -2 }) },
    // affine temperature scales: SI(K) = value·factor + shift
    degC: { factor: 1, dim: makeDim({ temperature: 1 }), shift: 273.15 },
    degF: { factor: 5 / 9, dim: makeDim({ temperature: 1 }), shift: 273.15 - 32 * (5 / 9) },
});

/**
 * Construct a quantity from a magnitude and unit name (converted to SI).
 * @param {number} value
 * @param {string} unitName
 * @returns {Quantity}
 */
export function quantity(value, unitName) {
    const u = UNITS[unitName];
    if (!u) throw new RangeError(`Unknown unit '${unitName}'`);
    const si = value * u.factor + (u.shift ?? 0);
    return { value: si, dim: u.dim.slice() };
}

/** @param {Dim} a @param {Dim} b @returns {boolean} */
export function sameDim(a, b) {
    for (let i = 0; i < 7; i++) if (a[i] !== b[i]) return false;
    return true;
}

/** @param {Quantity} a @param {Quantity} b @returns {Quantity} */
export function addQ(a, b) {
    if (!sameDim(a.dim, b.dim)) throw new RangeError('Cannot add quantities with different dimensions');
    return { value: a.value + b.value, dim: /** @type {Dim} */ (a.dim.slice()) };
}
/** @param {Quantity} a @param {Quantity} b @returns {Quantity} */
export function subQ(a, b) {
    if (!sameDim(a.dim, b.dim)) throw new RangeError('Cannot subtract quantities with different dimensions');
    return { value: a.value - b.value, dim: /** @type {Dim} */ (a.dim.slice()) };
}
/** @param {Quantity} a @param {Quantity} b @returns {Quantity} */
export function mulQ(a, b) {
    return { value: a.value * b.value, dim: /** @type {Dim} */ (a.dim.map((d, i) => d + b.dim[i])) };
}
/** @param {Quantity} a @param {Quantity} b @returns {Quantity} */
export function divQ(a, b) {
    return { value: a.value / b.value, dim: /** @type {Dim} */ (a.dim.map((d, i) => d - b.dim[i])) };
}
/** @param {Quantity} a @param {number} k @returns {Quantity} */
export function powQ(a, k) {
    return { value: Math.pow(a.value, k), dim: /** @type {Dim} */ (a.dim.map((d) => d * k)) };
}

/**
 * Convert a magnitude from one unit to another, enforcing dimensional
 * compatibility. Handles affine temperature scales (°C, °F).
 * @param {number} value
 * @param {string} from
 * @param {string} to
 * @returns {number}
 */
export function convert(value, from, to) {
    const uf = UNITS[from];
    const ut = UNITS[to];
    if (!uf) throw new RangeError(`Unknown unit '${from}'`);
    if (!ut) throw new RangeError(`Unknown unit '${to}'`);
    if (!sameDim(uf.dim, ut.dim)) {
        throw new RangeError(`Incompatible units: '${from}' and '${to}'`);
    }
    const si = value * uf.factor + (uf.shift ?? 0);
    return (si - (ut.shift ?? 0)) / ut.factor;
}

/**
 * Render a dimension vector as a unit string like "kg·m/s²".
 * @param {Dim} dim
 * @returns {string}
 */
export function formatDim(dim) {
    const sym = ['kg', 'm', 's', 'A', 'K', 'mol', 'cd'];
    /** @type {string[]} */
    const num = [];
    /** @type {string[]} */
    const den = [];
    for (let i = 0; i < 7; i++) {
        const e = dim[i];
        if (e === 0) continue;
        const a = Math.abs(e);
        const term = a === 1 ? sym[i] : `${sym[i]}^${a}`;
        (e > 0 ? num : den).push(term);
    }
    const n = num.length ? num.join('·') : '1';
    return den.length ? `${n}/${den.join('·')}` : n;
}

/** True when a quantity is dimensionless. @param {Quantity} q @returns {boolean} */
export function isDimensionless(q) {
    return sameDim(q.dim, dimless());
}
