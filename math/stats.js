// @ts-check
/**
 * Descriptive statistics, regression, and probability distributions.
 *
 * Distribution CDFs are built on the regularized special functions in
 * {@link module:math/special}:
 *   - Normal  via erf
 *   - Student-t & F via the regularized incomplete beta I_x(a,b)
 *   - χ² & Gamma via the regularized lower incomplete gamma P(a,x)
 *   - Binomial & Poisson via their closed forms / incomplete functions
 *
 * The inverse normal CDF uses the Acklam rational approximation refined by a
 * single Halley step (|abs err| < 1e-15 in the tails).
 *
 * @module math/stats
 */

import { erfc, lowerGammaP, betaInc, lgamma } from './special.js';

const SQRT2 = Math.SQRT2;
const SQRT2PI = Math.sqrt(2 * Math.PI);

/* ------------------------------------------------------------------ *
 *  Descriptive statistics
 * ------------------------------------------------------------------ */

/** @param {number[]} xs @returns {number} */
export function sum(xs) {
    // Kahan compensated summation for accuracy on long/ill-conditioned data.
    let s = 0;
    let c = 0;
    for (const x of xs) {
        const y = x - c;
        const t = s + y;
        c = t - s - y;
        s = t;
    }
    return s;
}

/** @param {number[]} xs @returns {number} */
export function mean(xs) {
    if (xs.length === 0) return NaN;
    return sum(xs) / xs.length;
}

