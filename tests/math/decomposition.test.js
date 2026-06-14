/**
 * @jest-environment node
 */
import {
    cholesky, svd, singularValues, conditionNumber, pseudoInverse, lstsq,
} from '../../math/decomposition.js';
import { mul, transpose, inv } from '../../math/matrix.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-9) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

/** @param {number[][]} A @param {number[][]} B */
const nearMat = (A, B, eps = 1e-8) => {
    expect(A.length).toBe(B.length);
    A.forEach((row, i) => {
        expect(row.length).toBe(B[i].length);
        row.forEach((v, j) => near(v, B[i][j], eps));
    });
};

/** Reconstruct U·diag(S)·Vᵀ. @param {{U:number[][],S:number[],V:number[][]}} d */
const reconstruct = ({ U, S, V }) => {
    const Sd = S.map((s, i) => S.map((_, j) => (i === j ? s : 0)));
    return mul(mul(U, Sd), transpose(V));
};

describe('decomposition — Cholesky', () => {
    test('[[4,2],[2,3]] → L = [[2,0],[1,√2]]', () => {
        const L = cholesky([[4, 2], [2, 3]]);
        nearMat(L, [[2, 0], [1, Math.SQRT2]]);
    });
    test('L·Lᵀ reconstructs A', () => {
        const A = [[25, 15, -5], [15, 18, 0], [-5, 0, 11]];
        const L = cholesky(A);
        nearMat(mul(L, transpose(L)), A);
    });
    test('identity → identity', () => nearMat(cholesky([[1, 0], [0, 1]]), [[1, 0], [0, 1]]));
    test('rejects non-positive-definite', () =>
        expect(() => cholesky([[1, 2], [2, 1]])).toThrow(RangeError));
    test('rejects non-symmetric', () =>
        expect(() => cholesky([[4, 2], [0, 3]])).toThrow(RangeError));
});

describe('decomposition — SVD', () => {
    test('singular values of a diagonal matrix are |diag|, sorted desc', () => {
        const s = singularValues([[3, 0, 0], [0, -1, 0], [0, 0, 2]]);
        s.forEach((v, i) => near(v, [3, 2, 1][i]));
    });
    test('identity → all singular values 1', () =>
        singularValues([[1, 0], [0, 1]]).forEach((v) => near(v, 1)));
    test('reconstructs a square matrix', () => {
        const A = [[1, 2], [3, 4]];
        nearMat(reconstruct(svd(A)), A);
    });
    test('reconstructs a tall matrix (m > n)', () => {
        const A = [[1, 0], [0, 1], [1, 1]];
        nearMat(reconstruct(svd(A)), A);
    });
    test('reconstructs a wide matrix (m < n)', () => {
        const A = [[1, 2, 3], [4, 5, 6]];
        nearMat(reconstruct(svd(A)), A);
    });
    test('U and V have orthonormal columns', () => {
        const { U, V } = svd([[2, 1], [1, 2], [0, 1]]);
        const I2 = [[1, 0], [0, 1]];
        nearMat(mul(transpose(U), U), I2);
        nearMat(mul(transpose(V), V), I2);
    });
    test('singular values are non-negative and descending', () => {
        const s = singularValues([[4, 1, 2], [0, 3, 1], [1, 1, 5]]);
        for (let i = 1; i < s.length; i++) {
            expect(s[i]).toBeLessThanOrEqual(s[i - 1] + 1e-12);
            expect(s[i]).toBeGreaterThanOrEqual(-1e-12);
        }
    });
    test('largest singular value equals the spectral norm of a symmetric matrix', () => {
        // eigenvalues of [[2,0],[0,3]] are 2,3 → σ_max = 3
        near(singularValues([[2, 0], [0, 3]])[0], 3);
    });
});

describe('decomposition — condition number', () => {
    test('identity → 1', () => near(conditionNumber([[1, 0], [0, 1]]), 1));
    test('diag(1,100) → 100', () => near(conditionNumber([[1, 0], [0, 100]]), 100, 1e-6));
    test('singular matrix → ∞', () =>
        expect(conditionNumber([[1, 2], [2, 4]])).toBe(Infinity));
});

describe('decomposition — pseudoinverse', () => {
    test('equals the true inverse for an invertible matrix', () => {
        const A = [[1, 2], [3, 4]];
        nearMat(pseudoInverse(A), inv(A), 1e-7);
    });
    test('satisfies the Moore–Penrose identity A·A⁺·A = A', () => {
        const A = [[1, 0], [0, 1], [1, 1]];
        const Ap = pseudoInverse(A);
        nearMat(mul(mul(A, Ap), A), A, 1e-7);
    });
    test('A⁺·A = I for a full-column-rank tall matrix', () => {
        const A = [[1, 0], [0, 1], [1, 1]];
        nearMat(mul(pseudoInverse(A), A), [[1, 0], [0, 1]], 1e-7);
    });
});

describe('decomposition — least squares', () => {
    test('exact fit of collinear points (1,1),(2,2),(3,3) → intercept 0, slope 1', () => {
        const A = [[1, 1], [1, 2], [1, 3]];
        const x = lstsq(A, [1, 2, 3]);
        near(x[0], 0, 1e-7);
        near(x[1], 1, 1e-7);
    });
    test('square exact system', () => {
        const x = lstsq([[2, 0], [0, 3]], [4, 9]);
        near(x[0], 2); near(x[1], 3);
    });
    test('best-fit slope/intercept for noisy points', () => {
        // y ≈ 2x + 1 through (0,1.1),(1,2.9),(2,5.2),(3,6.8)
        const A = [[1, 0], [1, 1], [1, 2], [1, 3]];
        const x = lstsq(A, [1.1, 2.9, 5.2, 6.8]);
        expect(Math.abs(x[0] - 1)).toBeLessThan(0.3);
        expect(Math.abs(x[1] - 2)).toBeLessThan(0.3);
    });
    test('RHS length mismatch throws', () =>
        expect(() => lstsq([[1, 2], [3, 4]], [1, 2, 3])).toThrow(RangeError));
});
