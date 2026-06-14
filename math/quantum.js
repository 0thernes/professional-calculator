// @ts-check
/**
 * Quantum computing — state-vector simulator over the complex field.
 *
 * An `n`-qubit pure state is a length-2ⁿ array of {@link Complex} amplitudes,
 * indexed in big-endian order (qubit 0 is the most-significant bit, matching
 * the usual |q₀q₁…⟩ ket convention). Gates are applied directly to the state
 * vector in O(2ⁿ) per single-qubit gate — the standard, exact dense
 * simulation. This is the genuine article: unitary evolution, entanglement
 * via CNOT, and Born-rule measurement, all verifiable against textbook kets.
 *
 * Everything is pure: gate application returns a new state vector; nothing is
 * mutated. Built entirely on {@link module:math/complex}.
 *
 * @module math/quantum
 */

import * as C from './complex.js';

/** @typedef {import('./complex.js').Complex} Complex */
/** @typedef {Complex[]} State  Length-2ⁿ amplitude vector. */

const INV_SQRT2 = 1 / Math.SQRT2;

/* ------------------------------------------------------------------ *
 *  State construction
 * ------------------------------------------------------------------ */

/**
 * The computational basis state |k⟩ for `n` qubits (amplitude 1 at index k).
 * @param {number} n  qubit count
 * @param {number} [k]  basis index (default 0 → |0…0⟩)
 * @returns {State}
 */
export function basisState(n, k = 0) {
    const dim = 1 << n;
    if (k < 0 || k >= dim) throw new RangeError(`basis index ${k} out of range for ${n} qubits`);
    const s = new Array(dim);
    for (let i = 0; i < dim; i++) s[i] = { re: 0, im: 0 };
    s[k] = { re: 1, im: 0 };
    return s;
}

/**
 * Number of qubits represented by a state vector (log₂ of its length).
 * @param {State} state
 * @returns {number}
 */
export function qubitCount(state) {
    const n = Math.log2(state.length);
    if (!Number.isInteger(n)) throw new RangeError('state length is not a power of two');
    return n;
}

/**
 * L² norm of a state vector (should be 1 for a valid quantum state).
 * @param {State} state
 * @returns {number}
 */
export function norm(state) {
    let s = 0;
    for (const a of state) s += C.abs2(a);
    return Math.sqrt(s);
}

/**
 * Renormalize a state to unit length (returns a new vector).
 * @param {State} state
 * @returns {State}
 */
export function normalize(state) {
    const nrm = norm(state);
    if (nrm === 0) throw new RangeError('cannot normalize the zero vector');
    return state.map((a) => ({ re: a.re / nrm, im: a.im / nrm }));
}

/* ------------------------------------------------------------------ *
 *  Single-qubit gates (2×2 complex matrices)
 * ------------------------------------------------------------------ */

/** @typedef {[[Complex,Complex],[Complex,Complex]]} Gate2 */

const c = (/** @type {number} */ re, /** @type {number} */ im = 0) => ({ re, im });

/** Pauli-X (NOT). @type {Gate2} */
export const X = [[c(0), c(1)], [c(1), c(0)]];
/** Pauli-Y. @type {Gate2} */
export const Y = [[c(0), c(0, -1)], [c(0, 1), c(0)]];
/** Pauli-Z. @type {Gate2} */
export const Z = [[c(1), c(0)], [c(0), c(-1)]];
/** Hadamard. @type {Gate2} */
export const H = [[c(INV_SQRT2), c(INV_SQRT2)], [c(INV_SQRT2), c(-INV_SQRT2)]];
/** Phase gate S = diag(1, i). @type {Gate2} */
export const S = [[c(1), c(0)], [c(0), c(0, 1)]];
/** T gate = diag(1, e^{iπ/4}). @type {Gate2} */
export const T = [[c(1), c(0)], [c(0), c(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4))]];
/** Identity. @type {Gate2} */
export const I2 = [[c(1), c(0)], [c(0), c(1)]];

/**
 * Rotation about X by angle θ: Rx(θ) = exp(-iθX/2).
 * @param {number} theta
 * @returns {Gate2}
 */
export function rx(theta) {
    const cs = Math.cos(theta / 2);
    const sn = Math.sin(theta / 2);
    return [[c(cs), c(0, -sn)], [c(0, -sn), c(cs)]];
}
/** Rotation about Y: Ry(θ) = exp(-iθY/2). @param {number} theta @returns {Gate2} */
export function ry(theta) {
    const cs = Math.cos(theta / 2);
    const sn = Math.sin(theta / 2);
    return [[c(cs), c(-sn)], [c(sn), c(cs)]];
}
/** Rotation about Z: Rz(θ) = exp(-iθZ/2). @param {number} theta @returns {Gate2} */
export function rz(theta) {
    return [[c(Math.cos(theta / 2), -Math.sin(theta / 2)), c(0)],
            [c(0), c(Math.cos(theta / 2), Math.sin(theta / 2))]];
}
/** Phase shift gate diag(1, e^{iφ}). @param {number} phi @returns {Gate2} */
export function phase(phi) {
    return [[c(1), c(0)], [c(0), c(Math.cos(phi), Math.sin(phi))]];
}

