// @ts-check
/**
 * Symbolic differentiation (a small CAS) operating on the parser's AST.
 *
 * `differentiate(node, x)` returns the exact derivative as a new AST using the
 * sum/difference, product, quotient, power and chain rules plus a derivative
 * table for the standard functions. `simplify(node)` folds constants and
 * removes algebraic identities so results read cleanly, and `astToString`
 * renders an AST back to a precedence-correct expression string.
 *
 * This reuses the {@link module:math/parser} grammar — `diff(src, x)` parses,
 * differentiates, simplifies, and returns both the AST and its string form —
 * with no `eval` and no change to the numeric evaluator.
 *
 * @module math/symbolic
 */

import { parse, evaluate } from './parser.js';

/** @typedef {import('./parser.js').Node} Node */

/* ------------------------------------------------------------------ *
 *  AST constructors
 * ------------------------------------------------------------------ */

/** @param {number} value @returns {Node} */
const num = (value) => ({ type: 'num', value });
/** @param {string} name @returns {Node} */
const vr = (name) => ({ type: 'var', name });
/** @param {Node} operand @returns {Node} */
const neg = (operand) => ({ type: 'unary', op: '-', operand });
/** @param {Node} left @param {Node} right @returns {Node} */
const add = (left, right) => ({ type: 'binary', op: '+', left, right });
/** @param {Node} left @param {Node} right @returns {Node} */
const sub = (left, right) => ({ type: 'binary', op: '-', left, right });
/** @param {Node} left @param {Node} right @returns {Node} */
const mul = (left, right) => ({ type: 'binary', op: '*', left, right });
/** @param {Node} left @param {Node} right @returns {Node} */
const div = (left, right) => ({ type: 'binary', op: '/', left, right });
/** @param {Node} left @param {Node} right @returns {Node} */
const pow = (left, right) => ({ type: 'binary', op: '^', left, right });
/** @param {string} name @param {Node[]} args @returns {Node} */
const call = (name, ...args) => ({ type: 'call', name, args });

const ZERO = num(0);
const ONE = num(1);

/** @param {Node} n @returns {boolean} */
const isNum = (n) => n.type === 'num';

/* ------------------------------------------------------------------ *
 *  Structural equality (for a few simplifications)
 * ------------------------------------------------------------------ */

/**
 * Structural AST equality.
 * @param {Node} a
 * @param {Node} b
 * @returns {boolean}
 */
export function equal(a, b) {
    if (a.type !== b.type) return false;
    switch (a.type) {
        case 'num': return a.value === /** @type {any} */ (b).value;
        case 'var': return a.name === /** @type {any} */ (b).name;
        case 'unary':
        case 'postfix': {
            const bb = /** @type {any} */ (b);
            return a.op === bb.op && equal(a.operand, bb.operand);
        }
        case 'abs': return equal(a.operand, /** @type {any} */ (b).operand);
        case 'binary': {
            const bb = /** @type {any} */ (b);
            return a.op === bb.op && equal(a.left, bb.left) && equal(a.right, bb.right);
        }
        case 'call': {
            const bb = /** @type {any} */ (b);
            return a.name === bb.name && a.args.length === bb.args.length &&
                a.args.every((x, i) => equal(x, bb.args[i]));
        }
        default: return false;
    }
}

/* ------------------------------------------------------------------ *
 *  Derivative table for unary functions: name → (u) => f'(u) as AST
 * ------------------------------------------------------------------ */

/** @type {Record<string, (u: Node) => Node>} */
const DERIV = {
    sin: (u) => call('cos', u),
    cos: (u) => neg(call('sin', u)),
    tan: (u) => add(ONE, pow(call('tan', u), num(2))),       // sec² = 1+tan²
    exp: (u) => call('exp', u),
    ln: (u) => div(ONE, u),
    log: (u) => div(ONE, u),                                  // natural log (1-arg)
    sqrt: (u) => div(ONE, mul(num(2), call('sqrt', u))),
    sinh: (u) => call('cosh', u),
    cosh: (u) => call('sinh', u),
    tanh: (u) => sub(ONE, pow(call('tanh', u), num(2))),
    asin: (u) => div(ONE, call('sqrt', sub(ONE, pow(u, num(2))))),
    acos: (u) => neg(div(ONE, call('sqrt', sub(ONE, pow(u, num(2)))))),
    atan: (u) => div(ONE, add(ONE, pow(u, num(2)))),
    log10: (u) => div(ONE, mul(u, num(Math.LN10))),
    log2: (u) => div(ONE, mul(u, num(Math.LN2))),
};

/* ------------------------------------------------------------------ *
 *  Differentiation
 * ------------------------------------------------------------------ */

