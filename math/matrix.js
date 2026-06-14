// @ts-check
/**
 * Dense linear algebra over the reals.
 *
 * A matrix is a `number[][]` in row-major order; a vector is a `number[]`.
 * All operations are pure (inputs are never mutated). The heavy routines use
 * the standard, numerically-stable algorithms:
 *
 *  - {@link lu}      LU with partial pivoting — O(n³)
 *  - {@link det}     determinant via LU — O(n³)
 *  - {@link solve}   forward/back substitution on the LU factors — O(n²) per RHS
 *  - {@link inv}     solve against the identity — O(n³)
 *  - {@link rank}    Gaussian elimination with tolerance — O(n³)
 *  - {@link qr}      Householder QR — O(n³), Q orthogonal to machine ε
 *  - {@link eigSymmetric}  cyclic Jacobi — O(n³) per sweep, quadratic
 *                          convergence; returns values AND orthonormal vectors
 *  - {@link eigenvalues}   general real matrices: Hessenberg reduction +
 *                          shifted QR iteration, eigenvalues read from the
 *                          1×1 and 2×2 blocks of the real Schur form (the
 *                          2×2 blocks yield genuine complex-conjugate pairs)
 *
 * @module math/matrix
 */

import { complex } from './complex.js';

/** @typedef {number[][]} Matrix */
/** @typedef {number[]} Vec */
/** @typedef {import('./complex.js').Complex} Complex */

/* ------------------------------------------------------------------ *
 *  Construction & shape
 * ------------------------------------------------------------------ */

/** @param {Matrix} A @returns {number} */
export function rows(A) {
    return A.length;
}
/** @param {Matrix} A @returns {number} */
export function cols(A) {
    return A.length === 0 ? 0 : A[0].length;
}

/**
 * Validate rectangularity and throw otherwise. Returns [r, c].
 * @param {Matrix} A
 * @returns {[number, number]}
 */
export function shape(A) {
    const r = A.length;
    const c = r === 0 ? 0 : A[0].length;
    for (let i = 0; i < r; i++) {
        if (A[i].length !== c) throw new RangeError('Ragged matrix: rows differ in length');
    }
    return [r, c];
}

/** @param {Matrix} A @returns {Matrix} */
export function clone(A) {
    return A.map((row) => row.slice());
}

/** @param {number} n @returns {Matrix} */
export function identity(n) {
    const M = zeros(n, n);
    for (let i = 0; i < n; i++) M[i][i] = 1;
    return M;
}

/** @param {number} r @param {number} c @returns {Matrix} */
export function zeros(r, c) {
    return Array.from({ length: r }, () => new Array(c).fill(0));
}

/** Diagonal matrix from a vector. @param {Vec} d @returns {Matrix} */
export function diag(d) {
    const M = zeros(d.length, d.length);
    for (let i = 0; i < d.length; i++) M[i][i] = d[i];
    return M;
}

/* ------------------------------------------------------------------ *
 *  Elementwise & products
 * ------------------------------------------------------------------ */

/** @param {Matrix} A @param {Matrix} B @returns {Matrix} */
export function add(A, B) {
    sameShape(A, B);
    return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}
/** @param {Matrix} A @param {Matrix} B @returns {Matrix} */
export function sub(A, B) {
    sameShape(A, B);
    return A.map((row, i) => row.map((v, j) => v - B[i][j]));
}
/** @param {Matrix} A @param {number} s @returns {Matrix} */
export function scale(A, s) {
    return A.map((row) => row.map((v) => v * s));
}

/**
 * Matrix product A·B (naive O(n³), cache-friendly i-k-j order).
 * @param {Matrix} A
 * @param {Matrix} B
 * @returns {Matrix}
 */
export function mul(A, B) {
    const [ra, ca] = shape(A);
    const [rb, cb] = shape(B);
    if (ca !== rb) throw new RangeError(`Incompatible dims: ${ra}×${ca} · ${rb}×${cb}`);
    const C = zeros(ra, cb);
    for (let i = 0; i < ra; i++) {
        const Ai = A[i];
        const Ci = C[i];
        for (let k = 0; k < ca; k++) {
            const a = Ai[k];
            if (a === 0) continue;
            const Bk = B[k];
            for (let j = 0; j < cb; j++) Ci[j] += a * Bk[j];
        }
    }
    return C;
}

