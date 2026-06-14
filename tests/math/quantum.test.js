/**
 * @jest-environment node
 */
import {
    basisState, qubitCount, norm, normalize, applyGate,
    cnot, cz, swap, toffoli, probabilities, probOne, measureQubit,
    blochVector, tensor, runCircuit, bellState, toKet,
    X, Y, Z, H, S, T, I2, rx, ry, rz, phase,
} from '../../math/quantum.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-12) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

describe('quantum — states', () => {
    test('|0> for 1 qubit', () => {
        const s = basisState(1, 0);
        near(s[0].re, 1); near(s[1].re, 0);
    });
    test('qubitCount', () => expect(qubitCount(basisState(3, 0))).toBe(3));
    test('basis index out of range throws', () => expect(() => basisState(1, 5)).toThrow(RangeError));
    test('norm of basis = 1', () => near(norm(basisState(2, 3)), 1));
    test('normalize unnormalized', () => {
        const s = normalize([{ re: 3, im: 0 }, { re: 4, im: 0 }]);
        near(norm(s), 1);
        near(s[0].re, 0.6); near(s[1].re, 0.8);
    });
});

describe('quantum — single-qubit gates', () => {
    test('X|0> = |1>', () => {
        const s = applyGate(basisState(1, 0), X, 0);
        near(s[0].re, 0); near(s[1].re, 1);
    });
    test('X|1> = |0>', () => {
        const s = applyGate(basisState(1, 1), X, 0);
        near(s[0].re, 1); near(s[1].re, 0);
    });
    test('H|0> = (|0>+|1>)/sqrt2', () => {
        const s = applyGate(basisState(1, 0), H, 0);
        near(s[0].re, Math.SQRT1_2); near(s[1].re, Math.SQRT1_2);
    });
    test('H is its own inverse: HH|0> = |0>', () => {
        const s = applyGate(applyGate(basisState(1, 0), H, 0), H, 0);
        near(s[0].re, 1); near(s[1].re, 0);
    });
    test('Z|1> = -|1>', () => {
        const s = applyGate(basisState(1, 1), Z, 0);
        near(s[1].re, -1);
    });
    test('Y|0> = i|1>', () => {
        const s = applyGate(basisState(1, 0), Y, 0);
        near(s[1].re, 0); near(s[1].im, 1);
    });
    test('S = diag(1,i): S|1> = i|1>', () => {
        const s = applyGate(basisState(1, 1), S, 0);
        near(s[1].im, 1);
    });
    test('T^2 = S phase: (T T)|1> = i|1>', () => {
        const s = applyGate(applyGate(basisState(1, 1), T, 0), T, 0);
        near(s[1].re, 0); near(s[1].im, 1);
    });
    test('I2 leaves state unchanged', () => {
        const s = applyGate(basisState(1, 1), I2, 0);
        near(s[1].re, 1);
    });
});

describe('quantum — rotations', () => {
    test('Rx(pi)|0> = -i|1>', () => {
        const s = applyGate(basisState(1, 0), rx(Math.PI), 0);
        near(s[1].re, 0); near(s[1].im, -1);
    });
    test('Ry(pi)|0> = |1>', () => {
        const s = applyGate(basisState(1, 0), ry(Math.PI), 0);
        near(s[1].re, 1, 1e-12);
    });
    test('Rz(pi/2) keeps populations, adds phase', () => {
        const s = applyGate(basisState(1, 0), rz(Math.PI / 2), 0);
        near(Math.hypot(s[0].re, s[0].im), 1);
    });
    test('phase(pi)|1> = -|1>', () => {
        const s = applyGate(basisState(1, 1), phase(Math.PI), 0);
        near(s[1].re, -1, 1e-12);
    });
    test('Ry(2θ) rotates Bloch z by 2θ', () => {
        const s = applyGate(basisState(1, 0), ry(Math.PI / 2), 0);
        near(blochVector(s).z, 0, 1e-12); // equator
    });
});

