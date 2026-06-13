// @ts-check
/**
 * Signal processing — the discrete Fourier transform and its companions.
 *
 * Forward/inverse DFT (naive O(N²), kept as an exact reference) plus a fast
 * O(N log N) FFT: an iterative radix-2 Cooley–Tukey kernel for power-of-two
 * lengths, with a Bluestein chirp-z fallback so that *any* length transforms
 * in O(N log N) rather than degrading to the quadratic DFT. Built on top of
 * those: magnitude/phase spectra, linear convolution and cross-correlation
 * (via the convolution theorem), the common analysis windows
 * (Hann/Hamming/Blackman), and DFT-bin → frequency mapping.
 *
 * Complex data uses the same plain `{ re, im }` shape as the rest of the
 * engine (see {@link module:math/complex}). Every transform accepts either a
 * real `number[]` (imaginary part taken as 0) or a `{re,im}[]` array and
 * returns a fresh `{re,im}[]`. Convolution/correlation assume real signals
 * and return `number[]`.
 *
 * @module math/signal
 */

/** @typedef {{ re: number, im: number }} Cpx */
/** @typedef {ReadonlyArray<number | Cpx>} Signal */

/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */

/**
 * Normalise a real-or-complex input array to a fresh `{re,im}[]`.
 * @param {Signal} x
 * @returns {Cpx[]}
 */
function toCpxArray(x) {
    return Array.from(x, (v) =>
        typeof v === 'number' ? { re: v, im: 0 } : { re: v.re, im: v.im });
}

/** @param {number} n @returns {boolean} true when n is a positive power of two. */
function isPow2(n) {
    return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Smallest power of two ≥ n (and ≥ 1).
 * @param {number} n
 * @returns {number}
 */
export function nextPow2(n) {
    let p = 1;
    while (p < n) p <<= 1;
    return p;
}

/* ------------------------------------------------------------------ *
 *  Naive DFT — exact reference, any length, O(N²)
 * ------------------------------------------------------------------ */

/**
 * Forward discrete Fourier transform, X[k] = Σ x[n]·e^(−2πi·kn/N).
 * Quadratic; use {@link fft} for large inputs. Handy as a ground truth.
 * @param {Signal} input
 * @returns {Cpx[]}
 */
export function dft(input) {
    const x = toCpxArray(input);
    const N = x.length;
    const out = new Array(N);
    for (let k = 0; k < N; k++) {
        let sre = 0;
        let sim = 0;
        for (let n = 0; n < N; n++) {
            const ang = (-2 * Math.PI * k * n) / N;
            const c = Math.cos(ang);
            const s = Math.sin(ang);
            sre += x[n].re * c - x[n].im * s;
            sim += x[n].re * s + x[n].im * c;
        }
        out[k] = { re: sre, im: sim };
    }
    return out;
}

/**
 * Inverse discrete Fourier transform, x[n] = (1/N) Σ X[k]·e^(+2πi·kn/N).
 * @param {Signal} input
 * @returns {Cpx[]}
 */
export function idft(input) {
    const X = toCpxArray(input);
    const N = X.length;
    const out = new Array(N);
    for (let n = 0; n < N; n++) {
        let sre = 0;
        let sim = 0;
        for (let k = 0; k < N; k++) {
            const ang = (2 * Math.PI * k * n) / N;
            const c = Math.cos(ang);
            const s = Math.sin(ang);
            sre += X[k].re * c - X[k].im * s;
            sim += X[k].re * s + X[k].im * c;
        }
        out[n] = { re: sre / N, im: sim / N };
    }
    return out;
}

/* ------------------------------------------------------------------ *
 *  Fast transforms — radix-2 Cooley–Tukey + Bluestein fallback
 * ------------------------------------------------------------------ */

/**
 * In-place iterative radix-2 FFT on parallel real/imag buffers.
 * `dir` is −1 for the forward transform, +1 for the inverse (no 1/N scaling
 * is applied here — the caller scales). Length MUST be a power of two.
 * @param {Float64Array} re
 * @param {Float64Array} im
 * @param {number} dir
 * @returns {void}
 */
function fftRadix2(re, im, dir) {
    const N = re.length;
    // Decimation-in-time bit-reversal permutation.
    for (let i = 1, j = 0; i < N; i++) {
        let bit = N >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) {
            const tr = re[i]; re[i] = re[j]; re[j] = tr;
            const ti = im[i]; im[i] = im[j]; im[j] = ti;
        }
    }
    for (let len = 2; len <= N; len <<= 1) {
        const ang = (dir * 2 * Math.PI) / len;
        const wRe = Math.cos(ang);
        const wIm = Math.sin(ang);
        const half = len >> 1;
        for (let i = 0; i < N; i += len) {
            let curRe = 1;
            let curIm = 0;
            for (let k = 0; k < half; k++) {
                const aRe = re[i + k];
                const aIm = im[i + k];
                const bRe = re[i + k + half];
                const bIm = im[i + k + half];
                const tRe = bRe * curRe - bIm * curIm;
                const tIm = bRe * curIm + bIm * curRe;
                re[i + k] = aRe + tRe;
                im[i + k] = aIm + tIm;
                re[i + k + half] = aRe - tRe;
                im[i + k + half] = aIm - tIm;
                const nextRe = curRe * wRe - curIm * wIm;
                curIm = curRe * wIm + curIm * wRe;
                curRe = nextRe;
            }
        }
    }
}

