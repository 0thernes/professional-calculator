/**
 * @jest-environment node
 */
import {
    futureValue, presentValue, annuityPV, annuityFV, payment,
    npv, irr, effectiveRate, continuousRate, amortization, blackScholes, cagr,
} from '../../math/finance.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-4) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

describe('finance — time value of money', () => {
    test('FV of $1000 at 5% for 10y', () => near(futureValue(1000, 0.05, 10), 1628.894627));
    test('PV inverts FV', () => near(presentValue(futureValue(1000, 0.05, 10), 0.05, 10), 1000));
    test('annuity PV ($100/yr, 5%, 10y)', () => near(annuityPV(100, 0.05, 10), 772.173493));
    test('annuity FV ($100/yr, 5%, 10y)', () => near(annuityFV(100, 0.05, 10), 1257.789254));
    test('zero-rate annuity = pmt × n', () => near(annuityPV(100, 0, 12), 1200));
    test('loan payment ($200k, 0.5%/mo, 360mo)', () => near(payment(200000, 0.005, 360), 1199.101087, 1e-3));
});

describe('finance — NPV & IRR', () => {
    test('NPV at 10%', () => near(npv(0.1, [-1000, 500, 500, 500]), 243.42599, 1e-3));
    test('NPV at 0% = sum of flows', () => near(npv(0, [-1000, 600, 600]), 200));
    test('IRR of [-1000,500,500,500] ≈ 23.38% and zeroes NPV', () => {
        const flows = [-1000, 500, 500, 500];
        const r = irr(flows);
        near(npv(r, flows), 0, 1e-6); // the defining invariant
        expect(r).toBeGreaterThan(0.23);
        expect(r).toBeLessThan(0.24);
    });
    test('IRR makes NPV zero', () => {
        const r = irr([-5000, 1500, 2000, 2500, 1000]);
        near(npv(r, [-5000, 1500, 2000, 2500, 1000]), 0, 1e-6);
    });
    test('IRR of even doubling', () => near(irr([-100, 0, 121]), 0.1, 1e-6)); // 1.1^2 = 1.21
});

describe('finance — rates', () => {
    test('EAR of 12% nominal monthly ≈ 12.6825%', () => near(effectiveRate(0.12, 12), 0.12682503, 1e-6));
    test('EAR ≥ nominal', () => expect(effectiveRate(0.08, 4)).toBeGreaterThan(0.08));
    test('continuous rate e^r - 1', () => near(continuousRate(0.1), Math.exp(0.1) - 1));
    test('CAGR: 100→200 over 10y ≈ 7.18%', () => near(cagr(100, 200, 10), 0.0717734625, 1e-8));
});

describe('finance — amortization', () => {
    const sched = amortization(10000, 0.01, 12);
    test('12 rows', () => expect(sched).toHaveLength(12));
    test('final balance ≈ 0', () => near(sched[11].balance, 0, 1e-6));
    test('payment constant', () => {
        const p = sched[0].payment;
        for (const row of sched) near(row.payment, p);
    });
    test('interest decreases over time', () =>
        expect(sched[11].interest).toBeLessThan(sched[0].interest));
    test('principal + interest = payment', () =>
        near(sched[0].principal + sched[0].interest, sched[0].payment));
});

describe('finance — Black–Scholes', () => {
    // Reference: S=100, K=100, r=5%, σ=20%, T=1 → call ≈ 10.4506, put ≈ 5.5735
    const bs = blackScholes(100, 100, 0.05, 0.2, 1);
    test('ATM call price', () => near(bs.call, 10.4506, 1e-3));
    test('ATM put price', () => near(bs.put, 5.5735, 1e-3));
    test('put-call parity: C - P = S - K·e^{-rT}', () => {
        const parity = 100 - 100 * Math.exp(-0.05 * 1);
        near(bs.call - bs.put, parity, 1e-6);
    });
    test('deep ITM call ≈ intrinsic + carry', () => {
        const deep = blackScholes(200, 100, 0.05, 0.2, 1);
        expect(deep.call).toBeGreaterThan(100);
    });
    test('d1 > d2', () => expect(bs.d1).toBeGreaterThan(bs.d2));
});
