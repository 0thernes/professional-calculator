// @ts-check
/**
 * Advanced matrix decompositions.
 *
 * `matrix.js` already provides LU, QR, and the symmetric/general eigensolvers;
 * this module adds the factorizations that underpin least-squares, PCA, and
 * low-rank work:
 *
 * - {@link cholesky} — `A = L·Lᵀ` for a symmetric positive-definite matrix.
 * - {@link svd} — the singular value decomposition `A = U·diag(S)·Vᵀ` by the
 *   one-sided (Hestenes) Jacobi method; works for any shape.
 * - {@link singularValues}, {@link conditionNumber}.
 * - {@link pseudoInverse} — the Moore–Penrose inverse `A⁺` via the SVD.
 * - {@link lstsq} — the minimum-norm least-squares solution of `A·x = b`.
 *
 * Matrices are `number[][]` (row-major), the same as {@link module:math/matrix}.
 * Nothing mutates its inputs.
 *
 * @module math/decomposition
 */

import { transpose, identity, isSymmetric } from './matrix.js';

/** @typedef {number[][]} Matrix */
/** @typedef {{ U: number[][], S: number[], V: number[][] }} SVD */

/* ------------------------------------------------------------------ *
 *  Cholesky factorization
 * ------------------------------------------------------------------ */

/**
 * Cholesky factorization of a symmetric positive-definite matrix:
 * returns the lower-triangular `L` with `L·Lᵀ = A`.
 * @param {Matrix} A
 * @returns {number[][]}
 * @throws {RangeError} if `A` is not square, not symmetric, or not positive-definite
 */
export function cholesky(A) {
    const n = A.length;
    if (n === 0 || A[0].length !== n) {
        throw new RangeError('Cholesky requires a square matrix');
    }
    if (!isSymmetric(A)) throw new RangeError('Cholesky requires a symmetric matrix');
    const L = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            let sum = A[i][j];
            for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k];
            if (i === j) {
                if (sum <= 0) throw new RangeError('matrix is not positive-definite');
                L[i][j] = Math.sqrt(sum);
            } else {
                L[i][j] = sum / L[j][j];
            }
        }
    }
    return L;
}

/* ------------------------------------------------------------------ *
 *  Singular value decomposition — one-sided Jacobi
 * ------------------------------------------------------------------ */

/**
 * Singular value decomposition `A = U·diag(S)·Vᵀ` via the one-sided Jacobi
 * (Hestenes) method. `S` is returned in descending order; `U` is m×k and `V`
 * is n×k for an m×n input with k = min(m, n) (thin SVD). Both `U` and `V` have
 * orthonormal columns.
 * @param {Matrix} A
 * @param {{ tol?: number, maxSweeps?: number }} [opts]
 * @returns {SVD}
 */
