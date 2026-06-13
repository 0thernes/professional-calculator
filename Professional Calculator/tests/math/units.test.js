/**
 * @jest-environment node
 */
import {
    quantity, convert, addQ, subQ, mulQ, divQ, powQ, sameDim,
    formatDim, isDimensionless, UNITS, BASE_DIMENSIONS,
} from '../../math/units.js';

const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-9) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

describe('units — conversion', () => {
    test('1 km = 1000 m', () => near(convert(1, 'km', 'm'), 1000));
    test('1 mile ≈ 1609.344 m', () => near(convert(1, 'mile', 'm'), 1609.344));
    test('12 inch = 1 ft', () => near(convert(12, 'inch', 'ft'), 1));
    test('1 hr = 3600 s', () => near(convert(1, 'hr', 's'), 3600));
    test('1 lb ≈ 0.4536 kg', () => near(convert(1, 'lb', 'kg'), 0.45359237));
    test('round trip ft→m→ft', () => near(convert(convert(5, 'ft', 'm'), 'm', 'ft'), 5));
    test('incompatible units throw', () => expect(() => convert(1, 'kg', 'm')).toThrow(RangeError));
    test('unknown unit throws', () => expect(() => convert(1, 'xyz', 'm')).toThrow(RangeError));
});

describe('units — affine temperature scales', () => {
    test('0°C = 273.15 K', () => near(convert(0, 'degC', 'K'), 273.15));
    test('100°C = 373.15 K', () => near(convert(100, 'degC', 'K'), 373.15));
    test('32°F = 0°C', () => near(convert(32, 'degF', 'degC'), 0, 1e-6));
    test('212°F = 100°C', () => near(convert(212, 'degF', 'degC'), 100, 1e-6));
    test('-40°C = -40°F', () => near(convert(-40, 'degC', 'degF'), -40, 1e-6));
});

describe('units — dimensional analysis', () => {
    test('quantity stores SI value', () => near(quantity(2, 'km').value, 2000));
    test('force is kg·m/s²', () => {
        expect(sameDim(UNITS.N.dim, UNITS.kg.dim.map((d, i) =>
            d + UNITS.m.dim[i] - 2 * UNITS.s.dim[i]))).toBe(true);
    });
    test('energy = force × distance (N·m = J)', () => {
        const work = mulQ(quantity(10, 'N'), quantity(3, 'm'));
        expect(sameDim(work.dim, UNITS.J.dim)).toBe(true);
        near(work.value, 30);
    });
    test('power = energy / time (J/s = W)', () => {
        const p = divQ(quantity(100, 'J'), quantity(4, 's'));
        expect(sameDim(p.dim, UNITS.W.dim)).toBe(true);
        near(p.value, 25);
    });
    test('velocity = distance / time', () => {
        const v = divQ(quantity(100, 'm'), quantity(10, 's'));
        near(v.value, 10);
        expect(v.dim[1]).toBe(1); // length
        expect(v.dim[2]).toBe(-1); // per time
    });
    test('cannot add kg + m', () =>
        expect(() => addQ(quantity(3, 'kg'), quantity(2, 'm'))).toThrow(RangeError));
    test('can add commensurate (m + km)', () => {
        const total = addQ(quantity(500, 'm'), quantity(1, 'km'));
        near(total.value, 1500);
    });
    test('subtract commensurate', () => near(subQ(quantity(2, 'km'), quantity(500, 'm')).value, 1500));
    test('area = length² via powQ', () => {
        const area = powQ(quantity(3, 'm'), 2);
        near(area.value, 9);
        expect(area.dim[1]).toBe(2);
    });
});

describe('units — formatting', () => {
    test('formats velocity dim', () => expect(formatDim(UNITS.W.dim)).toBe('kg·m^2/s^3'));
    test('dimensionless format', () => expect(formatDim([0, 0, 0, 0, 0, 0, 0])).toBe('1'));
    test('isDimensionless', () => {
        expect(isDimensionless(divQ(quantity(2, 'm'), quantity(1, 'm')))).toBe(true);
        expect(isDimensionless(quantity(2, 'm'))).toBe(false);
    });
    test('7 base dimensions', () => expect(BASE_DIMENSIONS).toHaveLength(7));
});
