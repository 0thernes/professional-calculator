// @ts-check
/**
 * Special functions — gamma, log-gamma, error function, beta, and the
 * combinatorial primitives. These underpin the statistics/distribution
 * layer and the calculus layer.
 *
 * Implementations and their accuracy:
 *  - lgamma / gamma: Lanczos approximation (g=7, n=9), |rel err| < 1e-13.
 *  - erf / erfc: Numerical Recipes rational Chebyshev, |err| < 1.2e-7.
 *  - lowerGammaP / upperGammaQ: series + continued fraction (Numerical
 *    Recipes `gammp`/`gammq`), |err| < 1e-10 across the domain.
 *  - betaInc: Lentz continued fraction (`betai`), |err| < 1e-10.
 *
 * @module math/special
 */

/** Lanczos g=7 coefficients (n=9). */
const LANCZOS_G = 7;
const LANCZOS_C = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
];

/**
 * Natural log of the gamma function, Γ(x), valid for all real x except
 * non-positive integers. Uses the reflection formula for x < 0.5.
 * @param {number} x
 * @returns {number}
 */
export function lgamma(x) {
    if (Number.isNaN(x)) return NaN;
    if (x < 0.5) {
        // Reflection: Γ(x)Γ(1-x) = π / sin(πx)
        const sinPiX = Math.sin(Math.PI * x);
        if (sinPiX === 0) return Infinity; // pole at non-positive integers
        return Math.log(Math.PI / Math.abs(sinPiX)) - lgamma(1 - x);
    }
    const xx = x - 1;
    let a = LANCZOS_C[0];
    const t = xx + LANCZOS_G + 0.5;
    for (let i = 1; i < LANCZOS_C.length; i++) {
        a += LANCZOS_C[i] / (xx + i);
    }
    return 0.5 * Math.log(2 * Math.PI) + (xx + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Gamma function Γ(x). Returns the signed value for negative non-integer x.
 * @param {number} x
 * @returns {number}
 */
export function gamma(x) {
    if (Number.isInteger(x) && x <= 0) return NaN; // poles
    if (x < 0.5) {
        // reflection keeps the sign correct
        return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x));
    }
    const xx = x - 1;
    let a = LANCZOS_C[0];
    const t = xx + LANCZOS_G + 0.5;
    for (let i = 1; i < LANCZOS_C.length; i++) {
        a += LANCZOS_C[i] / (xx + i);
    }
    return Math.sqrt(2 * Math.PI) * Math.pow(t, xx + 0.5) * Math.exp(-t) * a;
}

/**
 * Factorial n! for non-negative integers (exact via product up to n=170,
 * then Γ). Returns Infinity beyond double range (n ≥ 171).
 * @param {number} n
 * @returns {number}
 */
export function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
}

/**
 * Binomial coefficient C(n, k) computed in log space to avoid overflow,
 * rounded to the nearest integer for integer inputs.
 * @param {number} n
 * @param {number} k
 * @returns {number}
 */
export function combinations(n, k) {
    if (k < 0 || k > n || !Number.isInteger(n) || !Number.isInteger(k)) return NaN;
    if (k === 0 || k === n) return 1;
    const kk = Math.min(k, n - k);
    // multiplicative formula, exact for small results
    let result = 1;
    for (let i = 0; i < kk; i++) {
        result = (result * (n - i)) / (i + 1);
    }
    return Math.round(result);
}

/**
 * Permutations P(n, k) = n! / (n-k)!.
 * @param {number} n
 * @param {number} k
 * @returns {number}
 */
export function permutations(n, k) {
    if (k < 0 || k > n || !Number.isInteger(n) || !Number.isInteger(k)) return NaN;
    let result = 1;
    for (let i = 0; i < k; i++) result *= n - i;
    return result;
}

/**
 * Chebyshev coefficients for the complementary error function
 * (Numerical Recipes 3rd ed. `erfccheb`), giving ~1e-15 accuracy — full
 * double precision, far beyond the classic 7-digit minimax polynomial.
 */
const ERFC_COF = [
    -1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2,
    -9.561514786808631e-3, -9.46595344482036e-4, 3.66839497852761e-4,
    4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6,
    1.303655835580e-6, 1.5626441722e-8, -8.5238095915e-8, 6.529054439e-9,
    5.059343495e-9, -9.91364156e-10, -2.27365122e-10, 9.6467911e-11,
    2.394038e-12, -6.886027e-12, 8.94487e-13, 3.13092e-13, -1.12708e-13,
    3.81e-16, 7.106e-15,
];