/** Matrix·vector. @param {Matrix} A @param {Vec} x @returns {Vec} */
export function matvec(A, x) {
    const [r, c] = shape(A);
    if (c !== x.length) throw new RangeError('Matrix·vector dimension mismatch');
    const y = new Array(r).fill(0);
    for (let i = 0; i < r; i++) {
        let s = 0;
        for (let j = 0; j < c; j++) s += A[i][j] * x[j];
        y[i] = s;
    }
    return y;
}

/** @param {Matrix} A @returns {Matrix} */
export function transpose(A) {
    const [r, c] = shape(A);
    const T = zeros(c, r);
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) T[j][i] = A[i][j];
    return T;
}

/** Sum of the diagonal. @param {Matrix} A @returns {number} */
export function trace(A) {
    const n = Math.min(rows(A), cols(A));
    let t = 0;
    for (let i = 0; i < n; i++) t += A[i][i];
    return t;
}

/* ------------------------------------------------------------------ *
 *  LU factorisation, determinant, solve, inverse
 * ------------------------------------------------------------------ */

/**
 * @typedef {object} LU
 * @property {Matrix} LU  Combined factors (L below diag with implicit unit
 *                        diagonal, U on/above the diagonal).
 * @property {number[]} piv  Row permutation (piv[i] is the source row).
 * @property {number} sign  Determinant sign of the permutation (±1).
 */

/**
 * LU decomposition with partial pivoting (Doolittle).
 * @param {Matrix} A
 * @returns {LU}
 */
export function lu(A) {
    const [n, m] = shape(A);
    if (n !== m) throw new RangeError('LU requires a square matrix');
    const M = clone(A);
    const piv = Array.from({ length: n }, (_, i) => i);
    let sign = 1;
    for (let k = 0; k < n; k++) {
        // partial pivot: largest |entry| in column k at/below the diagonal
        let p = k;
        let max = Math.abs(M[k][k]);
        for (let i = k + 1; i < n; i++) {
            const v = Math.abs(M[i][k]);
            if (v > max) { max = v; p = i; }
        }
        if (max === 0) continue; // singular column; det → 0
        if (p !== k) {
            [M[k], M[p]] = [M[p], M[k]];
            [piv[k], piv[p]] = [piv[p], piv[k]];
            sign = -sign;
        }
        const pivot = M[k][k];
        for (let i = k + 1; i < n; i++) {
            const f = M[i][k] / pivot;
            M[i][k] = f;
            for (let j = k + 1; j < n; j++) M[i][j] -= f * M[k][j];
        }
    }
    return { LU: M, piv, sign };
}

/**
 * Determinant via LU (product of U's diagonal × permutation sign).
 * @param {Matrix} A
 * @returns {number}
 */
export function det(A) {
    const [n, m] = shape(A);
    if (n !== m) throw new RangeError('Determinant requires a square matrix');
    if (n === 0) return 1;
    if (n === 1) return A[0][0];
    if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
    const { LU, sign } = lu(A);
    let d = sign;
    for (let i = 0; i < n; i++) d *= LU[i][i];
    return d;
}

/**
 * Solve A·x = b for one right-hand side using precomputed/internal LU.
 * @param {Matrix} A
 * @param {Vec} b
 * @returns {Vec}
 */
export function solve(A, b) {
    const [n] = shape(A);
    if (b.length !== n) throw new RangeError('RHS length mismatch');
    const { LU, piv } = lu(A);
    // permute b
    const y = new Array(n);
    for (let i = 0; i < n; i++) y[i] = b[piv[i]];
    // forward substitution (unit lower triangular)
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < i; j++) y[i] -= LU[i][j] * y[j];
    }
    // back substitution (upper triangular)
    for (let i = n - 1; i >= 0; i--) {
        for (let j = i + 1; j < n; j++) y[i] -= LU[i][j] * y[j];
        if (LU[i][i] === 0) throw new RangeError('Singular matrix: no unique solution');
        y[i] /= LU[i][i];
    }
    return y;
}

/**
 * Matrix inverse (solves against each column of the identity).
 * @param {Matrix} A
 * @returns {Matrix}
 */