/**
 * Apply a single-qubit gate to `target` qubit of an `n`-qubit state. O(2ⁿ).
 * @param {State} state
 * @param {Gate2} gate
 * @param {number} target  qubit index (0 = most significant)
 * @returns {State}
 */
export function applyGate(state, gate, target) {
    const n = qubitCount(state);
    if (target < 0 || target >= n) throw new RangeError(`target qubit ${target} out of range`);
    const dim = state.length;
    const out = state.map((a) => ({ re: a.re, im: a.im }));
    // bit position (big-endian): qubit t corresponds to bit (n-1-t)
    const bit = 1 << (n - 1 - target);
    for (let i = 0; i < dim; i++) {
        if ((i & bit) === 0) {
            const j = i | bit;
            const a0 = state[i];
            const a1 = state[j];
            // [out_i; out_j] = gate · [a0; a1]
            out[i] = C.add(C.mul(gate[0][0], a0), C.mul(gate[0][1], a1));
            out[j] = C.add(C.mul(gate[1][0], a0), C.mul(gate[1][1], a1));
        }
    }
    return out;
}

/**
 * Apply a controlled single-qubit gate (control qubit must be |1⟩). Covers
 * CNOT (gate=X), CZ (gate=Z), controlled-phase, etc. O(2ⁿ).
 * @param {State} state
 * @param {Gate2} gate
 * @param {number} control
 * @param {number} target
 * @returns {State}
 */
export function applyControlled(state, gate, control, target) {
    const n = qubitCount(state);
    if (control === target) throw new RangeError('control and target must differ');
    const cbit = 1 << (n - 1 - control);
    const tbit = 1 << (n - 1 - target);
    const out = state.map((a) => ({ re: a.re, im: a.im }));
    for (let i = 0; i < state.length; i++) {
        // act only on the subspace where control = 1 and target bit = 0
        if ((i & cbit) !== 0 && (i & tbit) === 0) {
            const j = i | tbit;
            const a0 = state[i];
            const a1 = state[j];
            out[i] = C.add(C.mul(gate[0][0], a0), C.mul(gate[0][1], a1));
            out[j] = C.add(C.mul(gate[1][0], a0), C.mul(gate[1][1], a1));
        }
    }
    return out;
}

/** CNOT: controlled-X. @param {State} state @param {number} control @param {number} target @returns {State} */
export function cnot(state, control, target) {
    return applyControlled(state, X, control, target);
}

/** Controlled-Z. @param {State} state @param {number} control @param {number} target @returns {State} */
export function cz(state, control, target) {
    return applyControlled(state, Z, control, target);
}

/**
 * SWAP two qubits (three CNOTs). @param {State} state @param {number} a @param {number} b @returns {State}
 */
export function swap(state, a, b) {
    return cnot(cnot(cnot(state, a, b), b, a), a, b);
}

/**
 * Toffoli (CCNOT): flip `target` iff both controls are |1⟩. O(2ⁿ).
 * @param {State} state
 * @param {number} c1
 * @param {number} c2
 * @param {number} target
 * @returns {State}
 */
export function toffoli(state, c1, c2, target) {
    const n = qubitCount(state);
    const b1 = 1 << (n - 1 - c1);
    const b2 = 1 << (n - 1 - c2);
    const bt = 1 << (n - 1 - target);
    const out = state.map((a) => ({ re: a.re, im: a.im }));
    for (let i = 0; i < state.length; i++) {
        if ((i & b1) !== 0 && (i & b2) !== 0 && (i & bt) === 0) {
            const j = i | bt;
            [out[i], out[j]] = [out[j], out[i]];
        }
    }
    return out;
}

/* ------------------------------------------------------------------ *
 *  Measurement
 * ------------------------------------------------------------------ */

/**
 * Born-rule probabilities for each computational basis outcome.
 * @param {State} state
 * @returns {number[]}  length-2ⁿ probability vector (sums to 1)
 */
export function probabilities(state) {
    return state.map((a) => C.abs2(a));
}

/**
 * Marginal probability that `target` qubit measures |1⟩.
 * @param {State} state
 * @param {number} target
 * @returns {number}
 */