/**
 * Bluestein's chirp-z algorithm: an arbitrary-length DFT expressed as a
 * power-of-two convolution, so any N runs in O(N log N).
 * `dir` matches {@link fftRadix2}. Returns un-scaled spectra.
 * @param {Cpx[]} x
 * @param {number} dir
 * @returns {{ re: Float64Array, im: Float64Array }}
 */
function bluestein(x, dir) {
    const N = x.length;
    const m = nextPow2(2 * N - 1);
    const aRe = new Float64Array(m);
    const aIm = new Float64Array(m);
    const bRe = new Float64Array(m);
    const bIm = new Float64Array(m);

    // Chirp P(n) = e^(dir·iπ·n²/N); Q(n) = conj(P(n)). Reduce n² mod 2N before
    // scaling by π/N so the angle (and its cos/sin) stays accurate for large n.
    for (let n = 0; n < N; n++) {
        const ang = (dir * Math.PI * ((n * n) % (2 * N))) / N;
        const pRe = Math.cos(ang);
        const pIm = Math.sin(ang);
        aRe[n] = x[n].re * pRe - x[n].im * pIm;
        aIm[n] = x[n].re * pIm + x[n].im * pRe;
        bRe[n] = pRe;
        bIm[n] = -pIm;
        if (n > 0) {
            bRe[m - n] = pRe;
            bIm[m - n] = -pIm;
        }
    }

    // Circular convolution a ⊛ b via FFT (length m is a power of two).
    fftRadix2(aRe, aIm, -1);
    fftRadix2(bRe, bIm, -1);
    for (let i = 0; i < m; i++) {
        const re = aRe[i] * bRe[i] - aIm[i] * bIm[i];
        const im = aRe[i] * bIm[i] + aIm[i] * bRe[i];
        aRe[i] = re;
        aIm[i] = im;
    }
    fftRadix2(aRe, aIm, 1);
    for (let i = 0; i < m; i++) {
        aRe[i] /= m;
        aIm[i] /= m;
    }

    // X[k] = P(k) · c[k].
    const outRe = new Float64Array(N);
    const outIm = new Float64Array(N);
    for (let k = 0; k < N; k++) {
        const ang = (dir * Math.PI * ((k * k) % (2 * N))) / N;
        const pRe = Math.cos(ang);
        const pIm = Math.sin(ang);
        outRe[k] = aRe[k] * pRe - aIm[k] * pIm;
        outIm[k] = aRe[k] * pIm + aIm[k] * pRe;
    }
    return { re: outRe, im: outIm };
}

/**
 * Shared FFT driver: dispatch to radix-2 or Bluestein and box the result.
 * @param {Signal} input
 * @param {boolean} inverse
 * @returns {Cpx[]}
 */
function fftCore(input, inverse) {
    const x = toCpxArray(input);
    const N = x.length;
    if (N === 0) return [];
    if (N === 1) return [{ re: x[0].re, im: x[0].im }];
    const dir = inverse ? 1 : -1;
    let re;
    let im;
    if (isPow2(N)) {
        re = Float64Array.from(x, (v) => v.re);
        im = Float64Array.from(x, (v) => v.im);
        fftRadix2(re, im, dir);
    } else {
        ({ re, im } = bluestein(x, dir));
    }
    const scale = inverse ? 1 / N : 1;
    const out = new Array(N);
    for (let i = 0; i < N; i++) out[i] = { re: re[i] * scale, im: im[i] * scale };
    return out;
}

/**
 * Fast Fourier transform of a real or complex signal of any length.
 * @param {Signal} input
 * @returns {Cpx[]}
 */
export function fft(input) {
    return fftCore(input, false);
}

/**
 * Inverse fast Fourier transform (1/N normalised). `ifft(fft(x))` recovers x.
 * @param {Signal} input
 * @returns {Cpx[]}
 */
export function ifft(input) {
    return fftCore(input, true);
}

/**
 * Real-input FFT returning only the non-redundant half, bins 0…⌊N/2⌋.
 * (For real x the upper half is the conjugate mirror of the lower.)
 * @param {ReadonlyArray<number>} real
 * @returns {Cpx[]}
 */
export function rfft(real) {
    return fft(real).slice(0, Math.floor(real.length / 2) + 1);
}

/* ------------------------------------------------------------------ *
 *  Spectra
 * ------------------------------------------------------------------ */

/**
 * Magnitude spectrum |X[k]| of a complex spectrum.
 * @param {ReadonlyArray<Cpx>} spectrum
 * @returns {number[]}
 */
export function magnitude(spectrum) {
    return spectrum.map((z) => Math.hypot(z.re, z.im));
}

/**
 * Phase spectrum arg(X[k]) in radians, in (−π, π].
 * @param {ReadonlyArray<Cpx>} spectrum
 * @returns {number[]}
 */