export function inv(A) {
    const [n, m] = shape(A);
    if (n !== m) throw new RangeError('Inverse requires a square matrix');
    const { LU, piv } = lu(A);
    // detect singularity
    for (let i = 0; i < n; i++) if (LU[i][i] === 0) throw new RangeError('Matrix is singular');
    const inverse = zeros(n, n);
    const col = new Array(n);
    for (let c = 0; c < n; c++) {
        for (let i = 0; i < n; i++) col[i] = piv[i] === c ? 1 : 0;
        for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) col[i] -= LU[i][j] * col[j];
        for (let i = n - 1; i >= 0; i--) {
            for (let j = i + 1; j < n; j++) col[i] -= LU[i][j] * col[j];
            col[i] /= LU[i][i];
        }
        for (let i = 0; i < n; i++) inverse[i][c] = col[i];
    }
    return inverse;
}

/**
 * Numerical rank via Gaussian elimination with a relative tolerance.
 * @param {Matrix} A
 * @param {number} [tol]
 * @returns {number}
 */
export function rank(A, tol) {
    const M = clone(A);
    const [r, c] = shape(M);
    const eps = tol ?? 1e-12 * Math.max(r, c) * maxAbs(M);
    let rk = 0;
    const rowUsed = new Array(r).fill(false);
    for (let col = 0; col < c && rk < r; col++) {
        // find pivot row
        let p = -1;
        let max = eps;
        for (let i = 0; i < r; i++) {
            if (!rowUsed[i] && Math.abs(M[i][col]) > max) { max = Math.abs(M[i][col]); p = i; }
        }
        if (p === -1) continue;
        rowUsed[p] = true;
        rk++;
        const pivot = M[p][col];
        for (let i = 0; i < r; i++) {
            if (i === p) continue;
            const f = M[i][col] / pivot;
            if (f === 0) continue;
            for (let j = col; j < c; j++) M[i][j] -= f * M[p][j];
        }
    }
    return rk;
}

/* ------------------------------------------------------------------ *
 *  Norms
 * ------------------------------------------------------------------ */

/** Frobenius norm √Σaᵢⱼ². @param {Matrix} A @returns {number} */
export function normFro(A) {
    let s = 0;
    for (const row of A) for (const v of row) s += v * v;
    return Math.sqrt(s);
}
/** Max absolute column sum (induced 1-norm). @param {Matrix} A @returns {number} */
export function norm1(A) {
    const [r, c] = shape(A);
    let best = 0;
    for (let j = 0; j < c; j++) {
        let s = 0;
        for (let i = 0; i < r; i++) s += Math.abs(A[i][j]);
        best = Math.max(best, s);
    }
    return best;
}
/** Max absolute row sum (induced ∞-norm). @param {Matrix} A @returns {number} */
export function normInf(A) {
    let best = 0;
    for (const row of A) {
        let s = 0;
        for (const v of row) s += Math.abs(v);
        best = Math.max(best, s);
    }
    return best;
}

/* ------------------------------------------------------------------ *
 *  QR (Householder)
 * ------------------------------------------------------------------ */

/**
 * Householder QR: A = Q·R with Q orthogonal and R upper-triangular.
 * @param {Matrix} A
 * @returns {{ Q: Matrix, R: Matrix }}
 */
export function qr(A) {
    const [m, n] = shape(A);
    const R = clone(A);
    const Q = identity(m);
    const steps = Math.min(m - 1, n);
    for (let k = 0; k < steps; k++) {
        // Householder vector for column k below the diagonal
        let normx = 0;
        for (let i = k; i < m; i++) normx += R[i][k] * R[i][k];
        normx = Math.sqrt(normx);
        if (normx === 0) continue;
        const alpha = R[k][k] >= 0 ? -normx : normx;
        const v = new Array(m).fill(0);
        v[k] = R[k][k] - alpha;
        for (let i = k + 1; i < m; i++) v[i] = R[i][k];
        let vnorm2 = 0;
        for (let i = k; i < m; i++) vnorm2 += v[i] * v[i];
        if (vnorm2 === 0) continue;
        // R ← (I - 2 v vᵀ / vᵀv) R
        for (let j = 0; j < n; j++) {
            let dot = 0;
            for (let i = k; i < m; i++) dot += v[i] * R[i][j];
            const f = (2 * dot) / vnorm2;
            for (let i = k; i < m; i++) R[i][j] -= f * v[i];
        }
        // Q ← Q (I - 2 v vᵀ / vᵀv)
        for (let i = 0; i < m; i++) {
            let dot = 0;
            for (let j = k; j < m; j++) dot += Q[i][j] * v[j];
            const f = (2 * dot) / vnorm2;
            for (let j = k; j < m; j++) Q[i][j] -= f * v[j];
        }
    }
    // Clean tiny sub-diagonal noise in R.
    for (let i = 0; i < m; i++) for (let j = 0; j < Math.min(i, n); j++) R[i][j] = 0;
    return { Q, R };
}

