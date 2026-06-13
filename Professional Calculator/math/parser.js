// @ts-check
/**
 * Expression engine: tokenizer → Pratt (precedence-climbing) parser → AST →
 * evaluator. This is the headline feature that turns a button calculator
 * into a symbolic-input scientific engine.
 *
 * Grammar (informal):
 *   expr    := term (('+' | '-') term)*
 *   term    := factor (('*' | '/' | '%' | implicit) factor)*
 *   factor  := unary ('^' factor)?           // right-assoc power
 *   unary   := ('+' | '-') unary | postfix
 *   postfix := primary ('!' )*               // factorial
 *   primary := NUMBER | NAME | NAME '(' args ')' | '(' expr ')' | '|' expr '|'
 *
 * Features:
 *  - Real and complex results (i / j as the imaginary unit).
 *  - Implicit multiplication: 2x, 2(3+1), (a)(b), 2sin(x).
 *  - Right-associative exponentiation: 2^3^2 = 512.
 *  - Postfix factorial: 5! = 120, with gamma for non-integers.
 *  - Constants (pi, e, tau, phi, …) and CODATA physical constants.
 *  - User variables passed in a scope object.
 *  - |x| absolute-value bars.
 *  - Functions over the complex field (sin, cos, exp, log, sqrt, …) plus
 *    real-only helpers (gamma, erf, factorial, nCr, nPr, …).
 *
 * The tokenizer is O(n) in input length; the parser is O(n) in token count;
 * evaluation is O(nodes). No `eval`, no `Function` — fully sandboxed.
 *
 * @module math/parser
 */

import * as C from './complex.js';
import * as M from './matrix.js';
import * as NT from './numtheory.js';
import { constantValue } from './constants.js';
import { gamma, erf, erfc, factorial as realFactorial, combinations, permutations, lgamma } from './special.js';

/**
 * @typedef {import('./complex.js').Complex} Complex
 */

/* ============================================================= *
 *  Tokenizer
 * ============================================================= */

/** @typedef {'num'|'name'|'op'|'lparen'|'rparen'|'lbrack'|'rbrack'|'comma'|'bar'|'bang'} TokKind */
/** @typedef {{ kind: TokKind, value: string, pos: number }} Token */

const OP_CHARS = new Set(['+', '-', '*', '/', '^', '%']);

/**
 * Lexical analysis. Throws {@link SyntaxError} on an illegal character.
 * @param {string} src
 * @returns {Token[]}
 */
export function tokenize(src) {
    /** @type {Token[]} */
    const tokens = [];
    let i = 0;
    const n = src.length;
    while (i < n) {
        const ch = src[i];
        if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
            i++;
            continue;
        }
        // number: digits, optional decimal, optional exponent
        if ((ch >= '0' && ch <= '9') || (ch === '.' && i + 1 < n && src[i + 1] >= '0' && src[i + 1] <= '9')) {
            let j = i;
            while (j < n && src[j] >= '0' && src[j] <= '9') j++;
            if (j < n && src[j] === '.') {
                j++;
                while (j < n && src[j] >= '0' && src[j] <= '9') j++;
            }
            if (j < n && (src[j] === 'e' || src[j] === 'E')) {
                let k = j + 1;
                if (k < n && (src[k] === '+' || src[k] === '-')) k++;
                if (k < n && src[k] >= '0' && src[k] <= '9') {
                    j = k;
                    while (j < n && src[j] >= '0' && src[j] <= '9') j++;
                }
            }
            tokens.push({ kind: 'num', value: src.slice(i, j), pos: i });
            i = j;
            continue;
        }
        // identifier: letters, then letters/digits/underscore
        if (isAlpha(ch)) {
            let j = i + 1;
            while (j < n && (isAlpha(src[j]) || (src[j] >= '0' && src[j] <= '9') || src[j] === '_')) j++;
            tokens.push({ kind: 'name', value: src.slice(i, j), pos: i });
            i = j;
            continue;
        }
        if (OP_CHARS.has(ch)) {
            tokens.push({ kind: 'op', value: ch, pos: i });
            i++;
            continue;
        }
        // Accept the Unicode math operators the engine pretty-prints (and the
        // keypad shows), mapping them to their ASCII forms so output is
        // round-trippable: ×/·/⋅ → *, ÷ → /, − (U+2212) → -.
        if (ch === '×' || ch === '·' || ch === '⋅') { tokens.push({ kind: 'op', value: '*', pos: i }); i++; continue; }
        if (ch === '÷') { tokens.push({ kind: 'op', value: '/', pos: i }); i++; continue; }
        if (ch === '−') { tokens.push({ kind: 'op', value: '-', pos: i }); i++; continue; }
        if (ch === '(') { tokens.push({ kind: 'lparen', value: ch, pos: i }); i++; continue; }
        if (ch === ')') { tokens.push({ kind: 'rparen', value: ch, pos: i }); i++; continue; }
        if (ch === '[') { tokens.push({ kind: 'lbrack', value: ch, pos: i }); i++; continue; }
        if (ch === ']') { tokens.push({ kind: 'rbrack', value: ch, pos: i }); i++; continue; }
        if (ch === ',') { tokens.push({ kind: 'comma', value: ch, pos: i }); i++; continue; }
        if (ch === '|') { tokens.push({ kind: 'bar', value: ch, pos: i }); i++; continue; }
        if (ch === '!') { tokens.push({ kind: 'bang', value: ch, pos: i }); i++; continue; }
        throw new SyntaxError(`Unexpected character '${ch}' at position ${i}`);
    }
    return tokens;
}