/**
 * Differentiate an AST node with respect to variable `x`. Returns a new AST
 * (unsimplified — pass through {@link simplify} for readable output).
 * @param {Node} node
 * @param {string} x
 * @returns {Node}
 */
export function differentiate(node, x) {
    switch (node.type) {
        case 'num':
            return ZERO;

        case 'var':
            return node.name === x ? ONE : ZERO;

        case 'unary':
            return node.op === '-' ? neg(differentiate(node.operand, x)) : differentiate(node.operand, x);

        case 'binary': {
            const { op, left: f, right: g } = node;
            const df = () => differentiate(f, x);
            const dg = () => differentiate(g, x);
            switch (op) {
                case '+': return add(df(), dg());
                case '-': return sub(df(), dg());
                case '*': return add(mul(df(), g), mul(f, dg())); // product rule
                case '/': return div(sub(mul(df(), g), mul(f, dg())), pow(g, num(2))); // quotient rule
                case '^': return diffPower(f, g, x);
                case '%': throw new RangeError('cannot symbolically differentiate modulo');
                default: throw new SyntaxError(`unknown operator '${op}'`);
            }
        }

        case 'call': {
            // log(u, b) = ln(u)/ln(b): rewrite and differentiate (quotient rule
            // handles a variable base; constant base collapses cleanly).
            if (node.name === 'log' && node.args.length === 2) {
                return differentiate(div(call('ln', node.args[0]), call('ln', node.args[1])), x);
            }
            // root(u, n) = u^(1/n)
            if (node.name === 'root' && node.args.length === 2) {
                return differentiate(pow(node.args[0], div(ONE, node.args[1])), x);
            }
            // pow(a, b) function form == a^b
            if (node.name === 'pow' && node.args.length === 2) {
                return diffPower(node.args[0], node.args[1], x);
            }
            if (node.args.length !== 1 || !(node.name in DERIV)) {
                throw new RangeError(`cannot differentiate '${node.name}' with ${node.args.length} arg(s)`);
            }
            const u = node.args[0];
            return mul(DERIV[node.name](u), differentiate(u, x)); // chain rule
        }

        case 'abs':
            // d/dx |f| = (f/|f|) f'
            return mul(div(node.operand, call('abs', node.operand)), differentiate(node.operand, x));

        case 'postfix':
            throw new RangeError('cannot symbolically differentiate factorial');

        default:
            throw new SyntaxError('malformed AST node');
    }
}

/**
 * Power rule covering f^c (constant exponent), c^g (constant base), and the
 * general f^g via logarithmic differentiation.
 * @param {Node} f
 * @param {Node} g
 * @param {string} x
 * @returns {Node}
 */
function diffPower(f, g, x) {
    const df = differentiate(f, x);
    const dg = differentiate(g, x);
    if (isNum(g)) {
        // d/dx f^c = c·f^(c-1)·f'
        const c = /** @type {{type:'num',value:number}} */ (g).value;
        return mul(mul(num(c), pow(f, num(c - 1))), df);
    }
    if (isNum(f)) {
        // d/dx c^g = c^g·ln(c)·g'
        const c = /** @type {{type:'num',value:number}} */ (f).value;
        return mul(mul(pow(f, g), num(Math.log(c))), dg);
    }
    // general: f^g·( g'·ln(f) + g·f'/f )
    return mul(pow(f, g), add(mul(dg, call('ln', f)), div(mul(g, df), f)));
}

/* ------------------------------------------------------------------ *
 *  Simplification
 * ------------------------------------------------------------------ */

/**
 * Algebraically simplify: constant-fold and drop identities (0+x, 1·x, x^1,
 * x^0, x−x, x/x, double negation, …). Conservative — never changes value.
 * @param {Node} node
 * @returns {Node}
 */
