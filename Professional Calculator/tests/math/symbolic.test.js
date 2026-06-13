/**
 * @jest-environment node
 */
import { diff, differentiate, simplify, astToString, equal } from '../../math/symbolic.js';
import { parse, evalExpr } from '../../math/parser.js';
import { derivative } from '../../math/calculus.js';

/**
 * Strong anchor: the symbolic derivative, evaluated numerically at several
 * points, must match a finite-difference derivative of the original function.
 * @param {string} expr
 * @param {number[]} xs
 */
function matchesNumericDerivative(expr, xs) {
    const dStr = diff(expr, 'x').string;
    for (const x of xs) {
        const symbolic = evalExpr(dStr, { x }).re;
        const numeric = derivative((t) => evalExpr(expr, { x: t }).re, x);
        expect(Math.abs(symbolic - numeric)).toBeLessThan(1e-5);
    }
}

describe('symbolic — basic rules (rendered form)', () => {
    test('d/dx c = 0', () => expect(diff('5', 'x').string).toBe('0'));
    test('d/dx x = 1', () => expect(diff('x', 'x').string).toBe('1'));
    test('d/dx y = 0 (other var)', () => expect(diff('y', 'x').string).toBe('0'));
    test('d/dx x^2 = 2·x', () => expect(diff('x^2', 'x').string).toBe('2 · x'));
    test('d/dx x^3 = 3·x^2', () => expect(diff('x^3', 'x').string).toBe('3 · x ^ 2'));
    test('d/dx sin(x) = cos(x)', () => expect(diff('sin(x)', 'x').string).toBe('cos(x)'));
    test('d/dx cos(x) = -sin(x)', () => expect(diff('cos(x)', 'x').string).toBe('-sin(x)'));
    test('d/dx exp(x) = exp(x)', () => expect(diff('exp(x)', 'x').string).toBe('exp(x)'));
    test('d/dx ln(x) = 1/x', () => expect(diff('ln(x)', 'x').string).toBe('1 / x'));
    test('d/dx (x+1)^2 = 2·(x+1)', () => expect(diff('(x+1)^2', 'x').string).toBe('2 · (x + 1)'));
});

describe('symbolic — numeric cross-check (finite difference)', () => {
    const pts = [0.3, 0.7, 1.4, 2.1];
    test('polynomial x^3 - 2x^2 + x', () => matchesNumericDerivative('x^3 - 2*x^2 + x', pts));
    test('product sin(x)*cos(x)', () => matchesNumericDerivative('sin(x)*cos(x)', pts));
    test('quotient sin(x)/x', () => matchesNumericDerivative('sin(x)/x', pts));
    test('chain exp(2*x)', () => matchesNumericDerivative('exp(2*x)', pts));
    test('chain ln(x^2 + 1)', () => matchesNumericDerivative('ln(x^2 + 1)', pts));
    test('tan(x)', () => matchesNumericDerivative('tan(x)', [0.3, 0.7, 1.0]));
    test('sqrt(x)', () => matchesNumericDerivative('sqrt(x)', pts));
    test('1/x', () => matchesNumericDerivative('1/x', pts));
    test('general power x^x', () => matchesNumericDerivative('x^x', [0.5, 1.2, 2.0]));
    test('constant base 2^x', () => matchesNumericDerivative('2^x', pts));
    test('nested sin(cos(x))', () => matchesNumericDerivative('sin(cos(x))', pts));
    test('atan(x)', () => matchesNumericDerivative('atan(x)', pts));
    test('mixed 3*x^2 + 2*sin(x) - exp(x)', () => matchesNumericDerivative('3*x^2 + 2*sin(x) - exp(x)', pts));
    test('log base 2: log(x, 2)', () => matchesNumericDerivative('log(x, 2)', pts));
    test('log base e via log(x, e)', () => matchesNumericDerivative('log(x^2+1, e)', pts));
    test('root(x, 3) = x^(1/3)', () => matchesNumericDerivative('root(x, 3)', pts));
    test('pow(x, 3) function form', () => matchesNumericDerivative('pow(x, 3)', pts));
    // verify the full derivative table (these entries were previously untested)
    test('sinh(x)', () => matchesNumericDerivative('sinh(x)', pts));
    test('cosh(x)', () => matchesNumericDerivative('cosh(x)', pts));
    test('tanh(x)', () => matchesNumericDerivative('tanh(x)', pts));
    test('asin(x)', () => matchesNumericDerivative('asin(x)', [-0.4, 0.1, 0.5]));
    test('acos(x)', () => matchesNumericDerivative('acos(x)', [-0.4, 0.1, 0.5]));
    test('log10(x)', () => matchesNumericDerivative('log10(x)', pts));
    test('log2(x)', () => matchesNumericDerivative('log2(x)', pts));
    test('deeply nested exp(sin(x^2))', () => matchesNumericDerivative('exp(sin(x^2))', pts));
});

describe('symbolic — second derivative', () => {
    test("d²/dx² x^3 = 6x", () => {
        const first = diff('x^3', 'x').string;   // 3·x^2
        const second = diff(first, 'x').string;   // 6·x
        expect(evalExpr(second, { x: 2 }).re).toBeCloseTo(12, 9);
    });
});

describe('symbolic — simplify', () => {
    test('0 + x → x', () => expect(astToString(simplify(parse('0 + x')))).toBe('x'));
    test('x * 1 → x', () => expect(astToString(simplify(parse('x * 1')))).toBe('x'));
    test('x * 0 → 0', () => expect(astToString(simplify(parse('x * 0')))).toBe('0'));
    test('x ^ 1 → x', () => expect(astToString(simplify(parse('x ^ 1')))).toBe('x'));
    test('x ^ 0 → 1', () => expect(astToString(simplify(parse('x ^ 0')))).toBe('1'));
    test('x - x → 0', () => expect(astToString(simplify(parse('x - x')))).toBe('0'));
    test('x / x → 1', () => expect(astToString(simplify(parse('x / x')))).toBe('1'));
    test('constant folding 2 + 3*4 → 14', () => expect(astToString(simplify(parse('2 + 3*4')))).toBe('14'));
    test('double negation --x → x', () => expect(astToString(simplify(parse('-(-x)')))).toBe('x'));
});

describe('symbolic — astToString precedence', () => {
    test('parenthesizes sum under product', () =>
        expect(astToString(parse('2 * (x + 1)'))).toBe('2 · (x + 1)'));
    test('no spurious parens for product chain', () =>
        expect(astToString(parse('2 * x * 3'))).toBe('2 · x · 3'));
    test('power right-associative render', () =>
        expect(astToString(parse('2 ^ 3 ^ 2'))).toBe('2 ^ 3 ^ 2'));
    test('function call render', () =>
        expect(astToString(parse('sin(x + 1)'))).toBe('sin(x + 1)'));
});

describe('symbolic — equality & errors', () => {
    test('structural equality', () => {
        expect(equal(parse('x + 1'), parse('x + 1'))).toBe(true);
        expect(equal(parse('x + 1'), parse('1 + x'))).toBe(false);
    });
    test('cannot differentiate factorial', () =>
        expect(() => differentiate(parse('x!'), 'x')).toThrow(RangeError));
    test('cannot differentiate modulo', () =>
        expect(() => differentiate(parse('x % 2'), 'x')).toThrow(RangeError));
    test('cannot differentiate unknown 2-arg fn', () =>
        expect(() => differentiate(parse('atan2(x, 1)'), 'x')).toThrow(RangeError));
});
