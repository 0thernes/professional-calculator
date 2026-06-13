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
import * as Signal from './signal.js';
import * as Interpolate from './interpolate.js';
import * as Optimize from './optimize.js';
import * as Geometry from './geometry.js';
import * as Combinatorics from './combinatorics.js';
import * as Decomposition from './decomposition.js';
import * as Coordinates from './coordinates.js';
import * as Random from './random.js';
import * as Graph from './graph.js';
import * as Sets from './sets.js';
import * as Bits from './bits.js';
import * as UnitExpr from './unitexpr.js';

export {
    Complex, Rational, Special, Constants, Parser, Matrix, Calculus, Stats,
    Units, Finance, Quantum, Physics, Plot, Symbolic, Circuit, NumberTheory,
    Signal, Interpolate, Optimize, Geometry, Combinatorics, Decomposition,
    Coordinates, Random, Graph, Sets, Bits, UnitExpr,
};

/** Library version (semantic). */
export const VERSION = '3.21.0';

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
    { domain: 'Units', functions: ['SI dimensional analysis', 'conversion', 'temperature scales', 'unit-aware expressions (3 kg·9.8 m/s²)'] },
    { domain: 'Finance', functions: ['NPV', 'IRR', 'PV/FV', 'annuities', 'Black–Scholes', 'Greeks', 'binomial', 'Monte Carlo'] },
    { domain: 'Special fns', functions: ['Γ', 'lnΓ', 'erf', 'erfc', 'β', 'incomplete γ/β'] },
    { domain: 'Quantum computing', functions: ['qubits', 'X/Y/Z/H/S/T', 'CNOT/CZ/SWAP/Toffoli', 'Bell/GHZ', 'measurement', 'Bloch sphere', 'fluent circuit builder'] },
    { domain: 'Physics', functions: ['de Broglie', 'hydrogen levels', 'Lorentz γ', 'E=mc²', 'Schwarzschild', 'Planck/Wien'] },
    { domain: 'Visualization', functions: ['2D/parametric plots', '3D surfaces', '4D tesseract', 'Bloch sphere', 'spectra'] },
    { domain: 'Symbolic (CAS)', functions: ['diff(expr, x)', 'integrate(expr, x)', 'product/quotient/chain rules', 'simplify', 're-parseable output'] },
    { domain: 'Number theory', functions: ['isprime', 'factor', 'divisors', 'modpow', 'modinv', 'totient', 'fib', 'gcd/lcm'] },
    { domain: 'Signal processing', functions: ['DFT/IDFT', 'FFT/IFFT (radix-2 + Bluestein)', 'magnitude/phase', 'convolution', 'cross-correlation', 'Hann/Hamming/Blackman', 'fftfreq'] },
    { domain: 'Interpolation', functions: ['piecewise-linear', 'Lagrange', 'Newton divided diff', 'natural cubic spline', 'polyfit (least squares)', 'polyval'] },
    { domain: 'Optimization', functions: ['golden-section (1D)', 'Nelder–Mead simplex', 'gradient descent (Armijo)'] },
    { domain: 'Vector geometry', functions: ['dot', 'cross', 'norm', 'normalize', 'distance', 'angle', 'projection', 'reflection', 'triple product', '2D/3D rotation'] },
    { domain: 'Combinatorics', functions: ['Catalan', 'Bell', 'Stirling 1st/2nd', 'partitions', 'derangements', 'multinomial', 'multichoose'] },
    { domain: 'Decompositions', functions: ['Cholesky', 'SVD (Jacobi)', 'singular values', 'pseudoinverse', 'least squares', 'condition number'] },
    { domain: 'Coordinates', functions: ['polar↔cartesian', 'spherical↔cartesian', 'cylindrical↔cartesian', 'deg/rad'] },
    { domain: 'Random/sampling', functions: ['seeded RNG', 'uniform/int', 'normal', 'exponential', 'Poisson', 'Bernoulli', 'choice/shuffle/sample'] },
    { domain: 'Graphs', functions: ['BFS', 'DFS', 'Dijkstra', 'shortest path', 'connected components', 'topological sort', 'MST (Kruskal)'] },
    { domain: 'Sets', functions: ['union', 'intersection', 'difference', 'subset/superset', 'Jaccard', 'power set', 'Cartesian product'] },
    { domain: 'Bits & bases', functions: ['base 2–36 convert', 'bin/oct/hex', 'popcount', 'Hamming distance', 'power-of-two', 'bit length', 'Gray code'] },
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