/** @param {string} ch @returns {boolean} */
function isAlpha(ch) {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

/* ============================================================= *
 *  AST node types
 * ============================================================= */

/**
 * @typedef {(
 *   | { type: 'num', value: number }
 *   | { type: 'var', name: string }
 *   | { type: 'unary', op: string, operand: Node }
 *   | { type: 'binary', op: string, left: Node, right: Node }
 *   | { type: 'postfix', op: string, operand: Node }
 *   | { type: 'call', name: string, args: Node[] }
 *   | { type: 'abs', operand: Node }
 *   | { type: 'matrix', rows: Node[][] }
 *   | { type: 'vector', elements: Node[] }
 * )} Node
 */

/* ============================================================= *
 *  Parser (Pratt / precedence climbing)
 * ============================================================= */

class Parser {
    /** @param {Token[]} tokens */
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
        /** Open absolute-value bars. A '|' closes when this is > 0. */
        this.barDepth = 0;
    }

    /** @returns {Token | undefined} */
    peek() {
        return this.tokens[this.pos];
    }

    /** @returns {Token} */
    next() {
        const t = this.tokens[this.pos];
        if (!t) throw new SyntaxError('Unexpected end of expression');
        this.pos++;
        return t;
    }

    /** @param {TokKind} kind @returns {Token} */
    expect(kind) {
        const t = this.peek();
        if (!t || t.kind !== kind) {
            throw new SyntaxError(`Expected ${kind} but found ${t ? `'${t.value}'` : 'end of input'}`);
        }
        return this.next();
    }

    /** @returns {Node} */
    parseExpression() {
        const node = this.parseAddSub();
        if (this.pos !== this.tokens.length) {
            const t = this.peek();
            throw new SyntaxError(`Unexpected token '${t?.value}' at position ${t?.pos}`);
        }
        return node;
    }

    /** @returns {Node} */
    parseAddSub() {
        let left = this.parseMulDiv();
        for (;;) {
            const t = this.peek();
            if (t && t.kind === 'op' && (t.value === '+' || t.value === '-')) {
                this.next();
                const right = this.parseMulDiv();
                left = { type: 'binary', op: t.value, left, right };
            } else {
                return left;
            }
        }
    }

    /** @returns {Node} */
    parseMulDiv() {
        let left = this.parseUnary();
        for (;;) {
            const t = this.peek();
            if (t && t.kind === 'op' && (t.value === '*' || t.value === '/' || t.value === '%')) {
                this.next();
                const right = this.parseUnary();
                left = { type: 'binary', op: t.value, left, right };
            } else if (t && this.startsImplicitFactor(t)) {
                // implicit multiplication: 2x, 2(…), (a)(b), 2sin(x)
                const right = this.parseUnary();
                left = { type: 'binary', op: '*', left, right };
            } else {
                return left;
            }
        }
    }

    /**
     * Does this token begin a factor that can follow another factor with an
     * implied '*'? (number, name, '(' or '|', but not an operator).
     * @param {Token} t
     * @returns {boolean}
     */
    startsImplicitFactor(t) {
        if (t.kind === 'num' || t.kind === 'name' || t.kind === 'lparen') return true;
        // A '|' only begins a new factor when it is an opener (not closing an
        // abs we are currently inside) — otherwise the closing bar of |x|
        // would be misread as the start of an implicit product.
        return t.kind === 'bar' && this.barDepth === 0;
    }

    /** @returns {Node} */
    parseUnary() {
        const t = this.peek();
        if (t && t.kind === 'op' && (t.value === '+' || t.value === '-')) {
            this.next();
            const operand = this.parseUnary();
            return { type: 'unary', op: t.value, operand };
        }
        return this.parsePower();
    }

    /** Right-associative '^'. @returns {Node} */
    parsePower() {
        const base = this.parsePostfix();
        const t = this.peek();
        if (t && t.kind === 'op' && t.value === '^') {
            this.next();
            const exponent = this.parseUnary(); // right-assoc, allow unary on RHS
            return { type: 'binary', op: '^', left: base, right: exponent };
        }
        return base;
    }

    /** Postfix factorial(s). @returns {Node} */
    parsePostfix() {
        let node = this.parsePrimary();
        for (;;) {
            const t = this.peek();
            if (t && t.kind === 'bang') {
                this.next();
                node = { type: 'postfix', op: '!', operand: node };
            } else {
                return node;
            }
        }
    }

    /** @returns {Node} */
    parsePrimary() {
        const t = this.next();
        if (t.kind === 'num') {
            return { type: 'num', value: parseFloat(t.value) };
        }
        if (t.kind === 'lparen') {
            const inner = this.parseAddSub();
            this.expect('rparen');
            return inner;
        }
        if (t.kind === 'bar') {
            this.barDepth++;
            const inner = this.parseAddSub();
            this.expect('bar');
            this.barDepth--;
            return { type: 'abs', operand: inner };
        }
        if (t.kind === 'lbrack') {
            return this.parseBracketLiteral();
        }
        if (t.kind === 'name') {
            const nt = this.peek();
            if (nt && nt.kind === 'lparen') {
                this.next();
                /** @type {Node[]} */
                const args = [];
                if (this.peek() && /** @type {Token} */ (this.peek()).kind !== 'rparen') {
                    args.push(this.parseAddSub());
                    while (this.peek() && /** @type {Token} */ (this.peek()).kind === 'comma') {
                        this.next();
                        args.push(this.parseAddSub());
                    }
                }
                this.expect('rparen');
                return { type: 'call', name: t.value, args };
            }
            return { type: 'var', name: t.value };
        }
        throw new SyntaxError(`Unexpected token '${t.value}' at position ${t.pos}`);
    }

    /**
     * Parse a bracket literal after the opening '[' has been consumed.
     * `[[..],[..]]` → matrix (rows are themselves bracketed), `[a,b,c]` →
     * vector (flat list of scalars).
     * @returns {Node}
     */
    parseBracketLiteral() {
        const first = this.peek();
        if (first && first.kind === 'rbrack') {
            throw new SyntaxError('empty matrix/vector literal');
        }
        if (first && first.kind === 'lbrack') {
            /** @type {Node[][]} */
            const rows = [this.parseBracketRow()];
            while (this.peek() && /** @type {Token} */ (this.peek()).kind === 'comma') {
                this.next();
                rows.push(this.parseBracketRow());
            }
            this.expect('rbrack');
            const cols = rows[0].length;
            if (!rows.every((r) => r.length === cols)) {
                throw new SyntaxError('matrix rows must have equal length');
            }
            return { type: 'matrix', rows };
        }
        /** @type {Node[]} */
        const elements = [this.parseAddSub()];
        while (this.peek() && /** @type {Token} */ (this.peek()).kind === 'comma') {
            this.next();
            elements.push(this.parseAddSub());
        }
        this.expect('rbrack');
        return { type: 'vector', elements };
    }

    /** Parse one `[ expr, expr, … ]` row. @returns {Node[]} */
    parseBracketRow() {
        this.expect('lbrack');
        /** @type {Node[]} */
        const row = [this.parseAddSub()];
        while (this.peek() && /** @type {Token} */ (this.peek()).kind === 'comma') {
            this.next();
            row.push(this.parseAddSub());
        }
        this.expect('rbrack');
        return row;
    }
}