/** @param {number[]} xs @returns {number} */
export function median(xs) {
    if (xs.length === 0) return NaN;
    const s = [...xs].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Most frequent value(s). @param {number[]} xs @returns {number[]} */
export function mode(xs) {
    /** @type {Map<number, number>} */
    const counts = new Map();
    let best = 0;
    for (const x of xs) {
        const c = (counts.get(x) || 0) + 1;
        counts.set(x, c);
        if (c > best) best = c;
    }
    /** @type {number[]} */
    const modes = [];
    for (const [v, c] of counts) if (c === best) modes.push(v);
    return modes.sort((a, b) => a - b);
}

/**
 * Variance. Population (divide by n) by default; sample (n-1) when
 * `sample` is true.
 * @param {number[]} xs
 * @param {boolean} [sample]
 * @returns {number}
 */
export function variance(xs, sample = false) {
    const n = xs.length;
    if (n < (sample ? 2 : 1)) return NaN;
    const m = mean(xs);
    let s = 0;
    for (const x of xs) s += (x - m) * (x - m);
    return s / (sample ? n - 1 : n);
}

/** @param {number[]} xs @param {boolean} [sample] @returns {number} */
export function std(xs, sample = false) {
    return Math.sqrt(variance(xs, sample));
}

/** @param {number[]} xs @returns {number} */
export function range(xs) {
    return Math.max(...xs) - Math.min(...xs);
}

/**
 * Quantile via linear interpolation (R type-7, the default in R / NumPy
 * `linear`). `q` in [0,1].
 * @param {number[]} xs
 * @param {number} q
 * @returns {number}
 */
export function quantile(xs, q) {
    if (xs.length === 0) return NaN;
    const s = [...xs].sort((a, b) => a - b);
    const h = (s.length - 1) * q;
    const lo = Math.floor(h);
    const hi = Math.ceil(h);
    return s[lo] + (h - lo) * (s[hi] - s[lo]);
}

/** Percentile p in [0,100]. @param {number[]} xs @param {number} p @returns {number} */
export function percentile(xs, p) {
    return quantile(xs, p / 100);
}

/** Interquartile range Q3 − Q1. @param {number[]} xs @returns {number} */
export function iqr(xs) {
    return quantile(xs, 0.75) - quantile(xs, 0.25);
}

/** Sample skewness (Fisher–Pearson). @param {number[]} xs @returns {number} */
export function skewness(xs) {
    const n = xs.length;
    const m = mean(xs);
    const s = std(xs, false);
    if (s === 0) return 0;
    let acc = 0;
    for (const x of xs) acc += ((x - m) / s) ** 3;
    return acc / n;
}

/** Excess kurtosis (normal → 0). @param {number[]} xs @returns {number} */
export function kurtosis(xs) {
    const n = xs.length;
    const m = mean(xs);
    const s = std(xs, false);
    if (s === 0) return 0;
    let acc = 0;
    for (const x of xs) acc += ((x - m) / s) ** 4;
    return acc / n - 3;
}

/* ------------------------------------------------------------------ *
 *  Bivariate
 * ------------------------------------------------------------------ */

/** @param {number[]} xs @param {number[]} ys @param {boolean} [sample] @returns {number} */
export function covariance(xs, ys, sample = false) {
    const n = xs.length;
    if (n !== ys.length || n < (sample ? 2 : 1)) return NaN;
    const mx = mean(xs);
    const my = mean(ys);
    let s = 0;
    for (let i = 0; i < n; i++) s += (xs[i] - mx) * (ys[i] - my);
    return s / (sample ? n - 1 : n);
}

/** Pearson correlation coefficient. @param {number[]} xs @param {number[]} ys @returns {number} */
export function correlation(xs, ys) {
    const c = covariance(xs, ys, false);
    return c / (std(xs, false) * std(ys, false));
}

/**
 * @typedef {object} Regression
 * @property {number} slope
 * @property {number} intercept
 * @property {number} r2  coefficient of determination
 * @property {(x: number) => number} predict
 */

/**
 * Ordinary least-squares simple linear regression y = slope·x + intercept.
 * @param {number[]} xs
 * @param {number[]} ys
 * @returns {Regression}
 */
export function linearRegression(xs, ys) {
    const n = xs.length;
    const mx = mean(xs);
    const my = mean(ys);
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    for (let i = 0; i < n; i++) {
        const dx = xs[i] - mx;
        const dy = ys[i] - my;
        sxy += dx * dy;
        sxx += dx * dx;
        syy += dy * dy;
    }
    const slope = sxy / sxx;
    const intercept = my - slope * mx;
    const r2 = syy === 0 ? 1 : (sxy * sxy) / (sxx * syy);
    return { slope, intercept, r2, predict: (x) => slope * x + intercept };
}

/* ------------------------------------------------------------------ *
 *  Distributions
 * ------------------------------------------------------------------ */

/** Standard-normal pdf. @param {number} x @param {number} [mu] @param {number} [sigma] @returns {number} */
export function normalPdf(x, mu = 0, sigma = 1) {
    const z = (x - mu) / sigma;
    return Math.exp(-0.5 * z * z) / (sigma * SQRT2PI);
}

/** Normal CDF Φ via erf. @param {number} x @param {number} [mu] @param {number} [sigma] @returns {number} */
export function normalCdf(x, mu = 0, sigma = 1) {
    return 0.5 * erfc(-(x - mu) / (sigma * SQRT2));
}

/**
 * Inverse normal CDF (quantile / probit). Acklam's rational approximation
 * with one Halley refinement step. `p` in (0,1).
 * @param {number} p
 * @param {number} [mu]
 * @param {number} [sigma]
 * @returns {number}
 */
export function normalQuantile(p, mu = 0, sigma = 1) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
    const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
    const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
    const plow = 0.02425;
    const phigh = 1 - plow;
    let x;
    if (p < plow) {
        const q = Math.sqrt(-2 * Math.log(p));
        x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= phigh) {
        const q = p - 0.5;
        const r = q * q;
        x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
            (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
        const q = Math.sqrt(-2 * Math.log(1 - p));
        x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    // Halley refinement
    const e = normalCdf(x) - p;
    const u = e * SQRT2PI * Math.exp((x * x) / 2);
    x = x - u / (1 + (x * u) / 2);
    return mu + sigma * x;
}

/** Student-t pdf with ν degrees of freedom. @param {number} t @param {number} nu @returns {number} */
export function tPdf(t, nu) {
    const c = Math.exp(lgamma((nu + 1) / 2) - lgamma(nu / 2)) / Math.sqrt(nu * Math.PI);
    return c * Math.pow(1 + (t * t) / nu, -(nu + 1) / 2);
}

/** Student-t CDF via the regularized incomplete beta. @param {number} t @param {number} nu @returns {number} */
export function tCdf(t, nu) {
    const x = nu / (nu + t * t);
    const ib = 0.5 * betaInc(x, nu / 2, 0.5);
    return t > 0 ? 1 - ib : ib;
}

/** χ² CDF with k dof (regularized lower incomplete gamma). @param {number} x @param {number} k @returns {number} */
export function chiSquareCdf(x, k) {
    if (x <= 0) return 0;
    return lowerGammaP(k / 2, x / 2);
}

/** χ² pdf. @param {number} x @param {number} k @returns {number} */
export function chiSquarePdf(x, k) {
    if (x <= 0) return 0;
    return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - lgamma(k / 2));
}

/** F-distribution CDF via incomplete beta. @param {number} x @param {number} d1 @param {number} d2 @returns {number} */
export function fCdf(x, d1, d2) {
    if (x <= 0) return 0;
    return betaInc((d1 * x) / (d1 * x + d2), d1 / 2, d2 / 2);
}

/** Exponential CDF (rate λ). @param {number} x @param {number} lambda @returns {number} */
export function exponentialCdf(x, lambda) {
    return x < 0 ? 0 : 1 - Math.exp(-lambda * x);
}

/** Binomial pmf P(X=k). @param {number} k @param {number} n @param {number} p @returns {number} */
export function binomialPmf(k, n, p) {
    if (k < 0 || k > n || !Number.isInteger(k)) return 0;
    if (p <= 0) return k === 0 ? 1 : 0;
    if (p >= 1) return k === n ? 1 : 0;
    // Log-space (mirrors poissonPmf) so large n doesn't overflow the binomial
    // coefficient: combinations(1030,515) === Infinity, but lgamma stays finite.
    const logChoose = lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
    return Math.exp(logChoose + k * Math.log(p) + (n - k) * Math.log(1 - p));
}

/** Binomial CDF P(X≤k). @param {number} k @param {number} n @param {number} p @returns {number} */
export function binomialCdf(k, n, p) {
    let s = 0;
    const kk = Math.floor(k);
    for (let i = 0; i <= kk; i++) s += binomialPmf(i, n, p);
    return Math.min(1, s);
}

/** Poisson pmf P(X=k). @param {number} k @param {number} lambda @returns {number} */
export function poissonPmf(k, lambda) {
    if (k < 0 || !Number.isInteger(k)) return 0;
    return Math.exp(k * Math.log(lambda) - lambda - lgamma(k + 1));
}

/** Poisson CDF P(X≤k) = Q(k+1, λ) (regularized upper incomplete gamma). @param {number} k @param {number} lambda @returns {number} */
export function poissonCdf(k, lambda) {
    let s = 0;
    const kk = Math.floor(k);
    for (let i = 0; i <= kk; i++) s += poissonPmf(i, lambda);
    return Math.min(1, s);
}

/** Standard z-score. @param {number} x @param {number} mu @param {number} sigma @returns {number} */
export function zScore(x, mu, sigma) {
    return (x - mu) / sigma;
}

/* ------------------------------------------------------------------ *
 *  Inferential statistics — hypothesis tests & confidence intervals
 *
 *  Each test returns the test statistic, degrees of freedom (where it
 *  applies), and a p-value. p-values use the distribution CDFs above.
 * ------------------------------------------------------------------ */

/**
 * Inverse Student-t CDF (quantile) by bisection — the t* critical value with
 * P(T ≤ t*) = p for ν degrees of freedom.
 * @param {number} p  in (0,1)
 * @param {number} nu
 * @returns {number}
 */
export function tQuantile(p, nu) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    let lo = -1000;
    let hi = 1000;
    for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if (tCdf(mid, nu) < p) lo = mid;
        else hi = mid;
    }
    return (lo + hi) / 2;
}

