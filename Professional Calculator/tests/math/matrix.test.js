/**
 * @jest-environment node
 */
import {
    identity, zeros, diag, add, sub, scale, mul, matvec, transpose,
    trace, det, solve, inv, rank, normFro, norm1, normInf, qr,
    eigSymmetric, eigenvalues, isSymmetric,
} from '../../math/matrix.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-9) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);
/** @param {number[][]} A @param {number[][]} B */
const nearM = (A, B, eps = 1e-9) => {
    expect(A.length).toBe(B.length);
    for (let i = 0; i < A.length; i++)
        for (let j = 0; j < A[i].length; j++) near(A[i][j], B[i][j], eps);
};

describe('matrix — construction', () => {
    test('identity', () => nearM(identity(2), [[1, 0], [0, 1]]));
    test('diag', () => nearM(diag([1, 2, 3]), [[1, 0, 0], [0, 2, 0], [0, 0, 3]]));
    test('zeros shape', () => expect(zeros(2, 3)).toEqual([[0, 0, 0], [0, 0, 0]]));
});

describe('matrix — algebra', () => {
    test('add/sub', () => {
        nearM(add([[1, 2]], [[3, 4]]), [[4, 6]]);
        nearM(sub([[3, 4]], [[1, 1]]), [[2, 3]]);
    });
    test('scale', () => nearM(scale([[1, 2]], 3), [[3, 6]]));
    test('product 2×2', () => nearM(mul([[1, 2], [3, 4]], [[5, 6], [7, 8]]), [[19, 22], [43, 50]]));
    test('product non-square', () => nearM(mul([[1, 2, 3]], [[1], [0], [1]]), [[4]]));
    test('incompatible product throws', () => expect(() => mul([[1, 2]], [[1, 2]])).toThrow(RangeError));
    test('matvec', () => expect(matvec([[1, 2], [3, 4]], [1, 1])).toEqual([3, 7]));
    test('transpose', () => nearM(transpose([[1, 2, 3], [4, 5, 6]]), [[1, 4], [2, 5], [3, 6]]));
    test('trace', () => near(trace([[1, 9], [9, 5]]), 6));
    test('A·I = A', () => nearM(mul([[2, 3], [4, 5]], identity(2)), [[2, 3], [4, 5]]));
});

describe('matrix — determinant', () => {
    test('det 1×1', () => near(det([[7]]), 7));
    test('det 2×2 = ad-bc', () => near(det([[1, 2], [3, 4]]), -2));
    test('det identity = 1', () => near(det(identity(4)), 1));
    test('det diagonal = product', () => near(det(diag([2, 3, 4])), 24));
    test('det singular = 0', () => near(det([[1, 2], [2, 4]]), 0));
    test('det 3×3 (known)', () => near(det([[6, 1, 1], [4, -2, 5], [2, 8, 7]]), -306));
    test('det(AB) = det(A)det(B)', () => {
        const A = [[1, 2], [3, 5]];
        const B = [[2, 0], [1, 3]];
        near(det(mul(A, B)), det(A) * det(B));
    });
});

describe('matrix — solve & inverse', () => {
    test('solve 2×2 system', () => {
        const x = solve([[2, 1], [1, 3]], [3, 5]);
        near(x[0], 0.8);
        near(x[1], 1.4);
    });
    test('solve 3×3 system (verify residual)', () => {
        const A = [[3, 2, -1], [2, -2, 4], [-1, 0.5, -1]];
        const b = [1, -2, 0];
        const x = solve(A, b);
        const r = matvec(A, x);
        nearM([r], [b], 1e-9);
    });
    test('inverse of [[4,7],[2,6]]', () => {
        nearM(inv([[4, 7], [2, 6]]), [[0.6, -0.7], [-0.2, 0.4]]);
    });
    test('A·inv(A) = I', () => {
        const A = [[4, 3, 2], [1, 1, 1], [2, 0, 5]];
        nearM(mul(A, inv(A)), identity(3), 1e-9);
    });
    test('singular inverse throws', () => expect(() => inv([[1, 2], [2, 4]])).toThrow(RangeError));
});