/* ------------------------------------------------------------------ *
 *  Eigenvalues
 * ------------------------------------------------------------------ */

/**
 * Symmetric eigenproblem via the cyclic Jacobi method. Returns eigenvalues
 * (ascending) and the corresponding orthonormal eigenvectors as columns of V.
 * @param {Matrix} A  symmetric matrix
 * @param {number} [maxSweeps]
 * @returns {{ values: number[], vectors: Matrix }}
 */
export function eigSymmetric(A, maxSweeps = 100) {
    const [n, m] = shape(A);
    if (n !== m) throw new RangeError('eigSymmetric requires a square matrix');
    const S = clone(A);
    const V = identity(n);
    for (let sweep = 0; sweep < maxSweeps; sweep++) {
        // off-diagonal magnitude
        let off = 0;
        for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += S[p][q] * S[p][q];
        if (Math.sqrt(off) < 1e-15) break;
        for (let p = 0; p < n; p++) {
            for (let q = p + 1; q < n; q++) {
                if (Math.abs(S[p][q]) < 1e-300) continue;
                const theta = (S[q][q] - S[p][p]) / (2 * S[p][q]);
                const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
                const c = 1 / Math.sqrt(t * t + 1);
                const s = t * c;
                // rotate S
                for (let i = 0; i < n; i++) {
                    const sip = S[i][p];
                    const siq = S[i][q];
                    S[i][p] = c * sip - s * siq;
                    S[i][q] = s * sip + c * siq;
                }
                for (let i = 0; i < n; i++) {
                    const spi = S[p][i];
                    const sqi = S[q][i];
                    S[p][i] = c * spi - s * sqi;
                    S[q][i] = s * spi + c * sqi;
                }
                // accumulate eigenvectors
                for (let i = 0; i < n; i++) {
                    const vip = V[i][p];
                    const viq = V[i][q];
                    V[i][p] = c * vip - s * viq;
                    V[i][q] = s * vip + c * viq;
                }
            }
        }
    }
    const values = S.map((row, i) => row[i]);
    // sort ascending, permuting eigenvectors with them
    const order = values.map((v, i) => i).sort((a, b) => values[a] - values[b]);
    const sortedVals = order.map((i) => values[i]);
    const sortedVecs = zeros(n, n);
    for (let col = 0; col < n; col++) {
        const src = order[col];
        for (let i = 0; i < n; i++) sortedVecs[i][col] = V[i][src];
    }
    return { values: sortedVals, vectors: sortedVecs };
}

/**
 * Test whether A equals its transpose within a tolerance.
 * @param {Matrix} A
 * @param {number} [tol]
 * @returns {boolean}
 */
export function isSymmetric(A, tol = 1e-10) {
    const [n, m] = shape(A);
    if (n !== m) return false;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        if (Math.abs(A[i][j] - A[j][i]) > tol) return false;
    }
    return true;
}

/**
 * Eigenvalues of a general real matrix. Symmetric inputs are routed through
 * {@link eigSymmetric}; otherwise we reduce to upper Hessenberg form and run
 * shifted QR iteration, reading eigenvalues off the 1×1 and 2×2 diagonal
 * blocks of the resulting real Schur form. 2×2 blocks yield complex pairs.
 * @param {Matrix} A
 * @returns {Complex[]}
 */
export function eigenvalues(A) {
    const [n, m] = shape(A);
    if (n !== m) throw new RangeError('eigenvalues requires a square matrix');
    if (n === 0) return [];
    if (n === 1) return [complex(A[0][0], 0)];
    if (isSymmetric(A)) {
        return eigSymmetric(A).values.map((v) => complex(v, 0));
    }
    const H = hessenberg(clone(A));
    return francisQR(H);
}

/* -------- eigenvalue internals -------- */

