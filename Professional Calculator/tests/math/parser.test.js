/**
 * @jest-environment node
 */
import { tokenize, parse, evalExpr, compute } from '../../math/parser.js';

/** @param {string} src @param {Record<string, number>} [scope] */
const R = (src, scope) => evalExpr(src, scope).re;
const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-10) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

describe('parser — tokenizer', () => {
    test('tokenizes numbers, ops, names', () => {
        const t = tokenize('3 + sin(x)');
        expect(t.map((x) => x.kind)).toEqual(['num', 'op', 'name', 'lparen', 'name', 'rparen']);
    });
    test('scientific notation', () => near(R('1.5e3'), 1500));
    test('rejects illegal char', () => expect(() => tokenize('3 @ 4')).toThrow(SyntaxError));
    test('accepts Unicode operators × · ÷ −', () => {
        near(R('6 × 7'), 42);
        near(R('6 · 7'), 42);
        near(R('20 ÷ 4'), 5);
        near(R('10 − 3'), 7);
    });
    test('Unicode output round-trips: 2 · (x + 1)', () => near(R('2 · (x + 1)', { x: 4 }), 10));
});

describe('parser — precedence & associativity', () => {
    test('2 + 3 * 4 = 14 (not 20)', () => near(R('2 + 3 * 4'), 14));
    test('(2 + 3) * 4 = 20', () => near(R('(2 + 3) * 4'), 20));
    test('2 ^ 3 ^ 2 = 512 (right-assoc)', () => near(R('2^3^2'), 512));
    test('-2 ^ 2 = -4 (unary binds looser than ^)', () => near(R('-2^2'), -4));
    test('2 - 3 - 4 = -5 (left-assoc)', () => near(R('2 - 3 - 4'), -5));
    test('10 / 2 / 5 = 1', () => near(R('10/2/5'), 1));
    test('7 % 3 = 1', () => near(R('7 % 3'), 1));
});

describe('parser — implicit multiplication', () => {
    test('2x with x=5 → 10', () => near(R('2x', { x: 5 }), 10));
    test('2(3+1) = 8', () => near(R('2(3+1)'), 8));
    test('(2)(3) = 6', () => near(R('(2)(3)'), 6));
    test('2pi ≈ 6.2832', () => near(R('2pi'), 2 * Math.PI));
    test('3sin(0) = 0', () => near(R('3sin(0)'), 0));
});

describe('parser — functions & constants', () => {
    test('sin(pi/2) = 1', () => near(R('sin(pi/2)'), 1));
    test('cos(0) = 1', () => near(R('cos(0)'), 1));
    test('exp(1) = e', () => near(R('exp(1)'), Math.E));
    test('ln(e) = 1', () => near(R('ln(e)'), 1));
    test('log(8, 2) = 3 (log base)', () => near(R('log(8,2)'), 3));
    test('log10(1000) = 3', () => near(R('log10(1000)'), 3));
    test('sqrt(2) ≈ 1.41421', () => near(R('sqrt(2)'), Math.SQRT2));
    test('hypot(3,4) = 5', () => near(R('hypot(3,4)'), 5));
    test('max(1,9,4) = 9', () => near(R('max(1,9,4)'), 9));
    test('nCr(10,3) = 120', () => near(R('nCr(10,3)'), 120));
    test('atan2(1,1) = π/4', () => near(R('atan2(1,1)'), Math.PI / 4));
    test('gcd(48,18) = 6', () => near(R('gcd(48,18)'), 6));
    test('lcm(4,6) = 12', () => near(R('lcm(4,6)'), 12));
    test('isprime(97) = 1', () => near(R('isprime(97)'), 1));
    test('isprime(91) = 0', () => near(R('isprime(91)'), 0));
    test('nextprime(100) = 101', () => near(R('nextprime(100)'), 101));
    test('modpow(2,10,1000) = 24', () => near(R('modpow(2,10,1000)'), 24));
    test('modinv(3,11) = 4', () => near(R('modinv(3,11)'), 4));
    test('totient(36) = 12', () => near(R('totient(36)'), 12));
    test('fib(10) = 55', () => near(R('fib(10)'), 55));
});

