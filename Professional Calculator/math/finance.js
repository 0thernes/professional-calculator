// @ts-check
/**
 * Quantitative finance: time value of money, cash-flow analysis, and option
 * pricing. The IRR solver uses Newton with a bisection fallback; option
 * pricing uses the closed-form Black–Scholes–Merton model with the normal
 * CDF from {@link module:math/stats}.
 *
 * @module math/finance
 */

import { normalCdf } from './stats.js';

/**
 * Future value of a present sum under compound interest.
 * FV = PV·(1+r)ⁿ
 * @param {number} pv  present value
 * @param {number} rate  per-period rate (e.g. 0.05)
 * @param {number} periods
 * @returns {number}
 */
export function futureValue(pv, rate, periods) {
    return pv * Math.pow(1 + rate, periods);
}

/**
 * Present value of a future sum.
 * PV = FV/(1+r)ⁿ
 * @param {number} fv
 * @param {number} rate
 * @param {number} periods
 * @returns {number}
 */
export function presentValue(fv, rate, periods) {
    return fv / Math.pow(1 + rate, periods);
}

/**
 * Present value of a level annuity (ordinary, payments at period end).
 * PV = PMT·(1−(1+r)⁻ⁿ)/r
 * @param {number} pmt
 * @param {number} rate
 * @param {number} periods
 * @returns {number}
 */
export function annuityPV(pmt, rate, periods) {
    if (rate === 0) return pmt * periods;
    return (pmt * (1 - Math.pow(1 + rate, -periods))) / rate;
}

/**
 * Future value of a level annuity.
 * FV = PMT·((1+r)ⁿ−1)/r
 * @param {number} pmt
 * @param {number} rate
 * @param {number} periods
 * @returns {number}
 */
export function annuityFV(pmt, rate, periods) {
    if (rate === 0) return pmt * periods;
    return (pmt * (Math.pow(1 + rate, periods) - 1)) / rate;
}

/**
 * Level payment that amortizes a loan of `principal` over `periods`.
 * PMT = P·r/(1−(1+r)⁻ⁿ)
 * @param {number} principal
 * @param {number} rate
 * @param {number} periods
 * @returns {number}
 */
export function payment(principal, rate, periods) {
    if (rate === 0) return principal / periods;
    return (principal * rate) / (1 - Math.pow(1 + rate, -periods));
}

/**
 * Net present value of a cash-flow series (cash[0] at t=0).
 * NPV = Σ cashₜ/(1+r)ᵗ
 * @param {number} rate
 * @param {number[]} cashflows
 * @returns {number}
 */
export function npv(rate, cashflows) {
    let acc = 0;
    for (let t = 0; t < cashflows.length; t++) {
        acc += cashflows[t] / Math.pow(1 + rate, t);
    }
    return acc;
}

/**
 * Internal rate of return: the rate r with NPV(r)=0. Newton's method with a
 * bracketing bisection fallback for robustness on awkward series.
 * @param {number[]} cashflows
 * @param {object} [opts]
 * @param {number} [opts.guess]
 * @param {number} [opts.tol]
 * @param {number} [opts.maxIter]
 * @returns {number}
 */
export function irr(cashflows, opts = {}) {
    const { guess = 0.1, tol = 1e-10, maxIter = 200 } = opts;
    /** @param {number} r */
    const f = (r) => npv(r, cashflows);
    /** @param {number} r */
    const df = (r) => {
        let acc = 0;
        for (let t = 1; t < cashflows.length; t++) {
            acc += (-t * cashflows[t]) / Math.pow(1 + r, t + 1);
        }
        return acc;
    };
    // Newton
    let r = guess;
    for (let i = 0; i < maxIter; i++) {
        const fr = f(r);
        if (Math.abs(fr) < tol) return r;
        const d = df(r);
        if (d === 0) break;
        const next = r - fr / d;
        if (!Number.isFinite(next) || next <= -1) break;
        if (Math.abs(next - r) < tol) return next;
        r = next;
    }
    // Bisection fallback on a wide bracket
    let lo = -0.9999;
    let hi = 10;
    let flo = f(lo);
    let fhi = f(hi);
    if (flo * fhi > 0) return NaN; // no sign change → no real IRR in range
    for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        const fm = f(mid);
        if (Math.abs(fm) < tol) return mid;
        if (flo * fm < 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
    }
    return (lo + hi) / 2;
}

/**
 * Effective annual rate from a nominal rate compounded `m` times per year.
 * EAR = (1 + nominal/m)^m − 1
 * @param {number} nominal
 * @param {number} m
 * @returns {number}
 */
export function effectiveRate(nominal, m) {
    return Math.pow(1 + nominal / m, m) - 1;
}

/**
 * Continuously-compounded effective rate: e^nominal − 1.
 * @param {number} nominal
 * @returns {number}
 */
export function continuousRate(nominal) {
    return Math.exp(nominal) - 1;
}

/**
 * @typedef {object} AmortRow
 * @property {number} period
 * @property {number} payment
 * @property {number} interest
 * @property {number} principal
 * @property {number} balance
 */

/**
 * Full amortization schedule for a fully-amortizing loan.
 * @param {number} principal
 * @param {number} rate  per-period rate
 * @param {number} periods
 * @returns {AmortRow[]}
 */
export function amortization(principal, rate, periods) {
    const pmt = payment(principal, rate, periods);
    /** @type {AmortRow[]} */
    const schedule = [];
    let balance = principal;
    for (let p = 1; p <= periods; p++) {
        const interest = balance * rate;
        const principalPaid = pmt - interest;
        balance = Math.max(0, balance - principalPaid);
        schedule.push({ period: p, payment: pmt, interest, principal: principalPaid, balance });
    }
    return schedule;
}

/**
 * @typedef {object} BlackScholes
 * @property {number} call
 * @property {number} put
 * @property {number} d1
 * @property {number} d2
 */

/**
 * Black–Scholes–Merton European option prices (no dividends).
 *   d1 = (ln(S/K) + (r + σ²/2)T) / (σ√T)
 *   d2 = d1 − σ√T
 *   call = S·Φ(d1) − K·e^{−rT}·Φ(d2)
 *   put  = K·e^{−rT}·Φ(−d2) − S·Φ(−d1)
 * @param {number} S  spot price
 * @param {number} K  strike
 * @param {number} r  risk-free rate (annualized)
 * @param {number} sigma  volatility (annualized)
 * @param {number} T  time to expiry in years
 * @returns {BlackScholes}
 */
export function blackScholes(S, K, r, sigma, T) {
    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;
    const disc = Math.exp(-r * T);
    const call = S * normalCdf(d1) - K * disc * normalCdf(d2);
    const put = K * disc * normalCdf(-d2) - S * normalCdf(-d1);
    return { call, put, d1, d2 };
}

/**
 * Compound Annual Growth Rate from begin/end values over n periods.
 * CAGR = (end/begin)^{1/n} − 1
 * @param {number} begin
 * @param {number} end
 * @param {number} periods
 * @returns {number}
 */
export function cagr(begin, end, periods) {
    return Math.pow(end / begin, 1 / periods) - 1;
}