export function simplify(node) {
    switch (node.type) {
        case 'num':
        case 'var':
            return node;

        case 'unary': {
            const operand = simplify(node.operand);
            if (node.op === '+') return operand;
            if (isNum(operand)) return num(-(/** @type {any} */ (operand).value));
            if (operand.type === 'unary' && operand.op === '-') return operand.operand; // -(-x) = x
            return neg(operand);
        }

        case 'abs': {
            const operand = simplify(node.operand);
            if (isNum(operand)) return num(Math.abs(/** @type {any} */ (operand).value));
            return call('abs', operand);
        }

        case 'call':
            return { type: 'call', name: node.name, args: node.args.map(simplify) };

        case 'postfix':
            return { type: 'postfix', op: node.op, operand: simplify(node.operand) };

        case 'binary': {
            const l = simplify(node.left);
            const r = simplify(node.right);
            const op = node.op;
            const lv = isNum(l) ? /** @type {any} */ (l).value : null;
            const rv = isNum(r) ? /** @type {any} */ (r).value : null;
            // constant folding
            if (lv !== null && rv !== null) {
                switch (op) {
                    case '+': return num(lv + rv);
                    case '-': return num(lv - rv);
                    case '*': return num(lv * rv);
                    case '/': if (rv !== 0) return num(lv / rv); break;
                    case '^': return num(Math.pow(lv, rv));
                    default: break;
                }
            }
            switch (op) {
                case '+':
                    if (lv === 0) return r;
                    if (rv === 0) return l;
                    break;
                case '-':
                    if (rv === 0) return l;
                    if (lv === 0) return simplify(neg(r));
                    if (equal(l, r)) return ZERO;
                    break;
                case '*':
                    if (lv === 0 || rv === 0) return ZERO;
                    if (lv === 1) return r;
                    if (rv === 1) return l;
                    if (lv === -1) return simplify(neg(r));
                    if (rv === -1) return simplify(neg(l));
                    break;
                case '/':
                    if (lv === 0) return ZERO;
                    if (rv === 1) return l;
                    if (equal(l, r)) return ONE;
                    break;
                case '^':
                    if (rv === 1) return l;
                    if (rv === 0) return ONE;
                    if (lv === 1) return ONE;
                    break;
                default:
                    break;
            }
            return { type: 'binary', op, left: l, right: r };
        }

        default:
            return node;
    }
}

/* ------------------------------------------------------------------ *
 *  Rendering (precedence-aware)
 * ------------------------------------------------------------------ */

/** @type {Record<string, number>} */
const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 4 };

/**
 * Render an AST to a precedence-correct expression string.
 * @param {Node} node
 * @returns {string}
 */
export function astToString(node) {
    return render(node, 0);
}

/**
 * @param {Node} node
 * @param {number} parentPrec
 * @returns {string}
 */
function render(node, parentPrec) {
    switch (node.type) {
        case 'num': {
            const v = node.value;
            return Number.isInteger(v) ? String(v) : parseFloat(v.toPrecision(12)).toString();
        }
        case 'var':
            return node.name;
        case 'unary': {
            const inner = render(node.operand, 3);
            const s = node.op === '-' ? `-${inner}` : inner;
            return parentPrec > 3 ? `(${s})` : s;
        }
        case 'abs':
            return `|${render(node.operand, 0)}|`;
        case 'postfix':
            return `${render(node.operand, 5)}!`;
        case 'call':
            return `${node.name}(${node.args.map((a) => render(a, 0)).join(', ')})`;
        case 'binary': {
            const prec = PREC[node.op];
            const rightAssoc = node.op === '^';
            const left = render(node.left, rightAssoc ? prec + 1 : prec);
            const right = render(node.right, rightAssoc ? prec : prec + 1);
            const sym = node.op === '*' ? '·' : node.op;
            const s = `${left} ${sym} ${right}`;
            return prec < parentPrec ? `(${s})` : s;
        }
        default:
            return '?';
    }
}

/* ------------------------------------------------------------------ *
 *  Symbolic integration (antiderivatives)
 *
 *  A pattern-matching integrator: linearity, the power rule, an
 *  antiderivative table for the standard functions, and the linear-
 *  substitution rule ∫f(a·x+b) dx = (1/a)·F(a·x+b). It throws on integrands
 *  that genuinely need parts/partial-fractions/non-elementary results — it
 *  never returns a wrong answer.
 * ------------------------------------------------------------------ */

/** Antiderivatives F such that F'(u) = f(u). @type {Record<string, (u: Node) => Node>} */
const ANTI = {
    sin: (u) => neg(call('cos', u)),
    cos: (u) => call('sin', u),
    exp: (u) => call('exp', u),
    sinh: (u) => call('cosh', u),
    cosh: (u) => call('sinh', u),
    tan: (u) => neg(call('ln', call('cos', u))),       // ∫tan = -ln|cos|
    ln: (u) => sub(mul(u, call('ln', u)), u),          // ∫ln  = u·ln u - u
    sqrt: (u) => div(mul(num(2), call('sqrt', pow(u, num(3)))), num(3)), // (2/3) u^{3/2}
};

/** True if `node` does not depend on `x` (derivative is identically 0). */
/** @param {Node} node @param {string} x @returns {boolean} */
function isConstant(node, x) {
    const d = simplify(differentiate(node, x));
    return d.type === 'num' && d.value === 0;
}

/**
 * If `node` is linear in `x` (= a·x + b with a, b constant), return the slope
 * a as a number; otherwise null. Detected via: d(node)/dx is a constant.
 * @param {Node} node
 * @param {string} x
 * @returns {number | null}
 */
function linearSlope(node, x) {
    const d = simplify(differentiate(node, x));
    if (d.type === 'num') return d.value;
    return null;
}

