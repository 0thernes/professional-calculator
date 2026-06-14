/**
 * @jest-environment node
 */
import { QuantumCircuit, ghz, bell } from '../../math/circuit.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-12) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

describe('circuit — construction', () => {
    test('needs ≥1 qubit', () => expect(() => new QuantumCircuit(0)).toThrow(RangeError));
    test('out-of-range qubit throws', () => expect(() => new QuantumCircuit(2).h(5)).toThrow(RangeError));
    test('fluent chaining returns this', () => {
        const c = new QuantumCircuit(2);
        expect(c.h(0)).toBe(c);
        expect(c.cnot(0, 1)).toBe(c);
    });
    test('depth counts ops', () => expect(new QuantumCircuit(2).h(0).cnot(0, 1).depth()).toBe(2));
});

describe('circuit — known states', () => {
    test('X|0> → |1>: probs [0,1]', () => {
        const p = new QuantumCircuit(1).x(0).probabilities();
        near(p[0], 0); near(p[1], 1);
    });
    test('H|0> → 50/50', () => {
        const p = new QuantumCircuit(1).h(0).probabilities();
        near(p[0], 0.5); near(p[1], 0.5);
    });
    test('Bell circuit → |00>,|11> at 0.5', () => {
        const p = bell().probabilities();
        near(p[0b00], 0.5); near(p[0b01], 0); near(p[0b10], 0); near(p[0b11], 0.5);
    });
    test('Bell ket', () => expect(bell().toKet()).toMatch(/\|00⟩.*\|11⟩/));
    test('GHZ(3) → |000>,|111> at 0.5', () => {
        const p = ghz(3).probabilities();
        near(p[0b000], 0.5); near(p[0b111], 0.5);
        for (let i = 1; i < 7; i++) near(p[i], 0);
    });
    test('GHZ(4) all-zero/all-one', () => {
        const p = ghz(4).probabilities();
        near(p[0], 0.5); near(p[15], 0.5);
    });
    test('probabilities always sum to 1', () => {
        const p = new QuantumCircuit(3).h(0).h(1).cnot(0, 2).t(1).probabilities();
        near(p.reduce((a, b) => a + b, 0), 1);
    });
    test('SWAP exchanges qubits: |10> → |01>', () => {
        const p = new QuantumCircuit(2).x(0).swap(0, 1).probabilities();
        near(p[0b01], 1);
    });
    test('Toffoli |110> → |111>', () => {
        const p = new QuantumCircuit(3).x(0).x(1).toffoli(0, 1, 2).probabilities();
        near(p[0b111], 1);
    });
    test('rotations: Ry(π) on |0> → |1>', () => {
        const p = new QuantumCircuit(1).ry(0, Math.PI).probabilities();
        near(p[1], 1, 1e-12);
    });
});

describe('circuit — measurement', () => {
    test('deterministic |1> measures 1', () => {
        const { bits } = new QuantumCircuit(1).x(0).measureAll([0.5]);
        expect(bits).toBe('1');
    });
    test('Bell correlated: q0=1 forces q1=1', () => {
        const { bits } = bell().measureAll([0.99, 0.0]); // q0 → 1; q1 then forced
        expect(bits).toBe('11');
    });
    test('Bell correlated: q0=0 forces q1=0', () => {
        const { bits } = bell().measureAll([0.01, 0.99]);
        expect(bits).toBe('00');
    });
});

describe('circuit — diagram', () => {
    test('renders one line per qubit', () => {
        const d = bell().diagram();
        expect(d.split('\n').length).toBe(2);
        expect(d).toContain('q0:');
        expect(d).toContain('q1:');
        expect(d).toContain('H');
    });
    test('shows control/target symbols', () => {
        const d = new QuantumCircuit(2).cnot(0, 1).diagram();
        expect(d).toContain('●');
        expect(d).toContain('⊕');
    });
});