/**
 * Parse a source string into an AST.
 * @param {string} src
 * @returns {Node}
 */
export function parse(src) {
    const tokens = tokenize(src);
    if (tokens.length === 0) throw new SyntaxError('Empty expression');
    return new Parser(tokens).parseExpression();
}

/* ============================================================= *
 *  Evaluator (over the complex field)
 * ============================================================= */

/** Functions of one complex argument. @type {Record<string, (z: Complex) => Complex>} */
const COMPLEX_FN1 = {
    sin: C.sin, cos: C.cos, tan: C.tan,
    sinh: C.sinh, cosh: C.cosh, tanh: C.tanh,
    asin: C.asin, acos: C.acos, atan: C.atan,
    exp: C.exp, sqrt: C.sqrt, conj: C.conj,
    ln: C.log, log: C.log,
};

/** Real-only unary functions (operate on Re, require ~real input). */
const REAL_FN1 = {
    gamma, erf, erfc, lgamma,
    abs: Math.abs, sign: Math.sign, floor: Math.floor, ceil: Math.ceil,
    round: Math.round, trunc: Math.trunc, cbrt: Math.cbrt,
    log10: Math.log10, log2: Math.log2,
    asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
    deg: (/** @type {number} */ x) => (x * 180) / Math.PI,
    rad: (/** @type {number} */ x) => (x * Math.PI) / 180,
    factorial: realFactorial,
};

