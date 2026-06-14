/**
 * @jest-environment node
 */
import { Rng, createRng } from '../../math/random.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ eps) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

/** Collect n samples from a generator method. */
const collect = (/** @type {() => number} */ gen, /** @type {number} */ n) =>
    Array.from({ length: n }, gen);

const mean = (/** @type {number[]} */ xs) => xs.reduce((s, v) => s + v, 0) / xs.length;
const variance = (/** @type {number[]} */ xs) => {
    const m = mean(xs);
    return xs.reduce((s, v) => s + (v - m) ** 2, 0) / xs.length;
};

describe('random — reproducibility', () => {
    test('same seed → identical stream', () => {
        const a = new Rng(42);
        const b = new Rng(42);
        for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
    });
    test('different seeds → different stream', () => {
        const a = new Rng(1);
        const b = new Rng(2);
        let differs = false;
        for (let i = 0; i < 10; i++) if (a.next() !== b.next()) differs = true;
        expect(differs).toBe(true);
    });
    test('createRng factory matches Rng.next', () => {
        const f = createRng(7);
        const r = new Rng(7);
        for (let i = 0; i < 20; i++) near(f(), r.next(), 0);
    });
    test('next() stays in [0, 1)', () => {
        const r = new Rng(99);
        for (let i = 0; i < 1000; i++) {
            const x = r.next();
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThan(1);
        }
    });
});

describe('random — uniform & int', () => {
    test('uniform(a,b) stays in [a,b)', () => {
        const r = new Rng(3);
        for (let i = 0; i < 1000; i++) {
            const x = r.uniform(-2, 5);
            expect(x).toBeGreaterThanOrEqual(-2);
            expect(x).toBeLessThan(5);
        }
    });
    test('uniform mean ≈ midpoint', () => {
        const r = new Rng(5);
        near(mean(collect(() => r.uniform(0, 10), 50000)), 5, 0.1);
    });
    test('int(1,6) covers exactly 1..6', () => {
        const r = new Rng(8);
        const seen = new Set();
        for (let i = 0; i < 5000; i++) {
            const x = r.int(1, 6);
            expect(Number.isInteger(x)).toBe(true);
            expect(x).toBeGreaterThanOrEqual(1);
            expect(x).toBeLessThanOrEqual(6);
            seen.add(x);
        }
        expect(seen.size).toBe(6);
    });
    test('int(5,5) is always 5', () => {
        const r = new Rng(1);
        for (let i = 0; i < 10; i++) expect(r.int(5, 5)).toBe(5);
    });
    test('int rejects hi < lo', () => expect(() => new Rng(1).int(3, 1)).toThrow(RangeError));
});

describe('random — distributions (moments over a fixed seed)', () => {
    test('normal: mean ≈ μ, variance ≈ σ²', () => {
        const r = new Rng(12345);
        const xs = collect(() => r.normal(3, 2), 60000);
        near(mean(xs), 3, 0.05);
        near(variance(xs), 4, 0.15);
    });
    test('standard normal is roughly symmetric', () => {
        const r = new Rng(2024);
        const xs = collect(() => r.normal(), 40000);
        near(mean(xs), 0, 0.05);
    });
    test('bernoulli(0.3) proportion ≈ 0.3', () => {
        const r = new Rng(77);
        near(mean(collect(() => r.bernoulli(0.3), 50000)), 0.3, 0.02);
    });
    test('exponential: mean ≈ 1/λ', () => {
        const r = new Rng(55);
        near(mean(collect(() => r.exponential(2), 60000)), 0.5, 0.02);
    });
    test('exponential samples are non-negative', () => {
        const r = new Rng(6);
        for (let i = 0; i < 1000; i++) expect(r.exponential(1)).toBeGreaterThanOrEqual(0);
    });
    test('poisson: mean ≈ λ', () => {
        const r = new Rng(31);
        near(mean(collect(() => r.poisson(4), 40000)), 4, 0.1);
    });
    test('poisson(0) is always 0', () => {
        const r = new Rng(1);
        for (let i = 0; i < 10; i++) expect(r.poisson(0)).toBe(0);
    });
    test('exponential rejects λ ≤ 0', () => expect(() => new Rng(1).exponential(0)).toThrow(RangeError));
});

describe('random — sampling', () => {
    const items = [10, 20, 30, 40, 50];
    test('choice returns an element of the array', () => {
        const r = new Rng(9);
        for (let i = 0; i < 100; i++) expect(items).toContain(r.choice(items));
    });
    test('choice from empty throws', () => expect(() => new Rng(1).choice([])).toThrow(RangeError));
    test('shuffle is a permutation and does not mutate input', () => {
        const r = new Rng(4);
        const out = r.shuffle(items);
        expect([...out].sort((a, b) => a - b)).toEqual(items);
        expect(items).toEqual([10, 20, 30, 40, 50]); // untouched
    });
    test('shuffle is deterministic per seed', () => {
        expect(new Rng(123).shuffle(items)).toEqual(new Rng(123).shuffle(items));
    });
    test('sample draws k distinct elements', () => {
        const r = new Rng(17);
        const s = r.sample(items, 3);
        expect(s.length).toBe(3);
        expect(new Set(s).size).toBe(3);
        s.forEach((x) => expect(items).toContain(x));
    });
    test('sample rejects out-of-range k', () => {
        expect(() => new Rng(1).sample(items, 9)).toThrow(RangeError);
        expect(() => new Rng(1).sample(items, -1)).toThrow(RangeError);
    });
});
