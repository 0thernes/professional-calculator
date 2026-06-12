// @ts-check
/**
 * CalculatorEngine — pure arithmetic. No DOM, no globals, no side effects.
 *
 * Every method is referentially transparent: same inputs → same outputs.
 * This makes the engine trivially testable and re-implementable.
 *
 * @module engine
 */

/** @typedef {'+' | '-' | '*' | '/'} Operator */
/** @typedef {{ ok: true, value: string } | { ok: false, error: string, type: ErrorType }} Result */
/** @typedef {'validation' | 'computation'} ErrorType */

export const ENGINE_CONFIG = Object.freeze({
    MAX_INPUT_LENGTH:      15,
    DECIMAL_PRECISION:     10,
    DECIMAL_POWER:         1e10,
    EXPONENTIAL_THRESHOLD: 1e10,
    MAX_DISPLAY_CHARS:     18,
});

export const OPERATORS = Object.freeze(['+', '-', '*', '/']);

/**
 * @param {unknown} v
 * @returns {boolean}
 */
export function isValidNumber(v) {
    const n = parseFloat(/** @type {string} */ (v));
    return !Number.isNaN(n) && Number.isFinite(n);
}

/**
 * @param {Operator} op
 * @returns {string}
 */
export function operatorSymbol(op) {
    return /** @type {Record<Operator, string>} */ ({
        '+': '+', '-': '−', '*': '×', '/': '÷',
    })[op] || op;
}

/**
 * Apply a binary operator with full validation.
 * @param {string} previousValue
 * @param {string} currentValue
 * @param {Operator} operator
 * @returns {Result}
 */
export function compute(previousValue, currentValue, operator) {
    const prev = parseFloat(previousValue);
    const cur  = parseFloat(currentValue);

    if (!isValidNumber(prev) || !isValidNumber(cur)) {
        return { ok: false, error: 'Invalid Input', type: 'validation' };
    }

    /** @type {number} */
    let result;
    switch (operator) {
        case '+': result = prev + cur; break;
        case '-': result = prev - cur; break;
        case '*': result = prev * cur; break;
        case '/':
            if (cur === 0) return { ok: false, error: 'Cannot ÷ by 0', type: 'computation' };
            result = prev / cur;
            break;
        default:
            return { ok: false, error: 'Unknown operator', type: 'validation' };
    }

    if (!Number.isFinite(result)) {
        return { ok: false, error: 'Overflow', type: 'computation' };
    }

    return { ok: true, value: formatResult(result) };
}

/**
 * Format a number for display, handling negative zero, scientific notation,
 * and overflow truncation.
 * @param {number} num
 * @returns {string}
 */
export function formatResult(num) {
    const C = ENGINE_CONFIG;
    const rounded = Math.round(num * C.DECIMAL_POWER) / C.DECIMAL_POWER;

    // Negative-zero normalization
    if (rounded === 0) return '0';

    let result = rounded.toString();

    if (Math.abs(rounded) >= C.EXPONENTIAL_THRESHOLD) {
        const magnitude = Math.floor(Math.log10(Math.abs(rounded)));
        const decimals  = Math.max(0, C.DECIMAL_PRECISION - magnitude);
        result = rounded.toExponential(Math.min(decimals, 10));
    } else if (result.length > C.MAX_DISPLAY_CHARS) {
        const parts = result.split('.');
        if (parts[1] && parts[1].length > 8) {
            result = rounded.toFixed(8).replace(/\.?0+$/, '');
        }
    }
    return result;
}

/**
 * Append a digit or decimal point to a value with all input rules applied.
 * @param {string} currentValue
 * @param {string} digit  Single char: '0'-'9' or '.'
 * @returns {string} New value (caller decides whether to commit it)
 */
export function appendDigit(currentValue, digit) {
    if (!/^[0-9.]$/.test(digit)) {
        throw new TypeError(`Invalid digit: ${digit}`);
    }
    if (currentValue.length >= ENGINE_CONFIG.MAX_INPUT_LENGTH) {
        return currentValue;
    }
    if (digit === '.') {
        if (currentValue.includes('.')) return currentValue;
        return currentValue + '.';
    }
    if (currentValue === '0') return digit;
    return currentValue + digit;
}

/**
 * Delete the last character of a value, returning '0' if empty.
 * @param {string} currentValue
 * @returns {string}
 */
export function deleteLast(currentValue) {
    if (currentValue.length <= 1 || currentValue === '-0') return '0';
    const next = currentValue.slice(0, -1);
    if (next === '-' || next === '') return '0';
    return next;
}

/**
 * Toggle the sign of a value, treating zero as canonical '0' (no '-0').
 * @param {string} currentValue
 * @returns {string}
 */
export function toggleSign(currentValue) {
    if (!isValidNumber(currentValue)) {
        throw new RangeError(`Cannot toggle sign of: ${currentValue}`);
    }
    const v = parseFloat(currentValue);
    return v === 0 ? '0' : (-v).toString();
}

/**
 * Compute percentage of a value.
 * @param {string} currentValue
 * @returns {string}
 */
export function percent(currentValue) {
    if (!isValidNumber(currentValue)) {
        throw new RangeError(`Cannot percent: ${currentValue}`);
    }
    return formatResult(parseFloat(currentValue) / 100);
}
