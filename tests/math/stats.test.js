/**
 * @jest-environment node
 */
import {
    sum, mean, median, mode, variance, std, range, quantile, percentile, iqr,
    skewness, kurtosis, covariance, correlation, linearRegression,
    normalPdf, normalCdf, normalQuantile, tCdf, chiSquareCdf, fCdf,
    exponentialCdf, binomialPmf, binomialCdf, poissonPmf, poissonCdf, zScore,
} from '../../math/stats.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-6) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

describe('stats — descriptive', () => {
    const data = [2, 4, 4, 4, 5, 5, 7, 9];
    test('sum (Kahan)', () => near(sum(data), 40));
    test('mean = 5', () => near(mean(data), 5));
    test('median even-length', () => near(median([1, 2, 3, 4]), 2.5));
    test('median odd-length', () => near(median([3, 1, 2]), 2));
    test('mode = [4]', () => expect(mode(data)).toEqual([4]));
    test('population variance = 4', () => near(variance(data, false), 4));
    test('population std = 2', () => near(std(data, false), 2));
    test('sample variance uses n-1', () => near(variance([1, 2, 3, 4, 5], true), 2.5));
    test('range', () => near(range(data), 7));
    test('median quantile', () => near(quantile([1, 2, 3, 4, 5], 0.5), 3));
    test('percentile 25', () => near(percentile([1, 2, 3, 4, 5], 25), 2));
    test('IQR', () => near(iqr([1, 2, 3, 4, 5, 6, 7, 8]), 3.5));
});

describe('stats — shape', () => {
    test('symmetric data → ~0 skew', () => near(skewness([1, 2, 3, 4, 5]), 0, 1e-9));
    test('excess kurtosis of uniform-ish < 0', () => expect(kurtosis([1, 2, 3, 4, 5])).toBeLessThan(0));
});

describe('stats — bivariate & regression', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [2, 4, 6, 8, 10]; // y = 2x
    test('perfect correlation = 1', () => near(correlation(xs, ys), 1));
    test('covariance sign', () => expect(covariance(xs, ys, true)).toBeGreaterThan(0));
    test('regression recovers slope/intercept', () => {
        const r = linearRegression(xs, ys);
        near(r.slope, 2);
        near(r.intercept, 0);
        near(r.r2, 1);
        near(r.predict(10), 20);
    });
    test('regression with noise has r² in (0,1)', () => {
        const r = linearRegression([1, 2, 3, 4], [1, 3, 2, 5]);
        expect(r.r2).toBeGreaterThan(0);
        expect(r.r2).toBeLessThanOrEqual(1);
    });
});

describe('stats — normal distribution', () => {
    test('pdf(0) = 1/√(2π)', () => near(normalPdf(0), 1 / Math.sqrt(2 * Math.PI)));
    test('cdf(0) = 0.5', () => near(normalCdf(0), 0.5));
    test('cdf(1.96) ≈ 0.975', () => near(normalCdf(1.96), 0.9750021049, 1e-6));
    test('cdf(-1) ≈ 0.158655', () => near(normalCdf(-1), 0.1586552539, 1e-6));
    test('68-95-99.7 rule: P(|Z|<1) ≈ 0.6827', () =>
        near(normalCdf(1) - normalCdf(-1), 0.6826894921, 1e-6));
    test('quantile(0.975) ≈ 1.96', () => near(normalQuantile(0.975), 1.959963985, 1e-6));
    test('quantile is inverse of cdf', () => near(normalQuantile(normalCdf(0.7)), 0.7, 1e-6));
    test('quantile(0.5) = 0', () => near(normalQuantile(0.5), 0, 1e-9));
    test('z-score', () => near(zScore(85, 75, 5), 2));
});

describe('stats — other distributions', () => {
    test('t-CDF(0, ν) = 0.5', () => near(tCdf(0, 10), 0.5));
    test('t→normal as ν→∞', () => near(tCdf(1.96, 100000), normalCdf(1.96), 1e-3));
    test('t-table: P(T<2.228, ν=10) ≈ 0.975', () => near(tCdf(2.228, 10), 0.975, 1e-3));
    test('χ²-CDF(k, k) is reasonable median-ish', () => {
        expect(chiSquareCdf(3.357, 4)).toBeGreaterThan(0.4);
        expect(chiSquareCdf(3.357, 4)).toBeLessThan(0.6);
    });
    test('χ² CDF monotone increasing', () =>
        expect(chiSquareCdf(5, 3)).toBeGreaterThan(chiSquareCdf(2, 3)));
    test('F-CDF in (0,1)', () => {
        const p = fCdf(2, 5, 10);
        expect(p).toBeGreaterThan(0);
        expect(p).toBeLessThan(1);
    });
    test('exponential CDF: P(X<mean)=1-1/e', () => near(exponentialCdf(1, 1), 1 - Math.exp(-1)));
});

describe('stats — discrete distributions', () => {
    test('binomial pmf C(10,3)·.5^10', () => near(binomialPmf(3, 10, 0.5), 0.1171875));
    test('binomial pmf sums to 1', () => {
        let s = 0;
        for (let k = 0; k <= 10; k++) s += binomialPmf(k, 10, 0.3);
        near(s, 1);
    });
    test('binomial cdf P(X≤5,n=10,p=.5)', () => near(binomialCdf(5, 10, 0.5), 0.623046875));
    test('binomial pmf does not overflow for large n (log-space)', () => {
        // Regression: combinations(1030,515) === Infinity, so the old
        // C(n,k)·p^k·q^(n-k) form returned Infinity here. Log-space stays finite.
        const p = binomialPmf(515, 1030, 0.5);
        expect(Number.isFinite(p)).toBe(true);
        near(p, 0.024858, 2e-4);            // mode pmf ≈ 1/√(2π·n·pq)
        const c = binomialCdf(515, 1030, 0.5);
        expect(Number.isFinite(c)).toBe(true);
        expect(c).toBeLessThanOrEqual(1);
        near(c, 0.5, 0.02);                 // symmetric ⇒ median ≈ mean
    });
    test('poisson pmf λ=3, k=2', () => near(poissonPmf(2, 3), 0.2240418077, 1e-9));
    test('poisson pmf sums to ~1', () => {
        let s = 0;
        for (let k = 0; k <= 40; k++) s += poissonPmf(k, 4);
        near(s, 1, 1e-9);
    });
    test('poisson cdf monotone', () => expect(poissonCdf(5, 3)).toBeGreaterThan(poissonCdf(2, 3)));
});
