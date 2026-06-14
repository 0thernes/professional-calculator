/**
 * @jest-environment node
 */
import {
    dft, idft, fft, ifft, rfft, nextPow2,
    magnitude, phase, powerSpectrum,
    convolve, crossCorrelate, autocorrelate,
    hann, hamming, blackman, applyWindow, frequencies,
} from '../../math/signal.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-9) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

/** @param {{re:number, im:number}[]} a @param {{re:number, im:number}[]} b */
const nearC = (a, b, eps = 1e-9) => {
    expect(a.length).toBe(b.length);
    a.forEach((z, i) => { near(z.re, b[i].re, eps); near(z.im, b[i].im, eps); });
};

describe('signal — helpers', () => {
    test('nextPow2', () => {
        expect(nextPow2(1)).toBe(1);
        expect(nextPow2(5)).toBe(8);
        expect(nextPow2(8)).toBe(8);
        expect(nextPow2(1000)).toBe(1024);
    });
});

describe('signal — DFT closed forms', () => {
    test('impulse → flat spectrum (all ones)', () => {
        const X = dft([1, 0, 0, 0]);
        nearC(X, [{ re: 1, im: 0 }, { re: 1, im: 0 }, { re: 1, im: 0 }, { re: 1, im: 0 }]);
    });
    test('constant → single DC bin = N at k=0', () => {
        const X = dft([1, 1, 1, 1]);
        near(X[0].re, 4); near(X[0].im, 0);
        for (let k = 1; k < 4; k++) { near(X[k].re, 0); near(X[k].im, 0); }
    });
    test('known 4-point DFT of [1,2,3,4]', () => {
        // X0=10, X1=-2+2i, X2=-2, X3=-2-2i
        nearC(dft([1, 2, 3, 4]), [
            { re: 10, im: 0 }, { re: -2, im: 2 }, { re: -2, im: 0 }, { re: -2, im: -2 },
        ]);
    });
    test('idft inverts dft', () => {
        const x = [3, 1, 4, 1, 5, 9];
        const back = idft(dft(x)).map((z) => z.re);
        x.forEach((v, i) => near(back[i], v));
    });
});

describe('signal — FFT matches DFT and round-trips', () => {
    test('radix-2 (N=8) FFT equals naive DFT', () => {
        const x = [1, 2, 3, 4, 5, 6, 7, 8];
        nearC(fft(x), dft(x), 1e-9);
    });
    test('Bluestein (N=6, non-power-of-2) equals naive DFT', () => {
        const x = [2, -1, 3, 0, 1, -2];
        nearC(fft(x), dft(x), 1e-8);
    });
    test('Bluestein (N=7, prime) equals naive DFT', () => {
        const x = [1, 0, -1, 2, -2, 0.5, 3];
        nearC(fft(x), dft(x), 1e-8);
    });
    test('ifft(fft(x)) == x for power-of-2 length', () => {
        const x = [1.5, -2, 3.25, 0, -1, 8, 2, -3];
        const back = ifft(fft(x)).map((z) => z.re);
        x.forEach((v, i) => near(back[i], v, 1e-9));
    });
    test('ifft(fft(x)) == x for non-power-of-2 length', () => {
        const x = [4, 1, -3, 2, 5];
        const back = ifft(fft(x)).map((z) => z.re);
        x.forEach((v, i) => near(back[i], v, 1e-8));
    });
    test('complex input round-trips', () => {
        const x = [{ re: 1, im: 1 }, { re: 2, im: -1 }, { re: 0, im: 3 }];
        nearC(ifft(fft(x)), x, 1e-8);
    });
    test('linearity: fft(a)+fft(b) == fft(a+b)', () => {
        const a = [1, 2, 3, 4];
        const b = [4, 3, 2, 1];
        const fa = fft(a);
        const fb = fft(b);
        const sum = fft(a.map((v, i) => v + b[i]));
        sum.forEach((z, i) => { near(z.re, fa[i].re + fb[i].re); near(z.im, fa[i].im + fb[i].im); });
    });
    test('empty and singleton', () => {
        expect(fft([])).toEqual([]);
        nearC(fft([7]), [{ re: 7, im: 0 }]);
    });
});