export function phase(spectrum) {
    return spectrum.map((z) => Math.atan2(z.im, z.re));
}

/**
 * Power spectrum |X[k]|² of a complex spectrum.
 * @param {ReadonlyArray<Cpx>} spectrum
 * @returns {number[]}
 */
export function powerSpectrum(spectrum) {
    return spectrum.map((z) => z.re * z.re + z.im * z.im);
}

/* ------------------------------------------------------------------ *
 *  Convolution / correlation (real signals)
 * ------------------------------------------------------------------ */

/**
 * Forward-transform a real/complex signal zero-padded to length m (power of 2).
 * @param {Signal} input
 * @param {number} m
 * @returns {{ re: Float64Array, im: Float64Array }}
 */
function fftPad(input, m) {
    const x = toCpxArray(input);
    const re = new Float64Array(m);
    const im = new Float64Array(m);
    for (let i = 0; i < x.length; i++) {
        re[i] = x[i].re;
        im[i] = x[i].im;
    }
    fftRadix2(re, im, -1);
    return { re, im };
}

/**
 * Linear convolution (a * b) of two real signals, via the convolution theorem.
 * Result length is a.length + b.length − 1.
 * @param {ReadonlyArray<number>} a
 * @param {ReadonlyArray<number>} b
 * @returns {number[]}
 */
export function convolve(a, b) {
    const la = a.length;
    const lb = b.length;
    if (la === 0 || lb === 0) return [];
    const n = la + lb - 1;
    const m = nextPow2(n);
    const A = fftPad(a, m);
    const B = fftPad(b, m);
    const re = new Float64Array(m);
    const im = new Float64Array(m);
    for (let i = 0; i < m; i++) {
        re[i] = A.re[i] * B.re[i] - A.im[i] * B.im[i];
        im[i] = A.re[i] * B.im[i] + A.im[i] * B.re[i];
    }
    fftRadix2(re, im, 1);
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = re[i] / m;
    return out;
}

/**
 * Linear cross-correlation of two real signals, computed as the convolution
 * of `a` with the time-reversed `b`. The returned array has length
 * a.length + b.length − 1; element at index `i` is the correlation at lag
 * `i − (b.length − 1)` (so the zero-lag term sits at index b.length − 1).
 * @param {ReadonlyArray<number>} a
 * @param {ReadonlyArray<number>} b
 * @returns {number[]}
 */
export function crossCorrelate(a, b) {
    return convolve(a, [...b].reverse());
}

/**
 * Autocorrelation of a real signal (cross-correlation with itself). The peak
 * at the centre index (signal.length − 1) equals the signal's energy Σxᵢ².
 * @param {ReadonlyArray<number>} signal
 * @returns {number[]}
 */
export function autocorrelate(signal) {
    return crossCorrelate(signal, signal);
}

/* ------------------------------------------------------------------ *
 *  Analysis windows
 * ------------------------------------------------------------------ */

/**
 * Hann (raised-cosine) window of length n. Endpoints are 0.
 * @param {number} n
 * @returns {number[]}
 */
export function hann(n) {
    if (n === 1) return [1];
    return Array.from({ length: n }, (_, i) =>
        0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1))));
}

/**
 * Hamming window of length n. Endpoints are 0.08.
 * @param {number} n
 * @returns {number[]}
 */
export function hamming(n) {
    if (n === 1) return [1];
    return Array.from({ length: n }, (_, i) =>
        0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (n - 1)));
}

/**
 * Blackman window of length n. Endpoints are ~0.
 * @param {number} n
 * @returns {number[]}
 */
export function blackman(n) {
    if (n === 1) return [1];
    return Array.from({ length: n }, (_, i) => {
        const t = (2 * Math.PI * i) / (n - 1);
        return 0.42 - 0.5 * Math.cos(t) + 0.08 * Math.cos(2 * t);
    });
}

/**
 * Apply a window (elementwise multiply) to a real signal.
 * @param {ReadonlyArray<number>} signal
 * @param {ReadonlyArray<number>} window
 * @returns {number[]}
 */
export function applyWindow(signal, window) {
    if (signal.length !== window.length) {
        throw new RangeError('signal and window must have equal length');
    }
    return signal.map((v, i) => v * window[i]);
}

/* ------------------------------------------------------------------ *
 *  Frequency axis
 * ------------------------------------------------------------------ */

/**
 * DFT-bin frequencies for an N-point transform sampled at `sampleRate`,
 * laid out the way {@link fft} orders its output: 0, 1, … then the negative
 * frequencies (matching NumPy's `fftfreq`). Units match `sampleRate`.
 * @param {number} n
 * @param {number} [sampleRate]
 * @returns {number[]}
 */
export function frequencies(n, sampleRate = 1) {
    const out = new Array(n);
    const half = Math.floor((n - 1) / 2) + 1;
    for (let i = 0; i < half; i++) out[i] = (i * sampleRate) / n;
    for (let i = half; i < n; i++) out[i] = ((i - n) * sampleRate) / n;
    return out;
}
