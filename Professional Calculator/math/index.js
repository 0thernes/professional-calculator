// @ts-check
/**
 * Public facade for the scientific engine. Re-exports every module under a
 * namespace so consumers can `import { Engine } from './math/index.js'` and
 * reach the whole library, or import individual namespaces.
 *
 * @module math
 */

import * as Complex from './complex.js';
import * as Rational from './rational.js';
import * as Special from './special.js';
import * as Constants from './constants.js';
import * as Parser from './parser.js';
import * as Matrix from './matrix.js';
import * as Calculus from './calculus.js';
import * as Stats from './stats.js';
import * as Units from './units.js';
import * as Finance from './finance.js';
import * as Quantum from './quantum.js';
import * as Physics from './physics.js';
import * as Plot from './plot.js';
import * as Symbolic from './symbolic.js';
import * as Circuit from './circuit.js';
import * as NumberTheory from './numtheory.js';

export {
    Complex, Rational, Special, Constants, Parser, Matrix, Calculus, Stats,
    Units, Finance, Quantum, Physics, Plot, Symbolic, Circuit, NumberTheory,
};

/** Library version (semantic). */
export const VERSION = '3.6.0';

/**
 * A flat capability manifest — used by the UI to advertise what the engine
 * can do and by tests/docs to stay in sync with reality.
 * @type {ReadonlyArray<{ domain: string, functions: string[] }>}
 */
export const CAPABILITIES = Object.freeze([
    { domain: 'Arithmetic', functions: ['+', '−', '×', '÷', '^', 'mod', '!', '|x|'] },
    { domain: 'Complex', functions: ['i/j unit', 'exp', 'log', 'sqrt', 'pow', 'trig', 'hyperbolic', 'conj', 'arg'] },
    { domain: 'Algebra', functions: ['exact rationals', 'gcd', 'lcm', 'nCr', 'nPr'] },
    { domain: 'Linear algebra', functions: ['[[..]] literals in REPL', 'det', 'inv', 'solve', 'rank', 'LU', 'QR', 'eigenvalues', 'eigenvectors'] },
    { domain: 'Calculus', functions: ["d/dx", '∫ (adaptive)', 'roots (Brent)', 'ODE (RK4/RKF45)', 'gradient'] },
    { domain: 'Statistics', functions: ['mean/median/std', 'regression', 'normal/t/χ²/F/binomial/Poisson', 't-test', 'z-test', 'χ² GoF', 'ANOVA', 'CI'] },
    { domain: 'Units', functions: ['SI dimensional analysis', 'conversion', 'temperature scales'] },
    { domain: 'Finance', functions: ['NPV', 'IRR', 'PV/FV', 'annuities', 'Black–Scholes', 'Greeks', 'binomial', 'Monte Carlo'] },
    { domain: 'Special fns', functions: ['Γ', 'lnΓ', 'erf', 'erfc', 'β', 'incomplete γ/β'] },
    { domain: 'Quantum computing', functions: ['qubits', 'X/Y/Z/H/S/T', 'CNOT/CZ/SWAP/Toffoli', 'Bell/GHZ', 'measurement', 'Bloch sphere', 'fluent circuit builder'] },
    { domain: 'Physics', functions: ['de Broglie', 'hydrogen levels', 'Lorentz γ', 'E=mc²', 'Schwarzschild', 'Planck/Wien'] },
    { domain: 'Visualization', functions: ['2D/parametric plots', '3D surfaces', '4D tesseract', 'Bloch sphere', 'spectra'] },
    { domain: 'Symbolic (CAS)', functions: ['diff(expr, x)', 'integrate(expr, x)', 'product/quotient/chain rules', 'simplify', 're-parseable output'] },
    { domain: 'Number theory', functions: ['isprime', 'factor', 'divisors', 'modpow', 'modinv', 'totient', 'fib', 'gcd/lcm'] },
]);

/**
 * Evaluate a scientific expression string and return a display-ready result.
 * Thin re-export of {@link module:math/parser.compute} for convenience.
 * Supports scalars (Complex) and matrices/vectors.
 * @param {string} expression
 * @param {Record<string, number | import('./complex.js').Complex | number[][]>} [scope]
 * @returns {{ value: import('./complex.js').Complex | number[][], display: string, isReal: boolean, isMatrix: boolean }}
 */
export function compute(expression, scope = {}) {
    return Parser.compute(expression, scope);
}