/** Two-tailed p-value from a t statistic. @param {number} t @param {number} nu @returns {number} */
function tTwoTailed(t, nu) {
    return 2 * (1 - tCdf(Math.abs(t), nu));
}

/**
 * @typedef {object} TestResult
 * @property {number} statistic
 * @property {number} [df]
 * @property {number} pValue
 */

/**
 * One-sample t-test: is the sample mean different from `mu0`?
 * @param {number[]} data
 * @param {number} mu0
 * @returns {TestResult}
 */
export function tTestOneSample(data, mu0) {
    const n = data.length;
    const m = mean(data);
    const s = std(data, true);
    const t = (m - mu0) / (s / Math.sqrt(n));
    const df = n - 1;
    return { statistic: t, df, pValue: tTwoTailed(t, df) };
}

/**
 * Two-sample t-test. Welch's (unequal variances) by default; pooled when
 * `pooled` is true.
 * @param {number[]} a
 * @param {number[]} b
 * @param {boolean} [pooled]
 * @returns {TestResult}
 */
export function tTestTwoSample(a, b, pooled = false) {
    const na = a.length;
    const nb = b.length;
    const ma = mean(a);
    const mb = mean(b);
    const va = variance(a, true);
    const vb = variance(b, true);
    if (pooled) {
        const dfp = na + nb - 2;
        const sp2 = ((na - 1) * va + (nb - 1) * vb) / dfp;
        const t = (ma - mb) / Math.sqrt(sp2 * (1 / na + 1 / nb));
        return { statistic: t, df: dfp, pValue: tTwoTailed(t, dfp) };
    }
    // Welch
    const se = Math.sqrt(va / na + vb / nb);
    const t = (ma - mb) / se;
    const df = Math.pow(va / na + vb / nb, 2) /
        (Math.pow(va / na, 2) / (na - 1) + Math.pow(vb / nb, 2) / (nb - 1));
    return { statistic: t, df, pValue: tTwoTailed(t, df) };
}