describe('matrix — rank & norms', () => {
    test('full rank', () => expect(rank([[1, 0], [0, 1]])).toBe(2));
    test('rank-deficient', () => expect(rank([[1, 2], [2, 4]])).toBe(1));
    test('rank of 3×3 with dependent row', () => expect(rank([[1, 2, 3], [4, 5, 6], [7, 8, 9]])).toBe(2));
    test('Frobenius norm', () => near(normFro([[3, 0], [0, 4]]), 5));
    test('1-norm (max col sum)', () => near(norm1([[1, -7], [2, 3]]), 10));
    test('∞-norm (max row sum)', () => near(normInf([[1, -7], [2, 3]]), 8));
});

describe('matrix — QR (Householder)', () => {
    test('Q·R = A', () => {
        const A = [[12, -51, 4], [6, 167, -68], [-4, 24, -41]];
        const { Q, R } = qr(A);
        nearM(mul(Q, R), A, 1e-8);
    });
    test('Q orthogonal (QᵀQ = I)', () => {
        const A = [[12, -51, 4], [6, 167, -68], [-4, 24, -41]];
        const { Q } = qr(A);
        nearM(mul(transpose(Q), Q), identity(3), 1e-9);
    });
    test('R upper triangular', () => {
        const { R } = qr([[1, 2], [3, 4], [5, 6]]);
        near(R[1][0], 0);
    });
});

describe('matrix — symmetric eigenproblem (Jacobi)', () => {
    test('diagonal eigenvalues', () => {
        const { values } = eigSymmetric(diag([5, 1, 3]));
        nearM([values], [[1, 3, 5]]);
    });
    test('[[2,1],[1,2]] → {1,3}', () => {
        const { values } = eigSymmetric([[2, 1], [1, 2]]);
        near(values[0], 1);
        near(values[1], 3);
    });
    test('eigenvectors satisfy A v = λ v', () => {
        const A = [[2, 1], [1, 2]];
        const { values, vectors } = eigSymmetric(A);
        for (let k = 0; k < 2; k++) {
            const v = vectors.map((row) => row[k]);
            const Av = matvec(A, v);
            const lv = v.map((x) => x * values[k]);
            nearM([Av], [lv], 1e-8);
        }
    });
    test('sum of eigenvalues = trace, product = det', () => {
        const A = [[4, 1, 2], [1, 5, 3], [2, 3, 6]];
        const { values } = eigSymmetric(A);
        near(values.reduce((a, b) => a + b, 0), trace(A));
        near(values.reduce((a, b) => a * b, 1), det(A), 1e-7);
    });
    test('isSymmetric detection', () => {
        expect(isSymmetric([[1, 2], [2, 1]])).toBe(true);
        expect(isSymmetric([[1, 2], [3, 1]])).toBe(false);
    });
});

describe('matrix — general eigenvalues (QR iteration)', () => {
    const sortByReIm = (/** @type {{re:number,im:number}[]} */ arr) =>
        [...arr].sort((a, b) => a.re - b.re || a.im - b.im);

    test('triangular → diagonal entries', () => {
        const ev = sortByReIm(eigenvalues([[2, 5, 1], [0, 3, 7], [0, 0, 4]]));
        near(ev[0].re, 2); near(ev[1].re, 3); near(ev[2].re, 4);
        ev.forEach((z) => near(z.im, 0));
    });
    test('rotation [[0,-1],[1,0]] → ±i', () => {
        const ev = sortByReIm(eigenvalues([[0, -1], [1, 0]]));
        near(ev[0].re, 0, 1e-7); near(ev[0].im, -1, 1e-7);
        near(ev[1].re, 0, 1e-7); near(ev[1].im, 1, 1e-7);
    });
    test('[[2,-1],[1,2]] → 2±i', () => {
        const ev = sortByReIm(eigenvalues([[2, -1], [1, 2]]));
        near(ev[0].re, 2, 1e-7); near(ev[0].im, -1, 1e-7);
        near(ev[1].re, 2, 1e-7); near(ev[1].im, 1, 1e-7);
    });
    test('sum of eigenvalues = trace (real 3×3)', () => {
        const A = [[4, 1, 0], [1, 3, 1], [0, 1, 2]]; // symmetric but routed generally too
        const ev = eigenvalues(A);
        const sumRe = ev.reduce((a, z) => a + z.re, 0);
        near(sumRe, trace(A), 1e-6);
    });
});