/** Evaluate a constant node to a real number. @param {Node} node @returns {number} */
function constValue(node) {
    const z = evaluate(node, {});
    return z.re;
}

/**
 * Symbolic indefinite integral ∫ node d`x` (the constant of integration is
 * omitted). Returns a new AST; pass through {@link simplify} for clean output.
 * @param {Node} node
 * @param {string} x
 * @returns {Node}
 */
export function integrate(node, x) {
    // ∫c dx = c·x  for any expression constant in x (covers numbers, π, sin(5), …)
    if (isConstant(node, x)) return mul(node, vr(x));

    switch (node.type) {
        case 'var':
            // must be x (constants handled above): ∫x dx = x²/2
            return div(pow(vr(x), num(2)), num(2));

        case 'unary':
            return node.op === '-' ? neg(integrate(node.operand, x)) : integrate(node.operand, x);

        case 'binary': {
            const { op, left, right } = node;
            switch (op) {
                case '+': return add(integrate(left, x), integrate(right, x));
                case '-': return sub(integrate(left, x), integrate(right, x));
                case '*':
                    if (isConstant(left, x)) return mul(left, integrate(right, x));
                    if (isConstant(right, x)) return mul(right, integrate(left, x));
                    throw new RangeError('cannot integrate this product (needs integration by parts)');
                case '/':
                    if (isConstant(right, x)) return div(integrate(left, x), right);
                    // ∫(c/x) dx = c·ln(x)
                    if (isConstant(left, x) && right.type === 'var' && right.name === x) {
                        return mul(left, call('ln', vr(x)));
                    }
                    throw new RangeError('cannot integrate division by a non-constant');
                case '^':
                    return integratePower(left, right, x);
                case '%':
                    throw new RangeError('cannot integrate modulo');
                default:
                    throw new SyntaxError(`unknown operator '${op}'`);
            }
        }

        case 'call': {
            if (node.args.length !== 1 || !(node.name in ANTI)) {
                throw new RangeError(`cannot integrate '${node.name}'`);
            }
            const u = node.args[0];
            const a = linearSlope(u, x);
            if (a === null || a === 0) throw new RangeError(`cannot integrate ${node.name} of a non-linear argument`);
            const F = ANTI[node.name](u);
            return a === 1 ? F : div(F, num(a));
        }

        case 'abs':
        case 'postfix':
        case 'matrix':
        case 'vector':
            throw new RangeError('cannot symbolically integrate this expression');

        default:
            throw new SyntaxError('malformed AST node');
    }
}

/**
 * ∫ base^exp dx. Handles x^c / (a·x+b)^c (power rule + linear sub) and c^(a·x+b)
 * (exponential).
 * @param {Node} base
 * @param {Node} exp
 * @param {string} x
 * @returns {Node}
 */
function integratePower(base, exp, x) {
    if (isConstant(exp, x)) {
        // (a·x+b)^c
        const a = linearSlope(base, x);
        if (a === null || a === 0) throw new RangeError('cannot integrate this power (non-linear base)');
        const isMinusOne = exp.type === 'num' && exp.value === -1;
        if (isMinusOne) {
            // ∫(ax+b)^-1 dx = ln(ax+b)/a
            return a === 1 ? call('ln', base) : div(call('ln', base), num(a));
        }
        // ∫(ax+b)^c dx = (ax+b)^(c+1) / (a·(c+1))
        const c1 = exp.type === 'num' ? num(exp.value + 1) : add(exp, num(1));
        const denom = a === 1 ? c1 : mul(num(a), c1);
        return div(pow(base, c1), denom);
    }
    if (isConstant(base, x)) {
        // c^(a·x+b): ∫ = c^(a·x+b) / (a·ln c)
        const a = linearSlope(exp, x);
        if (a === null || a === 0) throw new RangeError('cannot integrate this exponential (non-linear exponent)');
        return div(pow(base, exp), mul(num(a), call('ln', base)));
    }
    throw new RangeError('cannot integrate this power');
}

/* ------------------------------------------------------------------ *
 *  Convenience entry points
 * ------------------------------------------------------------------ */

/**
 * Parse, differentiate w.r.t. `x`, simplify, and render.
 * @param {string} src
 * @param {string} [x]
 * @returns {{ ast: Node, string: string }}
 */
export function diff(src, x = 'x') {
    const d = simplify(differentiate(parse(src), x));
    return { ast: d, string: astToString(d) };
}

/**
 * Parse, integrate w.r.t. `x`, simplify, and render. (Constant of integration
 * omitted.)
 * @param {string} src
 * @param {string} [x]
 * @returns {{ ast: Node, string: string }}
 */
export function integral(src, x = 'x') {
    const i = simplify(integrate(parse(src), x));
    return { ast: i, string: astToString(i) };
}