/**
 * One-sample z-test (known population σ).
 * @param {number} sampleMean
 * @param {number} mu0
 * @param {number} sigma
 * @param {number} n
 * @returns {TestResult}
 */
export function zTest(sampleMean, mu0, sigma, n) {
    const z = (sampleMean - mu0) / (sigma / Math.sqrt(n));
    return { statistic: z, pValue: 2 * (1 - normalCdf(Math.abs(z))) };
}

/**
 * Chi-square goodness-of-fit test.
 * @param {number[]} observed
 * @param {number[]} expected
 * @returns {TestResult}
 */
export function chiSquareGoF(observed, expected) {
    if (observed.length !== expected.length) throw new RangeError('observed/expected length mismatch');
    let chi2 = 0;
    for (let i = 0; i < observed.length; i++) {
        const d = observed[i] - expected[i];
        chi2 += (d * d) / expected[i];
    }
    const df = observed.length - 1;
    return { statistic: chi2, df, pValue: 1 - chiSquareCdf(chi2, df) };
}

/**
 * One-way ANOVA across ≥2 groups (equal-variance F-test).
 * @param {number[][]} groups
 * @returns {{ statistic: number, dfBetween: number, dfWithin: number, pValue: number }}
 */
export function anovaOneWay(groups) {
    const k = groups.length;
    const all = groups.flat();
    const grandMean = mean(all);
    let ssBetween = 0;
    let ssWithin = 0;
    for (const g of groups) {
        const gm = mean(g);
        ssBetween += g.length * (gm - grandMean) ** 2;
        for (const x of g) ssWithin += (x - gm) ** 2;
    }
    const dfBetween = k - 1;
    const dfWithin = all.length - k;
    const F = (ssBetween / dfBetween) / (ssWithin / dfWithin);
    return { statistic: F, dfBetween, dfWithin, pValue: 1 - fCdf(F, dfBetween, dfWithin) };
}

/**
 * Significance test for the Pearson correlation coefficient (H₀: ρ = 0).
 * @param {number[]} xs
 * @param {number[]} ys
 * @returns {{ r: number, statistic: number, df: number, pValue: number }}
 */
export function pearsonTest(xs, ys) {
    const r = correlation(xs, ys);
    const n = xs.length;
    const df = n - 2;
    const t = r * Math.sqrt(df / (1 - r * r));
    return { r, statistic: t, df, pValue: tTwoTailed(t, df) };
}

/**
 * Confidence interval for the population mean (t-based).
 * @param {number[]} data
 * @param {number} [level]  e.g. 0.95
 * @returns {{ mean: number, lower: number, upper: number, margin: number }}
 */
export function confidenceIntervalMean(data, level = 0.95) {
    const n = data.length;
    const m = mean(data);
    const se = std(data, true) / Math.sqrt(n);
    const tStar = tQuantile(1 - (1 - level) / 2, n - 1);
    const margin = tStar * se;
    return { mean: m, lower: m - margin, upper: m + margin, margin };
}
