/**
 * @jest-environment node
 *
 * Property-based / invariant tests. Rather than checking one closed-form value,
 * each test draws many random inputs (from the seeded {@link Rng}, so runs are
 * fully reproducible) and asserts a mathematical invariant that must hold for
 * all of them. This catches edge cases the fixed anchors don't reach.
 */
import { Rng } from '../../math/random.js';
import * as G from '../../math/geometry.js';
import * as Sig from '../../math/signal.js';
import * as Interp from '../../math/interpolate.js';
import * as M from '../../math/matrix.js';
import * as D from '../../math/decomposition.js';
import * as CB from '../../math/combinatorics.js';
import { combinations } from '../../math/special.js';
import { gcd, modInverse } from '../../math/numtheory.js';
import * as Coord from '../../math/coordinates.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ eps) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

/** @param {Rng} rng @param {number} n @param {number} [lo] @param {number} [hi] */
const vecOf = (rng, n, lo = -5, hi = 5) => Array.from({ length: n }, () => rng.uniform(lo, hi));
/** @param {Rng} rng @param {number} r @param {number} c @param {number} [lo] @param {number} [hi] */
const matOf = (rng, r, c, lo = -3, hi = 3) =>
    Array.from({ length: r }, () => Array.from({ length: c }, () => rng.uniform(lo, hi)));
/** Diagonally dominant (well-conditioned, invertible) n×n matrix. @param {Rng} rng @param {number} n */
const ddMatrix = (rng, n) => {
    const A = matOf(rng, n, n);
    for (let i = 0; i < n; i++) A[i][i] += n * 3; // dominate the diagonal
    return A;
};

const TRIALS = 40;

describe('properties — geometry', () => {
    test('triangle inequality ‖a+b‖ ≤ ‖a‖+‖b‖', () => {
        const rng = new Rng(1001);
        for (let t = 0; t < TRIALS; t++) {
            const a = vecOf(rng, 3);
            const b = vecOf(rng, 3);
            expect(G.norm(G.add(a, b))).toBeLessThanOrEqual(G.norm(a) + G.norm(b) + 1e-9);
        }
    });
    test('Cauchy–Schwarz |a·b| ≤ ‖a‖‖b‖', () => {
        const rng = new Rng(1002);
        for (let t = 0; t < TRIALS; t++) {
            const a = vecOf(rng, 4);
            const b = vecOf(rng, 4);
            expect(Math.abs(G.dot(a, b))).toBeLessThanOrEqual(G.norm(a) * G.norm(b) + 1e-9);
        }
    });
    test('cross product is orthogonal to both operands', () => {
        const rng = new Rng(1003);
        for (let t = 0; t < TRIALS; t++) {
            const a = vecOf(rng, 3);
            const b = vecOf(rng, 3);
            const c = G.cross(a, b);
            near(G.dot(c, a), 0, 1e-9);
            near(G.dot(c, b), 0, 1e-9);
        }
    });
    test('3-D rotation preserves length', () => {
        const rng = new Rng(1004);
        for (let t = 0; t < TRIALS; t++) {
            const v = vecOf(rng, 3);
            const axis = vecOf(rng, 3, -1, 1);
            if (G.norm(axis) < 1e-6) continue;
            near(G.norm(G.rotate3D(v, axis, rng.uniform(0, Math.PI))), G.norm(v), 1e-9);
        }
    });
});

describe('properties — signal', () => {
    test('ifft(fft(x)) ≈ x for power-of-two lengths', () => {
        const rng = new Rng(2001);
        for (const n of [4, 8, 16, 32]) {
            const x = vecOf(rng, n);
            const back = Sig.ifft(Sig.fft(x)).map((z) => z.re);
            x.forEach((v, i) => near(back[i], v, 1e-8));
        }
    });
    test('ifft(fft(x)) ≈ x for non-power-of-two lengths (Bluestein)', () => {
        const rng = new Rng(2002);
        for (const n of [3, 5, 7, 12, 17]) {
            const x = vecOf(rng, n);
            const back = Sig.ifft(Sig.fft(x)).map((z) => z.re);
            x.forEach((v, i) => near(back[i], v, 1e-7));
        }
    });
    test("Parseval: Σ|x|² = (1/N)Σ|X|²", () => {
        const rng = new Rng(2003);
        for (let t = 0; t < 20; t++) {
            const x = vecOf(rng, 16);
            const timeE = x.reduce((s, v) => s + v * v, 0);
            const freqE = Sig.powerSpectrum(Sig.fft(x)).reduce((s, v) => s + v, 0) / x.length;
            near(timeE, freqE, 1e-6 * (1 + timeE));
        }
    });
});

describe('properties — interpolation', () => {
    test('polyfit recovers random quadratic coefficients', () => {
        const rng = new Rng(3001);
        const xs = [-2, -1, 0, 1, 2];
        for (let t = 0; t < TRIALS; t++) {
            const c = vecOf(rng, 3, -4, 4); // [c0,c1,c2]
            const ys = xs.map((x) => c[0] + c[1] * x + c[2] * x * x);
            const fit = Interp.polyfit(xs, ys, 2);
            c.forEach((ci, i) => near(fit[i], ci, 1e-6));
        }
    });
    test('Lagrange interpolant passes through its nodes', () => {
        const rng = new Rng(3002);
        for (let t = 0; t < 20; t++) {
            const xs = [0, 1, 2, 3, 4];
            const ys = vecOf(rng, 5);
            const f = Interp.lagrange(xs, ys);
            xs.forEach((x, i) => near(f(x), ys[i], 1e-7));
        }
    });
});

