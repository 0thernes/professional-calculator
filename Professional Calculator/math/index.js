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

export { Complex, Rational, Special, Constants, Parser, Matrix, Calculus, Stats, Units, Finance };

/** Library version (semantic). */
export const VERSION = '2.0.0';

/**
 * A flat capability manifest — used by the UI to advertise what the engine
 * can do and by tests/docs to stay in sync with reality.
 * @type {ReadonlyArray<{ domain: string, functions: string[] }>}
 */
export const CAPABILITIES = Object.freeze([
    { domain: 'Arithmetic', functions: ['+', '−', '×', '÷', '^', 'mod', '!', '|x|'] },
    { domain: 'Complex', functions: ['i/j unit', 'exp', 'log', 'sqrt', 'pow', 'trig', 'hyperbolic', 'conj', 'arg'] },
    { domain: 'Algebra', functions: ['exact rationals', 'gcd', 'lcm', 'nCr', 'nPr'] },
    { domain: 'Linear algebra', functions: ['det', 'inv', 'solve', 'rank', 'LU', 'QR', 'eigenvalues', 'eigenvectors'] },
    { domain: 'Calculus', functions: ["d/dx", '∫ (adaptive)', 'roots (Brent)', 'ODE (RK4/RKF45)', 'gradient'] },
    { domain: 'Statistics', functions: ['mean/median/std', 'regression', 'normal', 't', 'χ²', 'F', 'binomial', 'Poisson'] },
    { domain: 'Units', functions: ['SI dimensional analysis', 'conversion', 'temperature scales'] },
    { domain: 'Finance', functions: ['NPV', 'IRR', 'PV/FV', 'annuities', 'amortization', 'Black–Scholes'] },
    { domain: 'Special fns', functions: ['Γ', 'lnΓ', 'erf', 'erfc', 'β', 'incomplete γ/β'] },
]);

/**
 * Evaluate a scientific expression string and return a display-ready result.
 * Thin re-export of {@link module:math/parser.compute} for convenience.
 * @param {string} expression
 * @param {Record<string, number | import('./complex.js').Complex>} [scope]
 * @returns {{ value: import('./complex.js').Complex, display: string, isReal: boolean }}
 */
export function compute(expression, scope = {}) {
    return Parser.compute(expression, scope);
}