export function probOne(state, target) {
    const n = qubitCount(state);
    const bit = 1 << (n - 1 - target);
    let p = 0;
    for (let i = 0; i < state.length; i++) if (i & bit) p += C.abs2(state[i]);
    return p;
}

/**
 * Deterministic projective measurement of one qubit given a uniform random
 * draw `r ∈ [0,1)` (injected for testability — no hidden RNG). Returns the
 * measured bit and the post-measurement (collapsed, renormalized) state.
 * @param {State} state
 * @param {number} target
 * @param {number} r  uniform sample in [0,1)
 * @returns {{ bit: 0|1, state: State }}
 */
export function measureQubit(state, target, r) {
    const n = qubitCount(state);
    const bit = 1 << (n - 1 - target);
    const p1 = probOne(state, target);
    // Convention: r in [0,1); the [0, p0) sub-interval yields 0, the rest 1.
    const outcome = r < 1 - p1 ? 0 : 1;
    const keepNorm = Math.sqrt(outcome === 1 ? p1 : 1 - p1);
    const out = state.map((a, i) => {
        const isOne = (i & bit) !== 0;
        if ((outcome === 1) === isOne && keepNorm > 0) {
            return { re: a.re / keepNorm, im: a.im / keepNorm };
        }
        return { re: 0, im: 0 };
    });
    return { bit: /** @type {0|1} */ (outcome), state: out };
}

/* ------------------------------------------------------------------ *
 *  Bloch sphere (single qubit)
 * ------------------------------------------------------------------ */

/**
 * Bloch-sphere coordinates (x, y, z) of a single-qubit state |ψ⟩ = α|0⟩+β|1⟩.
 *   x = 2 Re(α*β), y = 2 Im(α*β), z = |α|² − |β|².
 * @param {State} state  must be a 1-qubit state (length 2)
 * @returns {{ x: number, y: number, z: number }}
 */
export function blochVector(state) {
    if (state.length !== 2) throw new RangeError('blochVector requires a single-qubit state');
    const [a, b] = state;
    const ab = C.mul(C.conj(a), b); // α* β
    return { x: 2 * ab.re, y: 2 * ab.im, z: C.abs2(a) - C.abs2(b) };
}

/* ------------------------------------------------------------------ *
 *  Composition / circuits
 * ------------------------------------------------------------------ */

/**
 * Tensor (Kronecker) product of two state vectors: |a⟩ ⊗ |b⟩.
 * @param {State} a
 * @param {State} b
 * @returns {State}
 */
export function tensor(a, b) {
    const out = new Array(a.length * b.length);
    let k = 0;
    for (const ai of a) for (const bj of b) out[k++] = C.mul(ai, bj);
    return out;
}

/**
 * @typedef {(
 *   | { op: 'gate', gate: Gate2, target: number }
 *   | { op: 'cnot', control: number, target: number }
 *   | { op: 'cz', control: number, target: number }
 *   | { op: 'swap', a: number, b: number }
 *   | { op: 'toffoli', c1: number, c2: number, target: number }
 * )} CircuitOp
 */

/**
 * Run a sequence of operations on an initial state. Pure; returns the final
 * state vector.
 * @param {State} initial
 * @param {CircuitOp[]} ops
 * @returns {State}
 */
export function runCircuit(initial, ops) {
    let s = initial;
    for (const op of ops) {
        switch (op.op) {
            case 'gate':    s = applyGate(s, op.gate, op.target); break;
            case 'cnot':    s = cnot(s, op.control, op.target); break;
            case 'cz':      s = cz(s, op.control, op.target); break;
            case 'swap':    s = swap(s, op.a, op.b); break;
            case 'toffoli': s = toffoli(s, op.c1, op.c2, op.target); break;
            default: throw new SyntaxError('unknown circuit op');
        }
    }
    return s;
}

/**
 * Convenience: prepare a Bell state (|00⟩+|11⟩)/√2 via H on q0 then CNOT(0→1).
 * @returns {State}
 */
export function bellState() {
    return cnot(applyGate(basisState(2, 0), H, 0), 0, 1);
}

/**
 * Render a state vector as a ket string, dropping ~zero amplitudes, e.g.
 * "0.7071|00⟩ + 0.7071|11⟩".
 * @param {State} state
 * @param {number} [eps]
 * @returns {string}
 */
export function toKet(state, eps = 1e-10) {
    const n = qubitCount(state);
    const terms = [];
    for (let i = 0; i < state.length; i++) {
        if (C.abs(state[i]) < eps) continue;
        const label = i.toString(2).padStart(n, '0');
        terms.push(`${C.toString(state[i], 4)}|${label}⟩`);
    }
    return terms.length ? terms.join(' + ') : '0';
}
