/**
 * @jest-environment node
 */
import {
    compute,
    formatResult,
    appendDigit,
    deleteLast,
    toggleSign,
    percent,
    isValidNumber,
    operatorSymbol,
    ENGINE_CONFIG,
    OPERATORS,
} from '../engine.js';

describe('Engine — compute', () => {
    test('5 + 3 = 8', () => {
        expect(compute('5', '3', '+')).toEqual({ ok: true, value: '8' });
    });
    test('10 - 4 = 6', () => {
        expect(compute('10', '4', '-')).toEqual({ ok: true, value: '6' });
    });
    test('6 * 7 = 42', () => {
        expect(compute('6', '7', '*')).toEqual({ ok: true, value: '42' });
    });
    test('20 / 4 = 5', () => {
        expect(compute('20', '4', '/')).toEqual({ ok: true, value: '5' });
    });

    test('div/0 returns computation error', () => {
        expect(compute('5', '0', '/')).toEqual({
            ok: false, error: 'Cannot ÷ by 0', type: 'computation',
        });
    });

    test('0/5 = 0', () => {
        expect(compute('0', '5', '/')).toEqual({ ok: true, value: '0' });
    });

    test('invalid operands return validation error', () => {
        expect(compute('abc', '3', '+')).toMatchObject({ ok: false, type: 'validation' });
    });

    test('overflow returns computation error', () => {
        expect(compute('1e308', '1e308', '*')).toMatchObject({ ok: false, type: 'computation' });
    });

    test('0.1 + 0.2 normalizes to 0.3 (no float noise)', () => {
        expect(compute('0.1', '0.2', '+')).toEqual({ ok: true, value: '0.3' });
    });

    test('5 - 5 = 0 (no negative zero)', () => {
        const r = compute('5', '5', '-');
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.value).toBe('0');
            expect(Object.is(parseFloat(r.value), -0)).toBe(false);
        }
    });
});

describe('Engine — formatResult', () => {
    test('integers preserved', () => {
        expect(formatResult(42)).toBe('42');
    });
    test('decimals preserved', () => {
        expect(formatResult(3.14)).toBe('3.14');
    });
    test('negative zero collapses to 0', () => {
        expect(formatResult(-0)).toBe('0');
    });
    test('huge numbers go to exponential', () => {
        const out = formatResult(1.23e20);
        expect(out).toMatch(/e/);
    });
    test('long decimals are truncated', () => {
        const out = formatResult(1 / 3);
        expect(out.length).toBeLessThanOrEqual(ENGINE_CONFIG.MAX_DISPLAY_CHARS);
    });
});

describe('Engine — appendDigit', () => {
    test('replaces leading zero', () => {
        expect(appendDigit('0', '5')).toBe('5');
    });
    test('appends digit', () => {
        expect(appendDigit('5', '3')).toBe('53');
    });
    test('prevents multiple decimals', () => {
        expect(appendDigit('1.5', '.')).toBe('1.5');
    });
    test('allows single decimal', () => {
        expect(appendDigit('5', '.')).toBe('5.');
    });
    test('respects max length', () => {
        const max = '1'.repeat(ENGINE_CONFIG.MAX_INPUT_LENGTH);
        expect(appendDigit(max, '9')).toBe(max);
    });
    test('throws on invalid digit', () => {
        expect(() => appendDigit('5', 'x')).toThrow(TypeError);
        expect(() => appendDigit('5', '+')).toThrow(TypeError);
    });
});

describe('Engine — deleteLast', () => {
    test('shortens by one', () => {
        expect(deleteLast('123')).toBe('12');
    });
    test('single digit becomes 0', () => {
        expect(deleteLast('5')).toBe('0');
    });
    test('negative sign collapses to 0', () => {
        expect(deleteLast('-5')).toBe('0');
    });
    test('lone "0" stays "0"', () => {
        expect(deleteLast('0')).toBe('0');
    });
});

describe('Engine — toggleSign', () => {
    test('positive → negative', () => {
        expect(toggleSign('5')).toBe('-5');
    });
    test('negative → positive', () => {
        expect(toggleSign('-5')).toBe('5');
    });
    test('zero stays zero (no -0)', () => {
        expect(toggleSign('0')).toBe('0');
    });
    test('throws on invalid input', () => {
        expect(() => toggleSign('abc')).toThrow(RangeError);
    });
});

describe('Engine — percent', () => {
    test('50 → 0.5', () => {
        expect(percent('50')).toBe('0.5');
    });
    test('100 → 1', () => {
        expect(percent('100')).toBe('1');
    });
});

describe('Engine — utilities', () => {
    test('isValidNumber accepts numerics', () => {
        expect(isValidNumber('5')).toBe(true);
        expect(isValidNumber('-3.14')).toBe(true);
        expect(isValidNumber('0')).toBe(true);
    });
    test('isValidNumber rejects junk', () => {
        expect(isValidNumber('abc')).toBe(false);
        expect(isValidNumber('')).toBe(false);
        expect(isValidNumber('Infinity')).toBe(false);
    });
    test('operatorSymbol maps correctly', () => {
        expect(operatorSymbol('+')).toBe('+');
        expect(operatorSymbol('-')).toBe('−');
        expect(operatorSymbol('*')).toBe('×');
        expect(operatorSymbol('/')).toBe('÷');
    });
    test('OPERATORS is exactly the four', () => {
        expect([...OPERATORS]).toEqual(['+', '-', '*', '/']);
    });
});
