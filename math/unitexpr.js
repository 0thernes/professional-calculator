// @ts-check
/**
 * Unit-aware expression evaluator.
 *
 * Parses and evaluates arithmetic over physical quantities — e.g.
 * `3 kg * 9.8 m / s^2` → `29.4 kg·m/s²` — with full dimensional analysis:
 * addition/subtraction require matching dimensions, while multiplication,
 * division, and integer powers combine them. It is a small self-contained
 * recursive-descent parser over the {@link module:math/units} `Quantity` model
 * (value in SI base units + a 7-vector of dimension exponents), reusing that
 * module's quantity arithmetic.
 *
 * **Scope:** this is a *separate* evaluator from the main scientific REPL
 * ({@link module:math/parser}), whose value model is `Complex | Matrix` and has
 * no place for a dimensioned third type. Affine temperature units (`degC`,
 * `degF`) are intentionally rejected here because they do not compose
 * multiplicatively — use {@link module:math/units.convert} for those.
 *
 * Grammar (precedence low → high):
 *   additive   := term (('+' | '-') term)*          // same-dimension only
 *   term       := power (('*' | '/' | implicit) power)*
 *   power      := atom ('^' signed-integer-ish)?
 *   atom       := number | unit | '(' additive ')' | '-' atom
 *
 * @module math/unitexpr
 */

import {
    UNITS, quantity, addQ, subQ, mulQ, divQ, powQ, formatDim,
} from './units.js';

/** @typedef {import('./units.js').Quantity} Quantity */
/** @typedef {{ kind: 'num', value: number } | { kind: 'unit', name: string } | { kind: 'op', value: string }} Token */

/** A dimensionless quantity. @param {number} n @returns {Quantity} */
function scalar(n) {
    return { value: n, dim: [0, 0, 0, 0, 0, 0, 0] };
}

/* ------------------------------------------------------------------ *
 *  Tokenizer
 * ------------------------------------------------------------------ */

/**
 * @param {string} src
 * @returns {Token[]}
 */
function tokenize(src) {
    /** @type {Token[]} */
    const tokens = [];
    let i = 0;
    while (i < src.length) {
        const c = src[i];
        if (c === ' ' || c === '\t') { i += 1; continue; }
        if ((c >= '0' && c <= '9') || c === '.') {
            let j = i;
            while (j < src.length && ((src[j] >= '0' && src[j] <= '9') || src[j] === '.')) j += 1;
            if (src[j] === 'e' || src[j] === 'E') {
                j += 1;
                if (src[j] === '+' || src[j] === '-') j += 1;
                while (j < src.length && src[j] >= '0' && src[j] <= '9') j += 1;
            }
            const value = parseFloat(src.slice(i, j));
            if (Number.isNaN(value)) throw new SyntaxError(`invalid number near '${src.slice(i, j)}'`);
            tokens.push({ kind: 'num', value });
            i = j;
            continue;
        }
        if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
            let j = i;
            while (j < src.length && /[A-Za-z]/.test(src[j])) j += 1;
            tokens.push({ kind: 'unit', name: src.slice(i, j) });
            i = j;
            continue;
        }
        if ('+-*/^()'.includes(c)) {
            tokens.push({ kind: 'op', value: c });
            i += 1;
            continue;
        }
        throw new SyntaxError(`unexpected character '${c}' in unit expression`);
    }
    return tokens;
}

/* ------------------------------------------------------------------ *
 *  Parser / evaluator
 * ------------------------------------------------------------------ */

/**
 * Parse + evaluate a token stream into a {@link Quantity}.
 * @param {Token[]} tokens
 * @returns {Quantity}
 */
function parse(tokens) {
    let pos = 0;
    const peek = () => tokens[pos];
    const next = () => tokens[pos++];

    /** @param {Token | undefined} tok */
    const startsAtom = (tok) => !!tok && (
        tok.kind === 'num'
        || tok.kind === 'unit'
        || (tok.kind === 'op' && tok.value === '(')
    );

    /** @returns {Quantity} */
    function parseAtom() {
        const tok = next();
        if (!tok) throw new SyntaxError('unexpected end of unit expression');
        if (tok.kind === 'num') return scalar(tok.value);
        if (tok.kind === 'unit') {
            const u = UNITS[tok.name];
            if (!u) throw new RangeError(`unknown unit '${tok.name}'`);
            if ('shift' in u && u.shift) {
                throw new RangeError(`affine unit '${tok.name}' cannot be used in expressions; use convert()`);
            }
            return quantity(1, tok.name);
        }
        if (tok.kind === 'op' && tok.value === '(') {
            const inner = parseAdditive();
            const close = next();
            if (!close || close.kind !== 'op' || close.value !== ')') {
                throw new SyntaxError('expected )');
            }
            return inner;
        }
        if (tok.kind === 'op' && tok.value === '-') {
            return mulQ(scalar(-1), parseAtom());
        }
        throw new SyntaxError('unexpected token in unit expression');
    }

    /** @returns {Quantity} */
    function parsePower() {
        const base = parseAtom();
        const tok = peek();
        if (tok && tok.kind === 'op' && tok.value === '^') {
            next();
            let sign = 1;
            const s = peek();
            if (s && s.kind === 'op' && (s.value === '+' || s.value === '-')) {
                if (s.value === '-') sign = -1;
                next();
            }
            const e = peek();
            if (!e || e.kind !== 'num') throw new SyntaxError('exponent must be a number');
            next();
            return powQ(base, sign * e.value);
        }
        return base;
    }

    /** @returns {Quantity} */
    function parseTerm() {
        let left = parsePower();
        for (;;) {
            const tok = peek();
            if (tok && tok.kind === 'op' && (tok.value === '*' || tok.value === '/')) {
                const op = next();
                const right = parsePower();
                left = (op.kind === 'op' && op.value === '*') ? mulQ(left, right) : divQ(left, right);
            } else if (startsAtom(tok)) {
                left = mulQ(left, parsePower()); // implicit multiplication
            } else {
                break;
            }
        }
        return left;
    }

    /** @returns {Quantity} */
    function parseAdditive() {
        let left = parseTerm();
        for (;;) {
            const tok = peek();
            if (tok && tok.kind === 'op' && (tok.value === '+' || tok.value === '-')) {
                const op = next();
                const right = parseTerm();
                left = (op.kind === 'op' && op.value === '+') ? addQ(left, right) : subQ(left, right);
            } else {
                break;
            }
        }
        return left;
    }

    const result = parseAdditive();
    if (pos < tokens.length) throw new SyntaxError('trailing tokens in unit expression');
    return result;
}

/* ------------------------------------------------------------------ *
 *  Public API
 * ------------------------------------------------------------------ */

/**
 * Evaluate a unit-bearing arithmetic expression to an SI {@link Quantity}.
 * @param {string} src
 * @returns {Quantity}
 */
export function evaluate(src) {
    const tokens = tokenize(src);
    if (tokens.length === 0) throw new SyntaxError('empty unit expression');
    return parse(tokens);
}

/**
 * Format a quantity as `"<value> <unit>"` (SI base units), e.g. `"29.4 kg·m/s²"`.
 * @param {Quantity} q
 * @returns {string}
 */
export function format(q) {
    // Strip binary-float noise the way the engine's other display helpers do.
    const v = Number.parseFloat(q.value.toPrecision(12));
    return `${v} ${formatDim(q.dim)}`.trimEnd();
}