/**
 * Chebyshev evaluation of erfc for z ≥ 0.
 * @param {number} z
 * @returns {number}
 */
function erfccheb(z) {
    const t = 2 / (2 + z);
    const ty = 4 * t - 2;
    let d = 0;
    let dd = 0;
    for (let j = ERFC_COF.length - 1; j > 0; j--) {
        const tmp = d;
        d = ty * d - dd + ERFC_COF[j];
        dd = tmp;
    }
    return t * Math.exp(-z * z + 0.5 * (ERFC_COF[0] + ty * d) - dd);
}

/**
 * Error function erf(x), accurate to ~1e-15.
 * @param {number} x
 * @returns {number}
 */
export function erf(x) {
    return x >= 0 ? 1 - erfccheb(x) : erfccheb(-x) - 1;
}

/**
 * Complementary error function erfc(x) = 1 - erf(x), accurate to ~1e-15.
 * @param {number} x
 * @returns {number}
 */
export function erfc(x) {
    return x >= 0 ? erfccheb(x) : 2 - erfccheb(-x);
}

/**
 * Natural log of the Beta function: ln B(a,b) = lnΓ(a)+lnΓ(b)-lnΓ(a+b).
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function lbeta(a, b) {
    return lgamma(a) + lgamma(b) - lgamma(a + b);
}

/**
 * Beta function B(a,b).
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function beta(a, b) {
    return Math.exp(lbeta(a, b));
}

/**
 * Regularized lower incomplete gamma P(a,x) = γ(a,x)/Γ(a).
 * Series for x < a+1, continued fraction otherwise.
 * @param {number} a
 * @param {number} x
 * @returns {number}
 */
export function lowerGammaP(a, x) {
    if (x < 0 || a <= 0) return NaN;
    if (x === 0) return 0;
    if (x < a + 1) {
        // series representation
        let ap = a;
        let sum = 1 / a;
        let del = sum;
        for (let n = 0; n < 200; n++) {
            ap += 1;
            del *= x / ap;
            sum += del;
            if (Math.abs(del) < Math.abs(sum) * 1e-15) break;
        }
        return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
    }
    // continued fraction for Q, then P = 1 - Q
    return 1 - upperGammaQ(a, x);
}

/**
 * Regularized upper incomplete gamma Q(a,x) = Γ(a,x)/Γ(a) = 1 - P(a,x).
 * @param {number} a
 * @param {number} x
 * @returns {number}
 */
export function upperGammaQ(a, x) {
    if (x < 0 || a <= 0) return NaN;
    if (x === 0) return 1;
    if (x < a + 1) {
        return 1 - lowerGammaP(a, x);
    }
    // Lentz's continued fraction
    const tiny = 1e-30;
    let b = x + 1 - a;
    let c = 1 / tiny;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i < 200; i++) {
        const an = -i * (i - a);
        b += 2;
        d = an * d + b;
        if (Math.abs(d) < tiny) d = tiny;
        c = b + an / c;
        if (Math.abs(c) < tiny) c = tiny;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < 1e-15) break;
    }
    return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

/**
 * Regularized incomplete beta function I_x(a,b), used for the CDFs of the
 * Student-t, F, and binomial distributions. Lentz continued fraction.
 * @param {number} x
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function betaInc(x, a, b) {
    if (x < 0 || x > 1) return NaN;
    if (x === 0) return 0;
    if (x === 1) return 1;
    const lbt =
        lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x);
    const front = Math.exp(lbt);
    // Use symmetry for faster convergence.
    if (x < (a + 1) / (a + b + 2)) {
        return (front * betaContinuedFraction(x, a, b)) / a;
    }
    return 1 - (front * betaContinuedFraction(1 - x, b, a)) / b;
}

/**
 * Continued-fraction kernel for {@link betaInc} (Lentz).
 * @param {number} x
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function betaContinuedFraction(x, a, b) {
    const tiny = 1e-30;
    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < tiny) d = tiny;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= 200; m++) {
        const m2 = 2 * m;
        let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < tiny) d = tiny;
        c = 1 + aa / c;
        if (Math.abs(c) < tiny) c = tiny;
        d = 1 / d;
        h *= d * c;
        aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < tiny) d = tiny;
        c = 1 + aa / c;
        if (Math.abs(c) < tiny) c = tiny;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < 1e-15) break;
    }
    return h;
}