/**
 * Reduce a square matrix to upper Hessenberg form by Householder similarity
 * transforms (eigenvalues preserved). O(n³).
 * @param {Matrix} A
 * @returns {Matrix}
 */
function hessenberg(A) {
    const n = A.length;
    const H = clone(A);
    for (let k = 0; k < n - 2; k++) {
        let scale = 0;
        for (let i = k + 1; i < n; i++) scale += Math.abs(H[i][k]);
        if (scale === 0) continue;
        let h = 0;
        const ort = new Array(n).fill(0);
        for (let i = n - 1; i > k; i--) {
            ort[i] = H[i][k] / scale;
            h += ort[i] * ort[i];
        }
        let g = Math.sqrt(h);
        if (ort[k + 1] > 0) g = -g;
        h -= ort[k + 1] * g;
        ort[k + 1] -= g;
        // apply Householder to remaining columns
        for (let j = k + 1; j < n; j++) {
            let f = 0;
            for (let i = n - 1; i > k; i--) f += ort[i] * H[i][j];
            f /= h;
            for (let i = k + 1; i < n; i++) H[i][j] -= f * ort[i];
        }
        // and to rows
        for (let i = 0; i < n; i++) {
            let f = 0;
            for (let j = n - 1; j > k; j--) f += ort[j] * H[i][j];
            f /= h;
            for (let j = k + 1; j < n; j++) H[i][j] -= f * ort[j];
        }
        H[k + 1][k] = scale * g;
        for (let i = k + 2; i < n; i++) H[i][k] = 0;
    }
    return H;
}

/**
 * Eigenvalues of an upper-Hessenberg matrix via the Francis double-shift
 * implicit-QR algorithm (real Schur form), faithfully adapted from EISPACK
 * `hqr`. Each step applies an implicit double shift — the two eigenvalues of
 * the trailing 2×2 block, taken as a conjugate pair — and chases the resulting
 * bulge down the sub-diagonal with 3×3 Householder reflectors. Real and
 * complex-conjugate eigenvalues both fall out of the 1×1 and 2×2 diagonal
 * blocks. The double shift is robust on non-normal matrices that a single real
 * shift can stall on; exceptional shifts break the rare convergence cycle.
 * @param {Matrix} Hin
 * @returns {Complex[]}
 */
