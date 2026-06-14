// @ts-check
/**
 * Quantum circuit builder — a fluent, chainable API over the state-vector
 * simulator in {@link module:math/quantum}. Build a circuit by appending gate
 * operations, then `run()` it to a state vector or read `probabilities()`. An
 * ASCII `diagram()` renders the gate timeline.
 *
 * Each gate method records a {@link module:math/quantum.CircuitOp} and returns
 * `this`, so circuits read like `new QuantumCircuit(2).h(0).cnot(0, 1)`.
 * Construction and recording are pure (no simulation until `run`); `run` is
 * O(g · 2ⁿ) for g gates on n qubits.
 *
 * @module math/circuit
 */

import * as Q from './quantum.js';

/** @typedef {import('./quantum.js').CircuitOp} CircuitOp */
/** @typedef {import('./quantum.js').State} State */

export class QuantumCircuit {
    /** @param {number} qubits */
    constructor(qubits) {
        if (!Number.isInteger(qubits) || qubits < 1) {
            throw new RangeError('a circuit needs at least 1 qubit');
        }
        this.qubits = qubits;
        /** @type {CircuitOp[]} */
        this.ops = [];
        /** Per-qubit gate-symbol timeline, for diagram(). @type {string[][]} */
        this._lanes = Array.from({ length: qubits }, () => []);
    }

    /** @param {number} q @returns {void} */
    _check(q) {
        if (q < 0 || q >= this.qubits) throw new RangeError(`qubit ${q} out of range (0..${this.qubits - 1})`);
    }

    /**
     * Append a single-qubit gate (records op + lane symbol).
     * @param {import('./quantum.js').Gate2} gate
     * @param {number} q
     * @param {string} symbol
     * @returns {this}
     */
    _g(gate, q, symbol) {
        this._check(q);
        this.ops.push({ op: 'gate', gate, target: q });
        this._pushLane(q, symbol);
        return this;
    }

    /** @param {number} q @param {string} symbol */
    _pushLane(q, symbol) {
        // place at the next free column so the diagram stays aligned
        const col = Math.max(...this._lanes.map((l) => l.length));
        for (let i = 0; i < this.qubits; i++) {
            while (this._lanes[i].length < col) this._lanes[i].push('─');
        }
        this._lanes[q][col] = symbol;
        for (let i = 0; i < this.qubits; i++) {
            if (this._lanes[i].length <= col) this._lanes[i][col] = '─';
        }
    }

    /* single-qubit gates */
    /** @param {number} q @returns {this} */ h(q) { return this._g(Q.H, q, 'H'); }
    /** @param {number} q @returns {this} */ x(q) { return this._g(Q.X, q, 'X'); }
    /** @param {number} q @returns {this} */ y(q) { return this._g(Q.Y, q, 'Y'); }
    /** @param {number} q @returns {this} */ z(q) { return this._g(Q.Z, q, 'Z'); }
    /** @param {number} q @returns {this} */ s(q) { return this._g(Q.S, q, 'S'); }
    /** @param {number} q @returns {this} */ t(q) { return this._g(Q.T, q, 'T'); }
    /** @param {number} q @param {number} theta @returns {this} */ rx(q, theta) { return this._g(Q.rx(theta), q, 'Rx'); }
    /** @param {number} q @param {number} theta @returns {this} */ ry(q, theta) { return this._g(Q.ry(theta), q, 'Ry'); }
    /** @param {number} q @param {number} theta @returns {this} */ rz(q, theta) { return this._g(Q.rz(theta), q, 'Rz'); }
    /** @param {number} q @param {number} phi @returns {this} */ phase(q, phi) { return this._g(Q.phase(phi), q, 'P'); }

    /* multi-qubit gates */
    /** @param {number} control @param {number} target @returns {this} */
    cnot(control, target) {
        this._check(control); this._check(target);
        this.ops.push({ op: 'cnot', control, target });
        this._pushLane(control, '●'); this._lanes[target][this._lanes[control].length - 1] = '⊕';
        return this;
    }
    /** @param {number} control @param {number} target @returns {this} */
    cz(control, target) {
        this._check(control); this._check(target);
        this.ops.push({ op: 'cz', control, target });
        this._pushLane(control, '●'); this._lanes[target][this._lanes[control].length - 1] = '●';
        return this;
    }
    /** @param {number} a @param {number} b @returns {this} */
    swap(a, b) {
        this._check(a); this._check(b);
        this.ops.push({ op: 'swap', a, b });
        this._pushLane(a, '×'); this._lanes[b][this._lanes[a].length - 1] = '×';
        return this;
    }
    /** @param {number} c1 @param {number} c2 @param {number} target @returns {this} */
    toffoli(c1, c2, target) {
        this._check(c1); this._check(c2); this._check(target);
        this.ops.push({ op: 'toffoli', c1, c2, target });
        this._pushLane(c1, '●');
        const col = this._lanes[c1].length - 1;
        this._lanes[c2][col] = '●'; this._lanes[target][col] = '⊕';
        return this;
    }

    /** Number of recorded gate operations. @returns {number} */
    depth() {
        return this.ops.length;
    }

    /** Run the circuit on |0…0⟩ and return the final state vector. @returns {State} */
    run() {
        return Q.runCircuit(Q.basisState(this.qubits, 0), this.ops);
    }

    /** Born-rule probabilities over the computational basis. @returns {number[]} */
    probabilities() {
        return Q.probabilities(this.run());
    }

    /**
     * Measure every qubit using an array of uniform samples (injectable for
     * determinism). Returns the bit string (e.g. "101") and collapsed state.
     * @param {number[]} samples  one per qubit
     * @returns {{ bits: string, state: State }}
     */
    measureAll(samples) {
        let state = this.run();
        let bits = '';
        for (let q = 0; q < this.qubits; q++) {
            const r = samples[q] ?? 0;
            const res = Q.measureQubit(state, q, r);
            bits += res.bit;
            state = res.state;
        }
        return { bits, state };
    }

    /** Final state as a ket string. @returns {string} */
    toKet() {
        return Q.toKet(this.run());
    }

    /**
     * ASCII circuit diagram, one line per qubit.
     * @returns {string}
     */
    diagram() {
        const width = Math.max(0, ...this._lanes.map((l) => l.length));
        return this._lanes
            .map((lane, q) => {
                const cells = [];
                for (let c = 0; c < width; c++) cells.push(lane[c] ?? '─');
                return `q${q}: |0⟩─${cells.map((s) => (s === '─' ? '──' : s + '─')).join('')}`;
            })
            .join('\n');
    }
}

/**
 * Convenience: prepare an n-qubit GHZ state (|0…0⟩ + |1…1⟩)/√2 via H + CNOT chain.
 * @param {number} n
 * @returns {QuantumCircuit}
 */
export function ghz(n) {
    const c = new QuantumCircuit(n).h(0);
    for (let i = 0; i < n - 1; i++) c.cnot(i, i + 1);
    return c;
}

/**
 * Convenience: the 2-qubit Bell circuit.
 * @returns {QuantumCircuit}
 */
export function bell() {
    return new QuantumCircuit(2).h(0).cnot(0, 1);
}