/**
 * Evaluate an AST node to a complex value.
 * @param {Node} node
 * @param {Record<string, number | Complex>} [scope]  user variables
 * @returns {Complex}
 */
export function evaluate(node, scope = {}) {
    switch (node.type) {
        case 'num':
            return { re: node.value, im: 0 };

        case 'var': {
            const name = node.name;
            if (name in scope) return C.toComplex(scope[name]);
            // imaginary unit
            if (name === 'i' || name === 'j') return { re: 0, im: 1 };
            const k = constantValue(name);
            if (k !== undefined) return { re: k, im: 0 };
            throw new ReferenceError(`Unknown symbol '${name}'`);
        }

        case 'unary': {
            const v = evaluate(node.operand, scope);
            return node.op === '-' ? C.neg(v) : v;
        }

        case 'postfix': {
            // factorial
            const v = evaluate(node.operand, scope);
            if (Math.abs(v.im) > 1e-12) throw new RangeError('factorial of complex number');
            const x = v.re;
            if (Number.isInteger(x) && x >= 0) return { re: realFactorial(x), im: 0 };
            return { re: gamma(x + 1), im: 0 }; // generalized factorial
        }

        case 'binary': {
            const a = evaluate(node.left, scope);
            const b = evaluate(node.right, scope);
            switch (node.op) {
                case '+': return C.add(a, b);
                case '-': return C.sub(a, b);
                case '*': return C.mul(a, b);
                case '/': return C.div(a, b);
                case '^': return C.pow(a, b);
                case '%': {
                    if (Math.abs(a.im) > 1e-12 || Math.abs(b.im) > 1e-12) {
                        throw new RangeError('modulo requires real operands');
                    }
                    return { re: a.re % b.re, im: 0 };
                }
                default: throw new SyntaxError(`Unknown operator '${node.op}'`);
            }
        }

        case 'abs':
            return { re: C.abs(evaluate(node.operand, scope)), im: 0 };

        case 'call':
            return evaluateCall(node, scope);

        default:
            throw new SyntaxError('Malformed AST node');
    }
}

/**
 * Dispatch a function call node.
 * @param {Extract<Node, {type:'call'}>} node
 * @param {Record<string, number | Complex>} scope
 * @returns {Complex}
 */