describe('signal — Parseval / energy theorem', () => {
    test('Σ|x|² == (1/N) Σ|X|²', () => {
        const x = [1, 2, 3, 4, 5, 6, 7, 8];
        const timeEnergy = x.reduce((s, v) => s + v * v, 0);
        const freqEnergy = powerSpectrum(fft(x)).reduce((s, v) => s + v, 0) / x.length;
        near(timeEnergy, freqEnergy, 1e-6);
    });
});

describe('signal — magnitude / phase', () => {
    test('magnitude of DC spike', () => {
        const mag = magnitude(fft([1, 1, 1, 1]));
        near(mag[0], 4); near(mag[1], 0); near(mag[2], 0); near(mag[3], 0);
    });
    test('phase of [1,2,3,4] bin 1 is +135°', () => {
        // X1 = -2+2i → arg = 3π/4
        const ph = phase(fft([1, 2, 3, 4]));
        near(ph[1], (3 * Math.PI) / 4, 1e-9);
    });
    test('rfft returns ⌊N/2⌋+1 bins', () => {
        expect(rfft([1, 2, 3, 4, 5, 6, 7, 8]).length).toBe(5);
        expect(rfft([1, 2, 3, 4, 5]).length).toBe(3);
    });
});

describe('signal — convolution / correlation', () => {
    test('linear convolution closed form', () => {
        const c = convolve([1, 2, 3], [0, 1, 0.5]);
        expect(c.length).toBe(5);
        [0, 1, 2.5, 4, 1.5].forEach((v, i) => near(c[i], v, 1e-9));
    });
    test('convolution with unit impulse is identity', () => {
        const c = convolve([5, 6, 7], [1]);
        [5, 6, 7].forEach((v, i) => near(c[i], v));
    });
    test('cross-correlation is symmetric with energy peak at centre', () => {
        const r = crossCorrelate([1, 2, 3], [1, 2, 3]);
        [3, 8, 14, 8, 3].forEach((v, i) => near(r[i], v, 1e-9));
        near(r[2], 1 + 4 + 9); // zero-lag = energy
    });
    test('autocorrelation peak equals signal energy', () => {
        const sig = [2, -1, 4];
        const r = autocorrelate(sig);
        near(r[sig.length - 1], sig.reduce((s, v) => s + v * v, 0), 1e-9);
    });
    test('empty operands', () => {
        expect(convolve([], [1, 2])).toEqual([]);
        expect(convolve([1, 2], [])).toEqual([]);
    });
});

describe('signal — windows', () => {
    test('hann: endpoints 0, midpoint 1, symmetric', () => {
        const w = hann(9);
        near(w[0], 0); near(w[8], 0); near(w[4], 1);
        for (let i = 0; i < 9; i++) near(w[i], w[8 - i]);
    });
    test('hann(1) === [1]', () => expect(hann(1)).toEqual([1]));
    test('hamming endpoints are 0.08', () => {
        const w = hamming(16);
        near(w[0], 0.08); near(w[15], 0.08);
    });
    test('blackman endpoints ~0', () => {
        const w = blackman(32);
        near(w[0], 0, 1e-12); near(w[31], 0, 1e-12);
    });
    test('applyWindow multiplies elementwise; length mismatch throws', () => {
        expect(applyWindow([2, 4, 6], [1, 0.5, 0])).toEqual([2, 2, 0]);
        expect(() => applyWindow([1, 2], [1])).toThrow(RangeError);
    });
});

describe('signal — frequency axis', () => {
    test('fftfreq(8) layout (NumPy convention)', () => {
        const f = frequencies(8, 8); // sampleRate 8 → integer Hz
        expect(f).toEqual([0, 1, 2, 3, -4, -3, -2, -1]);
    });
    test('fftfreq(5) layout', () => {
        const f = frequencies(5, 5);
        expect(f).toEqual([0, 1, 2, -2, -1]);
    });
    test('default sampleRate normalises to cycles/sample', () => {
        const f = frequencies(4);
        [0, 0.25, -0.5, -0.25].forEach((v, i) => near(f[i], v));
    });
});