describe('parser — combinatorics functions', () => {
    test('catalan(5) = 42', () => near(R('catalan(5)'), 42));
    test('bell(5) = 52', () => near(R('bell(5)'), 52));
    test('partitions(10) = 42', () => near(R('partitions(10)'), 42));
    test('derangements(4) = 9', () => near(R('derangements(4)'), 9));
    test('stirling2(4,2) = 7', () => near(R('stirling2(4,2)'), 7));
    test('stirling1(4,2) = 11', () => near(R('stirling1(4,2)'), 11));
    test('multichoose(5,3) = 35', () => near(R('multichoose(5,3)'), 35));
    test('composes with arithmetic: catalan(4) + bell(3) = 19', () =>
        near(R('catalan(4) + bell(3)'), 19));
    test('wrong arg count throws', () => {
        expect(() => R('catalan(1,2)')).toThrow();
        expect(() => R('stirling2(4)')).toThrow();
    });
});

describe('parser — factorial', () => {
    test('5! = 120', () => near(R('5!'), 120));
    test('0! = 1', () => near(R('0!'), 1));
    test('3!+2 = 8 (postfix binds tighter than +)', () => near(R('3!+2'), 8));
    test('(2+1)! = 6', () => near(R('(2+1)!'), 6));
    test('4.5! = Γ(5.5)', () => near(R('4.5!'), 52.34277778455, 1e-6));
});

describe('parser — absolute value bars', () => {
    test('|-5| = 5', () => near(R('|-5|'), 5));
    test('|3+4i| = 5', () => near(R('|3+4i|'), 5));
    test('2|−3| = 6', () => near(R('2|-3|'), 6));
});

describe('parser — complex arithmetic', () => {
    test('i^2 = -1', () => {
        const z = evalExpr('i^2');
        near(z.re, -1);
        near(z.im, 0);
    });
    test('(3+4i) modulus via |.|', () => near(R('|3 + 4i|'), 5));
    test('e^(i*pi) = -1 (Euler)', () => {
        const z = evalExpr('exp(i*pi)');
        near(z.re, -1, 1e-12);
        near(z.im, 0, 1e-12);
    });
    test('re and im extractors', () => {
        near(R('re(3+4i)'), 3);
        near(R('im(3+4i)'), 4);
    });
    test('sqrt(-4) = 2i', () => {
        const z = evalExpr('sqrt(-4)');
        near(z.re, 0);
        near(z.im, 2);
    });
});

describe('parser — variables / scope', () => {
    test('a^2 + b^2 with a=3,b=4 → 25', () => near(R('a^2 + b^2', { a: 3, b: 4 }), 25));
    test('quadratic formula numerator', () => near(R('(-b + sqrt(b^2 - 4*a*c))/(2*a)', { a: 1, b: -3, c: 2 }), 2));
});

describe('parser — compute() display helper', () => {
    test('real result formats as number', () => {
        expect(compute('2+2').display).toBe('4');
        expect(compute('2+2').isReal).toBe(true);
    });
    test('complex result formats with i', () => {
        const r = compute('2+3i');
        expect(r.isReal).toBe(false);
        expect(r.display).toBe('2 + 3i');
    });
});

describe('parser — error handling', () => {
    test('empty expression throws', () => expect(() => parse('')).toThrow(SyntaxError));
    test('unbalanced paren throws', () => expect(() => parse('2*(3+1')).toThrow(SyntaxError));
    test('unknown symbol throws', () => expect(() => evalExpr('foo')).toThrow(ReferenceError));
    test('unknown function throws', () => expect(() => evalExpr('bar(2)')).toThrow(ReferenceError));
    test('trailing operator throws', () => expect(() => parse('2 +')).toThrow(SyntaxError));
    test('wrong arity throws', () => expect(() => evalExpr('atan2(1)')).toThrow(SyntaxError));
});