function evaluateCall(node, scope) {
    const { name, args } = node;
    const argv = args.map((a) => evaluate(a, scope));

    // Single-argument complex functions
    if (argv.length === 1 && name in COMPLEX_FN1) {
        return COMPLEX_FN1[name](argv[0]);
    }
    // Single-argument real functions
    if (argv.length === 1 && name in REAL_FN1) {
        const z = argv[0];
        if (Math.abs(z.im) > 1e-12 && name !== 'abs') {
            throw new RangeError(`${name} expects a real argument`);
        }
        const fn = /** @type {Record<string, (x:number)=>number>} */ (REAL_FN1)[name];
        return { re: fn(z.re), im: 0 };
    }

    // Multi-argument / special forms
    switch (name) {
        case 'pow':
            requireArgs(name, argv, 2);
            return C.pow(argv[0], argv[1]);
        case 'root': {
            // root(x, n) = x^(1/n)
            requireArgs(name, argv, 2);
            return C.pow(argv[0], C.div(C.ONE, argv[1]));
        }
        case 'log': // log(x, base)
            requireArgs(name, argv, 2);
            return C.div(C.log(argv[0]), C.log(argv[1]));
        case 'atan2':
            requireArgs(name, argv, 2);
            return { re: Math.atan2(argv[0].re, argv[1].re), im: 0 };
        case 'hypot':
            return { re: Math.hypot(...argv.map((z) => z.re)), im: 0 };
        case 'max':
            return { re: Math.max(...argv.map((z) => z.re)), im: 0 };
        case 'min':
            return { re: Math.min(...argv.map((z) => z.re)), im: 0 };
        case 'mod':
            requireArgs(name, argv, 2);
            return { re: ((argv[0].re % argv[1].re) + argv[1].re) % argv[1].re, im: 0 };
        case 'gcd':
            return { re: argv.map((z) => z.re).reduce((g, x) => intGcd(g, x)), im: 0 };
        case 'lcm':
            return { re: argv.map((z) => z.re).reduce((l, x) => NT.lcm(l, x)), im: 0 };
        case 'isprime':
            requireArgs(name, argv, 1);
            return { re: NT.isPrime(argv[0].re) ? 1 : 0, im: 0 };
        case 'nextprime':
            requireArgs(name, argv, 1);
            return { re: NT.nextPrime(argv[0].re), im: 0 };
        case 'modpow':
            requireArgs(name, argv, 3);
            return { re: NT.modPow(argv[0].re, argv[1].re, argv[2].re), im: 0 };
        case 'modinv':
            requireArgs(name, argv, 2);
            return { re: NT.modInverse(argv[0].re, argv[1].re), im: 0 };
        case 'totient':
            requireArgs(name, argv, 1);
            return { re: NT.eulerTotient(argv[0].re), im: 0 };
        case 'fib':
            requireArgs(name, argv, 1);
            return { re: NT.fibonacci(argv[0].re), im: 0 };
        case 'nCr':
            requireArgs(name, argv, 2);
            return { re: combinations(argv[0].re, argv[1].re), im: 0 };
        case 'nPr':
            requireArgs(name, argv, 2);
            return { re: permutations(argv[0].re, argv[1].re), im: 0 };
        case 're':
            requireArgs(name, argv, 1);
            return { re: argv[0].re, im: 0 };
        case 'im':
            requireArgs(name, argv, 1);
            return { re: argv[0].im, im: 0 };
        case 'arg':
            requireArgs(name, argv, 1);
            return { re: C.arg(argv[0]), im: 0 };
        default:
            throw new ReferenceError(`Unknown function '${name}'`);
    }
}

/**
 * @param {string} name
 * @param {Complex[]} argv
 * @param {number} k
 */
function requireArgs(name, argv, k) {
    if (argv.length !== k) {
        throw new SyntaxError(`${name} expects ${k} argument(s), got ${argv.length}`);
    }
}

/** Integer GCD over reals (rounds inputs). @param {number} a @param {number} b @returns {number} */
function intGcd(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) {
        [a, b] = [b, a % b];
    }
    return a;
}

/* ============================================================= *
 *  Matrix-aware evaluation (value = Complex scalar OR real Matrix)
 *
 *  Pure-scalar subtrees delegate to the proven scalar evaluate(), so the
 *  existing scalar behaviour is untouched; matrix handling is purely additive.
 * ============================================================= */