export function svd(A, opts = {}) {
    const m0 = A.length;
    const n0 = m0 ? A[0].length : 0;
    if (m0 === 0 || n0 === 0) throw new RangeError('svd requires a non-empty matrix');

    // The column-rotation method needs (rows ≥ cols); transpose when it isn't
    // and swap U/V on the way out.
    const transposed = m0 < n0;
    const src = transposed ? transpose(A) : A;
    const m = src.length;
    const n = src[0].length;
    const tol = opts.tol ?? 1e-14;
    const maxSweeps = opts.maxSweeps ?? 60;

    const U = src.map((row) => row.slice()); // m×n working copy
    const V = identity(n); // n×n

    for (let sweep = 0; sweep < maxSweeps; sweep++) {
        let off = 0;
        for (let i = 0; i < n - 1; i++) {
            for (let j = i + 1; j < n; j++) {
                let alpha = 0;
                let beta = 0;
                let gamma = 0;
                for (let k = 0; k < m; k++) {
                    alpha += U[k][i] * U[k][i];
                    beta += U[k][j] * U[k][j];
                    gamma += U[k][i] * U[k][j];
                }
                const scale = Math.sqrt(alpha * beta) || 1;
                off = Math.max(off, Math.abs(gamma) / scale);
                if (Math.abs(gamma) <= tol * Math.sqrt(alpha * beta)) continue;

                // Jacobi rotation that orthogonalizes columns i, j.
                const zeta = (beta - alpha) / (2 * gamma);
                const sgn = zeta >= 0 ? 1 : -1; // sign(0) → +1 so ζ=0 rotates 45°
                const t = sgn / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta));
                const c = 1 / Math.sqrt(1 + t * t);
                const s = c * t;

                for (let k = 0; k < m; k++) {
                    const ui = U[k][i];
                    const uj = U[k][j];
                    U[k][i] = c * ui - s * uj;
                    U[k][j] = s * ui + c * uj;
                }
                for (let k = 0; k < n; k++) {
                    const vi = V[k][i];
                    const vj = V[k][j];
                    V[k][i] = c * vi - s * vj;
                    V[k][j] = s * vi + c * vj;
                }
            }
        }
        if (off < tol) break;
    }

    // Singular values are the norms of the (now orthogonal) columns of U.
    const sigma = new Array(n);
    for (let i = 0; i < n; i++) {
        let nrm = 0;
        for (let k = 0; k < m; k++) nrm += U[k][i] * U[k][i];
        sigma[i] = Math.sqrt(nrm);
        if (sigma[i] > tol) {
            for (let k = 0; k < m; k++) U[k][i] /= sigma[i];
        }
    }

    // Sort singular values (and the matching columns) in descending order.
    const order = sigma.map((_, i) => i).sort((p, q) => sigma[q] - sigma[p]);
    const S = order.map((i) => sigma[i]);
    const Us = U.map((row) => order.map((i) => row[i]));
    const Vs = V.map((row) => order.map((i) => row[i]));

    return transposed ? { U: Vs, S, V: Us } : { U: Us, S, V: Vs };
}

/**
 * Singular values of `A` in descending order.
 * @param {Matrix} A
 * @returns {number[]}
 */
export function singularValues(A) {
    return svd(A).S;
}

/**
 * 2-norm condition number σ_max / σ_min (∞ for a singular matrix).
 * @param {Matrix} A
 * @returns {number}
 */
export function conditionNumber(A) {
    const S = svd(A).S;
    const smin = S[S.length - 1];
    return smin === 0 ? Infinity : S[0] / smin;
}

/* ------------------------------------------------------------------ *
 *  Pseudoinverse & least squares
 * ------------------------------------------------------------------ */

/**
 * Moore–Penrose pseudoinverse `A⁺` via the SVD: `A⁺ = V·diag(1/σ)·Uᵀ`, where
 * singular values at or below `tol` are treated as zero. `tol` defaults to a
 * relative threshold scaled by the largest singular value and the dimensions.
 * @param {Matrix} A
 * @param {number} [tol]
 * @returns {number[][]}
 */
export function pseudoInverse(A, tol) {
    const { U, S, V } = svd(A);
    const k = S.length;
    const m = U.length;
    const n = V.length;
    const eps = tol ?? Math.max(m, n) * (S[0] || 0) * 1e-15;
    const Sinv = S.map((s) => (s > eps ? 1 / s : 0));
    const Ap = Array.from({ length: n }, () => new Array(m).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            let sum = 0;
            for (let r = 0; r < k; r++) sum += V[i][r] * Sinv[r] * U[j][r];
            Ap[i][j] = sum;
        }
    }
    return Ap;
}

/**
 * Minimum-norm least-squares solution of `A·x = b` (over- or under-determined),
 * computed as `x = A⁺·b`.
 * @param {Matrix} A
 * @param {ReadonlyArray<number>} b
 * @returns {number[]}
 */
export function lstsq(A, b) {
    if (b.length !== A.length) throw new RangeError('RHS length must equal the number of rows');
    const Ap = pseudoInverse(A);
    return Ap.map((row) => row.reduce((acc, v, i) => acc + v * b[i], 0));
}
