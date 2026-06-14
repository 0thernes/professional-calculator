/**
 * @jest-environment node
 */
import {
    tQuantile, tTestOneSample, tTestTwoSample, zTest, chiSquareGoF,
    anovaOneWay, pearsonTest, confidenceIntervalMean, tCdf,
} from '../../math/stats.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-4) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

describe('hypothesis — t quantile (inverse t CDF)', () => {
    test('round-trips tCdf', () => near(tCdf(tQuantile(0.975, 10), 10), 0.975, 1e-4));
    test('median is 0', () => near(tQuantile(0.5, 7), 0, 1e-6));
    test('t*(0.975, 4) ≈ 2.7764', () => near(tQuantile(0.975, 4), 2.7764, 1e-3));
    test('t*(0.975, ∞) → 1.96', () => near(tQuantile(0.975, 100000), 1.96, 1e-2));
});

describe('hypothesis — one-sample t-test', () => {
    test('mean = mu0 → t = 0, p = 1', () => {
        const r = tTestOneSample([1, 2, 3, 4, 5], 3);
        near(r.statistic, 0); expect(r.df).toBe(4); near(r.pValue, 1, 1e-6);
    });
    test('t statistic matches hand calc (data [1..5], mu0=0)', () => {
        const r = tTestOneSample([1, 2, 3, 4, 5], 0); // mean 3, s=√2.5, se=√0.5
        near(r.statistic, 4.242640687, 1e-6);
        expect(r.pValue).toBeLessThan(0.02);
    });
});

describe('hypothesis — two-sample t-test', () => {
    test('Welch: a vs a+1 → t = -1, df = 8', () => {
        const r = tTestTwoSample([1, 2, 3, 4, 5], [2, 3, 4, 5, 6]);
        near(r.statistic, -1); near(r.df ?? 0, 8, 1e-6);
    });
    test('pooled matches Welch for equal n & variance', () => {
        const r = tTestTwoSample([1, 2, 3, 4, 5], [2, 3, 4, 5, 6], true);
        near(r.statistic, -1); expect(r.df).toBe(8);
    });
    test('identical samples → t ≈ 0', () => {
        const r = tTestTwoSample([1, 2, 3], [1, 2, 3]);
        near(r.statistic, 0);
    });
});

describe('hypothesis — z-test', () => {
    test('z = (x̄−μ)/(σ/√n)', () => {
        const r = zTest(105, 100, 15, 25); // (5)/(3) = 1.6667
        near(r.statistic, 1.666667, 1e-5);
        expect(r.pValue).toBeGreaterThan(0.09);
        expect(r.pValue).toBeLessThan(0.10);
    });
});

describe('hypothesis — chi-square goodness-of-fit', () => {
    test('fair die: χ²=1.0, df=5', () => {
        const r = chiSquareGoF([8, 9, 11, 10, 12, 10], [10, 10, 10, 10, 10, 10]);
        near(r.statistic, 1.0);
        expect(r.df).toBe(5);
        expect(r.pValue).toBeGreaterThan(0.9); // clearly fair
    });
    test('perfect fit → χ²=0, p=1', () => {
        const r = chiSquareGoF([10, 10, 10], [10, 10, 10]);
        near(r.statistic, 0); near(r.pValue, 1, 1e-9);
    });
    test('length mismatch throws', () => expect(() => chiSquareGoF([1, 2], [1])).toThrow(RangeError));
});

describe('hypothesis — one-way ANOVA', () => {
    test('F = 3, df (2, 6) for shifted groups', () => {
        const r = anovaOneWay([[1, 2, 3], [2, 3, 4], [3, 4, 5]]);
        near(r.statistic, 3);
        expect(r.dfBetween).toBe(2);
        expect(r.dfWithin).toBe(6);
    });
    test('identical groups → F = 0', () => {
        const r = anovaOneWay([[1, 2, 3], [1, 2, 3], [1, 2, 3]]);
        near(r.statistic, 0);
    });
});

describe('hypothesis — Pearson correlation test', () => {
    test('perfect correlation → r = 1, p ≈ 0', () => {
        const r = pearsonTest([1, 2, 3, 4], [2, 4, 6, 8]);
        near(r.r, 1, 1e-9);
        near(r.pValue, 0, 1e-9);
    });
    test('finite r gives statistic + p in range', () => {
        const r = pearsonTest([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]);
        expect(r.r).toBeGreaterThan(0);
        expect(r.r).toBeLessThan(1);
        expect(r.df).toBe(3);
        expect(r.pValue).toBeGreaterThanOrEqual(0);
        expect(r.pValue).toBeLessThanOrEqual(1);
    });
});

describe('hypothesis — confidence interval', () => {
    test('95% CI of [1..5]: mean 3, margin ≈ 1.9632', () => {
        const ci = confidenceIntervalMean([1, 2, 3, 4, 5], 0.95);
        near(ci.mean, 3);
        near(ci.margin, 1.9632, 1e-3);
        near(ci.lower, 1.0368, 1e-3);
        near(ci.upper, 4.9632, 1e-3);
    });
    test('CI brackets the mean and is symmetric', () => {
        const ci = confidenceIntervalMean([2, 4, 4, 4, 5, 5, 7, 9], 0.99);
        expect(ci.lower).toBeLessThan(ci.mean);
        expect(ci.upper).toBeGreaterThan(ci.mean);
        near(ci.upper - ci.mean, ci.mean - ci.lower, 1e-9);
    });
    test('higher confidence → wider interval', () => {
        const data = [10, 12, 9, 11, 13, 8];
        expect(confidenceIntervalMean(data, 0.99).margin)
            .toBeGreaterThan(confidenceIntervalMean(data, 0.90).margin);
    });
});