describe('properties — linear algebra & decompositions', () => {
    test('det(A·B) = det(A)·det(B)', () => {
        const rng = new Rng(4001);
        for (let t = 0; t < TRIALS; t++) {
            const A = matOf(rng, 3, 3);
            const B = matOf(rng, 3, 3);
            const lhs = M.det(M.mul(A, B));
            const rhs = M.det(A) * M.det(B);
            near(lhs, rhs, 1e-6 * (1 + Math.abs(rhs)));
        }
    });
    test('A·solve(A,b) = b for well-conditioned A', () => {
        const rng = new Rng(4002);
        for (let t = 0; t < TRIALS; t++) {
            const n = 3 + (t % 3);
            const A = ddMatrix(rng, n);
            const b = vecOf(rng, n);
            const x = M.solve(A, b);
            const Ax = M.matvec(A, x);
            Ax.forEach((v, i) => near(v, b[i], 1e-7 * (1 + Math.abs(b[i]))));
        }
    });
    test('SVD reconstructs A = U·diag(S)·Vᵀ', () => {
        const rng = new Rng(4003);
        for (let t = 0; t < 25; t++) {
            const r = 2 + (t % 3);
            const c = 2 + ((t + 1) % 3);
            const A = matOf(rng, r, c);
            const { U, S, V } = D.svd(A);
            const Sd = S.map((s, i) => S.map((_, j) => (i === j ? s : 0)));
            const rec = M.mul(M.mul(U, Sd), M.transpose(V));
            for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) near(rec[i][j], A[i][j], 1e-7);
        }
    });
    test('Moore–Penrose identity A·A⁺·A = A', () => {
        const rng = new Rng(4004);
        for (let t = 0; t < 20; t++) {
            const A = matOf(rng, 4, 3);
            const Ap = D.pseudoInverse(A);
            const rec = M.mul(M.mul(A, Ap), A);
            for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) near(rec[i][j], A[i][j], 1e-6);
        }
    });
    test('Cholesky of MMᵀ+nI reconstructs that SPD matrix', () => {
        const rng = new Rng(4005);
        for (let t = 0; t < 20; t++) {
            const n = 3;
            const Mr = matOf(rng, n, n);
            const spd = M.add(M.mul(Mr, M.transpose(Mr)), M.scale(M.identity(n), n));
            const L = D.cholesky(spd);
            const rec = M.mul(L, M.transpose(L));
            for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) near(rec[i][j], spd[i][j], 1e-7 * (1 + Math.abs(spd[i][j])));
        }
    });
});

describe('properties — combinatorics identities', () => {
    test('Σₖ Stirling2(n,k) = Bell(n)', () => {
        for (let n = 0; n <= 9; n++) {
            let sum = 0n;
            for (let k = 0; k <= n; k++) sum += CB.stirlingSecondBig(n, k);
            expect(sum).toBe(CB.bellBig(n));
        }
    });
    test('Σₖ unsigned Stirling1(n,k) = n!', () => {
        for (let n = 0; n <= 9; n++) {
            let sum = 0n;
            for (let k = 0; k <= n; k++) sum += CB.stirlingFirstBig(n, k);
            expect(sum).toBe(CB.factorialBig(n));
        }
    });
    test('Σₖ C(n,k) = 2ⁿ', () => {
        for (let n = 0; n <= 12; n++) {
            let sum = 0;
            for (let k = 0; k <= n; k++) sum += combinations(n, k);
            expect(sum).toBe(2 ** n);
        }
    });
});

describe('properties — number theory', () => {
    test('a·modInverse(a,p) ≡ 1 (mod p) for prime p', () => {
        const rng = new Rng(5001);
        const primes = [7, 11, 13, 17, 101, 9973];
        for (const p of primes) {
            for (let t = 0; t < 10; t++) {
                const a = rng.int(1, p - 1);
                const inv = modInverse(a, p);
                expect(((a * inv) % p + p) % p).toBe(1);
            }
        }
    });
    test('gcd divides both arguments', () => {
        const rng = new Rng(5002);
        for (let t = 0; t < TRIALS; t++) {
            const a = rng.int(1, 10000);
            const b = rng.int(1, 10000);
            const g = gcd(a, b);
            expect(a % g).toBe(0);
            expect(b % g).toBe(0);
        }
    });
});

describe('properties — coordinates round-trips', () => {
    test('cartesian → spherical → cartesian', () => {
        const rng = new Rng(6001);
        for (let t = 0; t < TRIALS; t++) {
            const p = vecOf(rng, 3);
            const s = Coord.cartesianToSpherical(p[0], p[1], p[2]);
            const back = Coord.sphericalToCartesian(s.r, s.theta, s.phi);
            p.forEach((v, i) => near(back[i], v, 1e-9));
        }
    });
    test('cartesian → cylindrical → cartesian', () => {
        const rng = new Rng(6002);
        for (let t = 0; t < TRIALS; t++) {
            const p = vecOf(rng, 3);
            const c = Coord.cartesianToCylindrical(p[0], p[1], p[2]);
            const back = Coord.cylindricalToCartesian(c.rho, c.phi, c.z);
            p.forEach((v, i) => near(back[i], v, 1e-9));
        }
    });
});