describe('quantum — entanglement (multi-qubit)', () => {
    test('CNOT|10> = |11>', () => {
        const s = cnot(basisState(2, 0b10), 0, 1);
        near(s[0b11].re, 1);
    });
    test('CNOT|00> = |00> (control 0)', () => {
        const s = cnot(basisState(2, 0), 0, 1);
        near(s[0].re, 1);
    });
    test('Bell state = (|00>+|11>)/sqrt2', () => {
        const s = bellState();
        near(s[0b00].re, Math.SQRT1_2);
        near(s[0b11].re, Math.SQRT1_2);
        near(s[0b01].re, 0);
        near(s[0b10].re, 0);
    });
    test('Bell state is entangled — both marginals 50/50', () => {
        const s = bellState();
        near(probOne(s, 0), 0.5);
        near(probOne(s, 1), 0.5);
    });
    test('CZ|11> = -|11>', () => {
        const s = cz(basisState(2, 0b11), 0, 1);
        near(s[0b11].re, -1);
    });
    test('SWAP|01> = |10>', () => {
        const s = swap(basisState(2, 0b01), 0, 1);
        near(s[0b10].re, 1);
    });
    test('Toffoli|110> = |111>', () => {
        const s = toffoli(basisState(3, 0b110), 0, 1, 2);
        near(s[0b111].re, 1);
    });
    test('Toffoli|100> unchanged (one control 0)', () => {
        const s = toffoli(basisState(3, 0b100), 0, 1, 2);
        near(s[0b100].re, 1);
    });
});

describe('quantum — measurement (Born rule)', () => {
    test('probabilities sum to 1', () => {
        const s = bellState();
        const total = probabilities(s).reduce((a, b) => a + b, 0);
        near(total, 1);
    });
    test('measuring Bell q0=1 collapses q1 to 1', () => {
        const { bit, state } = measureQubit(bellState(), 0, 0.99); // r>0.5 → outcome 1
        expect(bit).toBe(1);
        near(state[0b11].re, 1); // collapsed to |11>
        near(norm(state), 1);
    });
    test('measuring Bell q0=0 collapses q1 to 0', () => {
        const { bit, state } = measureQubit(bellState(), 0, 0.01); // r<0.5 → outcome 0
        expect(bit).toBe(0);
        near(state[0b00].re, 1);
    });
    test('deterministic |1> always measures 1', () => {
        const { bit } = measureQubit(basisState(1, 1), 0, 0.5);
        expect(bit).toBe(1);
    });
});

describe('quantum — Bloch sphere', () => {
    test('|0> → north pole (z=1)', () => {
        const b = blochVector(basisState(1, 0));
        near(b.x, 0); near(b.y, 0); near(b.z, 1);
    });
    test('|1> → south pole (z=-1)', () => {
        const b = blochVector(basisState(1, 1));
        near(b.z, -1);
    });
    test('H|0> → +x axis', () => {
        const b = blochVector(applyGate(basisState(1, 0), H, 0));
        near(b.x, 1); near(b.z, 0);
    });
    test('S H|0> → +y axis', () => {
        const s = applyGate(applyGate(basisState(1, 0), H, 0), S, 0);
        const b = blochVector(s);
        near(b.y, 1, 1e-12); near(b.z, 0);
    });
    test('Bloch vector is unit length for pure states', () => {
        const s = applyGate(basisState(1, 0), ry(0.9), 0);
        const b = blochVector(s);
        near(Math.hypot(b.x, b.y, b.z), 1);
    });
});

describe('quantum — composition & circuits', () => {
    test('tensor |0>⊗|1> = |01>', () => {
        const s = tensor(basisState(1, 0), basisState(1, 1));
        near(s[0b01].re, 1);
    });
    test('runCircuit reproduces Bell state', () => {
        const s = runCircuit(basisState(2, 0), [
            { op: 'gate', gate: H, target: 0 },
            { op: 'cnot', control: 0, target: 1 },
        ]);
        near(s[0b00].re, Math.SQRT1_2);
        near(s[0b11].re, Math.SQRT1_2);
    });
    test('GHZ state via H + 2 CNOTs', () => {
        const s = runCircuit(basisState(3, 0), [
            { op: 'gate', gate: H, target: 0 },
            { op: 'cnot', control: 0, target: 1 },
            { op: 'cnot', control: 1, target: 2 },
        ]);
        near(s[0b000].re, Math.SQRT1_2);
        near(s[0b111].re, Math.SQRT1_2);
    });
    test('toKet formats Bell state', () => {
        expect(toKet(bellState())).toMatch(/\|00⟩.*\|11⟩/);
    });
    test('swap via runCircuit', () => {
        const s = runCircuit(basisState(2, 0b10), [{ op: 'swap', a: 0, b: 1 }]);
        near(s[0b01].re, 1);
    });
});

describe('quantum — gate unitarity (norm preservation)', () => {
    test.each([
        ['X', X], ['Y', Y], ['Z', Z], ['H', H], ['S', S], ['T', T],
    ])('%s preserves norm', (_name, gate) => {
        const s = applyGate(normalize([{ re: 0.6, im: 0.1 }, { re: 0.3, im: -0.4 }]), gate, 0);
        near(norm(s), 1, 1e-12);
    });
});