/** @typedef {number[][]} Matrix */
/** @typedef {Complex | Matrix} Value */
/** @typedef {Record<string, number | Complex | Matrix>} ValueScope */

/** @param {Value} v @returns {v is Matrix} */
function isMatrix(v) {
    return Array.isArray(v);
}

/**
 * Evaluate a scalar sub-node to a real number (matrix entries must be real).
 * @param {Node} node
 * @param {ValueScope} scope
 * @returns {number}
 */
function scalarRe(node, scope) {
    const z = evaluate(node, /** @type {any} */ (scope));
    if (Math.abs(z.im) > 1e-12) throw new RangeError('matrix/vector entries must be real');
    return z.re;
}

/**
 * Evaluate an AST to a scalar (Complex) or a real matrix (number[][]).
 * @param {Node} node
 * @param {ValueScope} [scope]
 * @returns {Value}
 */
export function evaluateValue(node, scope = {}) {
    switch (node.type) {
        case 'matrix':
            return node.rows.map((r) => r.map((e) => scalarRe(e, scope)));
        case 'vector':
            return node.elements.map((e) => [scalarRe(e, scope)]); // n×1 column
        case 'var': {
            const s = scope[node.name];
            if (Array.isArray(s)) return s;
            return evaluate(node, /** @type {any} */ (scope));
        }
        case 'unary': {
            const v = evaluateValue(node.operand, scope);
            if (isMatrix(v)) return node.op === '-' ? M.scale(v, -1) : v;
            return evaluate(node, /** @type {any} */ (scope));
        }
        case 'binary': {
            const a = evaluateValue(node.left, scope);
            const b = evaluateValue(node.right, scope);
            if (!isMatrix(a) && !isMatrix(b)) return evaluate(node, /** @type {any} */ (scope));
            return matrixBinary(node.op, a, b);
        }
        case 'abs': {
            const v = evaluateValue(node.operand, scope);
            if (isMatrix(v)) return { re: M.normFro(v), im: 0 }; // ‖·‖_F for matrices
            return evaluate(node, /** @type {any} */ (scope));
        }
        case 'call':
            return evaluateValueCall(node, scope);
        default:
            return evaluate(node, /** @type {any} */ (scope)); // num, postfix
    }
}

/**
 * Binary operators where at least one operand is a matrix.
 * @param {string} op
 * @param {Value} a
 * @param {Value} b
 * @returns {Value}
 */
function matrixBinary(op, a, b) {
    /** @param {Value} v @returns {number} */
    const reOf = (v) => {
        const z = /** @type {Complex} */ (v);
        if (Math.abs(z.im) > 1e-12) throw new RangeError('a matrix scalar must be real');
        return z.re;
    };
    switch (op) {
        case '+':
            if (isMatrix(a) && isMatrix(b)) return M.add(a, b);
            throw new RangeError('cannot add a scalar and a matrix');
        case '-':
            if (isMatrix(a) && isMatrix(b)) return M.sub(a, b);
            throw new RangeError('cannot subtract a scalar and a matrix');
        case '*':
            if (isMatrix(a) && isMatrix(b)) return M.mul(a, b);
            if (isMatrix(a)) return M.scale(a, reOf(b));
            if (isMatrix(b)) return M.scale(b, reOf(a));
            throw new RangeError('matrix multiply error');
        case '/':
            if (isMatrix(a) && !isMatrix(b)) return M.scale(a, 1 / reOf(b));
            throw new RangeError('matrix division is undefined (use inv())');
        case '^':
            if (isMatrix(a) && !isMatrix(b)) {
                const n = reOf(b);
                if (!Number.isInteger(n)) throw new RangeError('matrix exponent must be an integer');
                if (n < 0) return M.inv(matIntPow(a, -n));
                return matIntPow(a, n);
            }
            throw new RangeError('unsupported matrix power');
        default:
            throw new SyntaxError(`operator '${op}' is not defined for matrices`);
    }
}

/** Integer matrix power via repeated multiply (n ≥ 0). @param {Matrix} a @param {number} n @returns {Matrix} */
function matIntPow(a, n) {
    let result = M.identity(M.rows(a));
    for (let i = 0; i < n; i++) result = M.mul(result, a);
    return result;
}