function francisQR(Hin) {
    const n = Hin.length;
    const H = clone(Hin);
    /** @type {number[]} */ const wr = new Array(n).fill(0); // eigenvalue real parts
    /** @type {number[]} */ const wi = new Array(n).fill(0); // eigenvalue imag parts
    const eps = Number.EPSILON;

    // Sum of stored magnitudes — the yardstick for a "negligible" sub-diagonal.
    let norm = 0;
    for (let i = 0; i < n; i++) {
        for (let j = Math.max(i - 1, 0); j < n; j++) norm += Math.abs(H[i][j]);
    }

    let nn = n - 1; // bottom-right index of the still-active submatrix
    let t = 0;      // accumulated exceptional shift
    while (nn >= 0) {
        let its = 0; // iterations since the last deflation (resets per eigenvalue)
        for (;;) {
            // Deflation: smallest l whose sub-diagonal H[l][l-1] is negligible.
            let l = nn;
            while (l > 0) {
                let s = Math.abs(H[l - 1][l - 1]) + Math.abs(H[l][l]);
                if (s === 0) s = norm;
                if (Math.abs(H[l][l - 1]) <= eps * s) break;
                l--;
            }
            let x = H[nn][nn];
            if (l === nn) {
                // 1×1 block → one real eigenvalue
                wr[nn] = x + t;
                wi[nn] = 0;
                nn--;
                break;
            }
            let y = H[nn - 1][nn - 1];
            let w = H[nn][nn - 1] * H[nn - 1][nn];
            if (l === nn - 1) {
                // 2×2 block → real pair or complex-conjugate pair
                const p = 0.5 * (y - x);
                const q = p * p + w;
                let z = Math.sqrt(Math.abs(q));
                x += t;
                if (q >= 0) {
                    z = p + (p >= 0 ? z : -z); // real pair
                    wr[nn - 1] = x + z;
                    wr[nn] = z !== 0 ? x - w / z : x + z;
                    wi[nn - 1] = 0;
                    wi[nn] = 0;
                } else {
                    wr[nn - 1] = x + p; // complex-conjugate pair
                    wr[nn] = x + p;
                    wi[nn - 1] = z;
                    wi[nn] = -z;
                }
                nn -= 2;
                break;
            }
            if (its >= 30) throw new RangeError('QR iteration failed to converge');
            if (its === 10 || its === 20) {
                // Exceptional shift to break a convergence cycle.
                t += x;
                for (let i = 0; i <= nn; i++) H[i][i] -= x;
                const s = Math.abs(H[nn][nn - 1]) + Math.abs(H[nn - 1][nn - 2]);
                x = 0.75 * s;
                y = x;
                w = -0.4375 * s * s;
            }
            its++;
            // Find the bulge start m: two consecutive negligible sub-diagonals,
            // building the first column (p,q,r) of the implicit double shift.
            let p = 0;
            let q = 0;
            let r = 0;
            let m = nn - 2;
            for (; m >= l; m--) {
                const z = H[m][m];
                const rr = x - z;
                const ss = y - z;
                p = (rr * ss - w) / H[m + 1][m] + H[m][m + 1];
                q = H[m + 1][m + 1] - z - rr - ss;
                r = H[m + 2][m + 1];
                const s = Math.abs(p) + Math.abs(q) + Math.abs(r);
                p /= s;
                q /= s;
                r /= s;
                if (m === l) break;
                const u = Math.abs(H[m][m - 1]) * (Math.abs(q) + Math.abs(r));
                const v = Math.abs(p) * (Math.abs(H[m - 1][m - 1]) + Math.abs(z) + Math.abs(H[m + 1][m + 1]));
                if (u <= eps * v) break;
            }
            for (let i = m + 2; i <= nn; i++) {
                H[i][i - 2] = 0;
                if (i !== m + 2) H[i][i - 3] = 0;
            }
            // Implicit double-QR sweep: chase the bulge from m down to nn.
            for (let k = m; k <= nn - 1; k++) {
                const notlast = k !== nn - 1;
                if (k !== m) {
                    p = H[k][k - 1];
                    q = H[k + 1][k - 1];
                    r = notlast ? H[k + 2][k - 1] : 0;
                    x = Math.abs(p) + Math.abs(q) + Math.abs(r);
                    if (x === 0) continue;
                    p /= x;
                    q /= x;
                    r /= x;
                }
                let s = Math.sqrt(p * p + q * q + r * r);
                if (p < 0) s = -s;
                if (s === 0) continue;
                if (k === m) {
                    if (l !== m) H[k][k - 1] = -H[k][k - 1];
                } else {
                    H[k][k - 1] = -s * x;
                }
                p += s;
                x = p / s;
                y = q / s;
                const z = r / s;
                q /= p;
                r /= p;
                // Row transformation.
                for (let j = k; j <= nn; j++) {
                    p = H[k][j] + q * H[k + 1][j];
                    if (notlast) {
                        p += r * H[k + 2][j];
                        H[k + 2][j] -= p * z;
                    }
                    H[k + 1][j] -= p * y;
                    H[k][j] -= p * x;
                }
                // Column transformation.
                const jmax = Math.min(nn, k + 3);
                for (let i = l; i <= jmax; i++) {
                    p = x * H[i][k] + y * H[i][k + 1];
                    if (notlast) {
                        p += z * H[i][k + 2];
                        H[i][k + 2] -= p * r;
                    }
                    H[i][k + 1] -= p * q;
                    H[i][k] -= p;
                }
            }
        }
    }
    /** @type {Complex[]} */
    const eig = new Array(n);
    for (let i = 0; i < n; i++) eig[i] = complex(wr[i], wi[i]);
    return eig;
}

/* ------------------------------------------------------------------ *
 *  Internal helpers
 * ------------------------------------------------------------------ */

/** @param {Matrix} A @param {Matrix} B */
function sameShape(A, B) {
    const [ra, ca] = shape(A);
    const [rb, cb] = shape(B);
    if (ra !== rb || ca !== cb) throw new RangeError(`Shape mismatch: ${ra}×${ca} vs ${rb}×${cb}`);
}

/** @param {Matrix} A @returns {number} */
function maxAbs(A) {
    let m = 0;
    for (const row of A) for (const v of row) m = Math.max(m, Math.abs(v));
    return m || 1;
}
