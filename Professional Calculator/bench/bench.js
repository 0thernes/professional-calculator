// @ts-nocheck
/**
 * Micro-benchmark harness for the scientific engine.
 *
 * Run with:  node bench/bench.js
 *
 * Reports throughput (ops/sec) and mean latency for representative operations
 * across each module, plus the empirical scaling of the O(n³) kernels
 * (matrix multiply, determinant, eigenvalues) so the documented complexity
 * can be checked against reality. This is a script, not a test — it is
 * excluded from the type-checked/jest scope on purpose.
 */

import { parse, evaluate } from '../math/parser.js';
import * as M from '../math/matrix.js';
import * as Cal from '../math/calculus.js';
import { gamma } from '../math/special.js';
import { normalCdf, normalQuantile } from '../math/stats.js';
import { blackScholes } from '../math/finance.js';

/**
 * Time `fn` for at least `minMs` milliseconds and return ops/sec + mean ns.
 * @param {string} label
 * @param {() => void} fn
 * @param {number} [minMs]
 */
function bench(label, fn, minMs = 250) {
    // warmup
    for (let i = 0; i < 100; i++) fn();
    let iters = 0;
    const start = process.hrtime.bigint();
    const deadline = start + BigInt(minMs) * 1_000_000n;
    do {
        for (let i = 0; i < 50; i++) fn();
        iters += 50;
    } while (process.hrtime.bigint() < deadline);
    const elapsedNs = Number(process.hrtime.bigint() - start);
    const opsPerSec = (iters / elapsedNs) * 1e9;
    const meanNs = elapsedNs / iters;
    return { label, opsPerSec, meanNs, iters };
}

/** @param {{label:string,opsPerSec:number,meanNs:number}} r */
function fmt(r) {
    const ops = r.opsPerSec >= 1e6
        ? `${(r.opsPerSec / 1e6).toFixed(2)}M`
        : r.opsPerSec >= 1e3
            ? `${(r.opsPerSec / 1e3).toFixed(1)}K`
            : r.opsPerSec.toFixed(0);
    const lat = r.meanNs >= 1e6
        ? `${(r.meanNs / 1e6).toFixed(3)} ms`
        : r.meanNs >= 1e3
            ? `${(r.meanNs / 1e3).toFixed(2)} µs`
            : `${r.meanNs.toFixed(0)} ns`;
    return `  ${r.label.padEnd(40)} ${ops.padStart(10)} ops/s   ${lat.padStart(12)}/op`;
}

/** Build a random n×n matrix (deterministic LCG so runs are comparable). */
let seed = 123456789;
function rand() {
    seed = (1103515245 * seed + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
}
function randMatrix(n) {
    return Array.from({ length: n }, () => Array.from({ length: n }, () => rand() * 2 - 1));
}

console.log('\n=== Professional Calculator — Scientific Engine Benchmarks ===\n');
console.log('Node', process.version, '| platform', process.platform, '\n');

const ast = parse('sin(pi/4)^2 + cos(pi/4)^2 + 3*x^2 - log(8,2)');
const results = [
    bench('parser: tokenize+parse (medium expr)', () => parse('sin(pi/4)^2 + cos(pi/4)^2 + 3*x^2')),
    bench('parser: evaluate cached AST', () => evaluate(ast, { x: 1.5 })),
    bench('special: gamma(7.3)', () => gamma(7.3)),
    bench('stats: normalCdf(1.3)', () => normalCdf(1.3)),
    bench('stats: normalQuantile(0.975)', () => normalQuantile(0.975)),
    bench('finance: Black–Scholes', () => blackScholes(100, 100, 0.05, 0.2, 1)),
    bench('calculus: ∫₀^π sin (adaptive)', () => Cal.integrate(Math.sin, 0, Math.PI)),
    bench('calculus: Brent root x=cos(x)', () => Cal.brent((x) => x - Math.cos(x), 0, 1)),
    bench('calculus: RK4 100 steps', () => Cal.rk4((t, y) => [y[0]], 0, 1, [1], 100)),
];
console.log('Operation throughput');
console.log('─'.repeat(72));
for (const r of results) console.log(fmt(r));

console.log('\nO(n³) kernel scaling (mean latency should ~8× per doubling of n)');
console.log('─'.repeat(72));
for (const n of [8, 16, 32, 64]) {
    const A = randMatrix(n);
    const B = randMatrix(n);
    const sym = M.add(A, M.transpose(A));
    const r1 = bench(`matrix mul ${n}×${n}`, () => M.mul(A, B), 150);
    const r2 = bench(`determinant ${n}×${n}`, () => M.det(A), 150);
    const r3 = bench(`eig (symmetric) ${n}×${n}`, () => M.eigSymmetric(sym), 150);
    console.log(fmt(r1));
    console.log(fmt(r2));
    console.log(fmt(r3));
    console.log('');
}

console.log('Done. (Numbers are machine-dependent; use for relative comparison.)\n');