/** Single-matrix-argument functions. */
const MAT_UNARY = new Set(['det', 'trace', 'tr', 'rank', 'norm', 'transpose', 'inv']);

/**
 * Dispatch a call that may involve matrices; scalar calls fall through to the
 * scalar {@link evaluateCall} via {@link evaluate}.
 * @param {Extract<Node, {type:'call'}>} node
 * @param {ValueScope} scope
 * @returns {Value}
 */
function evaluateValueCall(node, scope) {
    const name = node.name;
    /** @param {Node} n @returns {Matrix} */
    const matArg = (n) => {
        const v = evaluateValue(n, scope);
        if (!isMatrix(v)) throw new RangeError(`${name} expects a matrix argument`);
        return v;
    };
    /** @param {number} re @returns {Complex} */
    const sc = (re) => ({ re, im: 0 });

    if (name === 'identity' || name === 'eye') {
        return M.identity(scalarRe(node.args[0], scope));
    }
    if (name === 'zeros') {
        const r = scalarRe(node.args[0], scope);
        return M.zeros(r, node.args[1] ? scalarRe(node.args[1], scope) : r);
    }
    if (MAT_UNARY.has(name)) {
        const m = matArg(node.args[0]);
        switch (name) {
            case 'det': return sc(M.det(m));
            case 'trace': case 'tr': return sc(M.trace(m));
            case 'rank': return sc(M.rank(m));
            case 'norm': return sc(M.normFro(m));
            case 'transpose': return M.transpose(m);
            case 'inv': return M.inv(m);
            default: break;
        }
    }
    if (name === 'solve') {
        const A = matArg(node.args[0]);
        const b = matArg(node.args[1]).map((row) => row[0]); // column → vector
        return M.solve(A, b).map((x) => [x]); // back to a column matrix
    }
    if (name === 'eigvals') {
        return M.eigenvalues(matArg(node.args[0])).map((z) => [z.re]); // column of real parts
    }
    // Number-theory functions returning a list → column vector.
    if (name === 'factor') {
        const f = NT.primeFactors(scalarRe(node.args[0], scope));
        return f.length ? f.map((p) => [p]) : [[1]];
    }
    if (name === 'divisors') {
        return NT.divisors(scalarRe(node.args[0], scope)).map((d) => [d]);
    }
    // Not a matrix function → scalar call.
    return evaluate(node, /** @type {any} */ (scope));
}

/**
 * Render a Value (scalar or matrix) for display.
 * @param {Value} v
 * @returns {string}
 */
export function formatValue(v) {
    if (isMatrix(v)) return matrixToString(v);
    const z = /** @type {Complex} */ (v);
    const real = Math.abs(z.im) <= 1e-12 * Math.max(1, Math.abs(z.re));
    return real ? C.toString({ re: z.re, im: 0 }) : C.toString(z);
}

/** @param {Matrix} m @returns {string} */
function matrixToString(m) {
    const fmt = (/** @type {number} */ x) => {
        const r = Math.abs(x) < 1e-12 ? 0 : x;
        return Number.isInteger(r) ? String(r) : parseFloat(r.toPrecision(6)).toString();
    };
    return `[${m.map((row) => `[${row.map(fmt).join(', ')}]`).join(', ')}]`;
}

/**
 * Convenience: parse + evaluate a string in one call. Returns a Complex.
 * @param {string} src
 * @param {Record<string, number | Complex>} [scope]
 * @returns {Complex}
 */
export function evalExpr(src, scope = {}) {
    return evaluate(parse(src), scope);
}

/**
 * Evaluate a string and return a display-ready result. Supports scalars
 * (Complex) and matrices/vectors. Designed for the UI/REPL.
 * @param {string} src
 * @param {ValueScope} [scope]
 * @returns {{ value: Value, display: string, isReal: boolean, isMatrix: boolean }}
 */
export function compute(src, scope = {}) {
    const value = evaluateValue(parse(src), scope);
    if (isMatrix(value)) {
        return { value, display: formatValue(value), isReal: false, isMatrix: true };
    }
    const z = /** @type {Complex} */ (value);
    const isReal = Math.abs(z.im) <= 1e-12 * Math.max(1, Math.abs(z.re));
    return { value, display: formatValue(value), isReal, isMatrix: false };
}
