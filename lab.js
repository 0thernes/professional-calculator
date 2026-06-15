// @ts-check
/**
 * Interactive engine surfaces layered on top of the REPL:
 *
 *  - {@link initPalette}   wires the capability "chips" so a click inserts a
 *    real, runnable expression into the REPL and evaluates it.
 *  - {@link initMatrixLab} drives the Linear Algebra Lab: it parses a matrix
 *    literal through the engine's own parser, then runs det / eigenvalues /
 *    inverse / SVD / condition number / … live and renders the result.
 *
 * Pure presentation glue — all DOM writes use textContent / createElement
 * (no innerHTML), so nothing here is an injection surface.
 *
 * @module lab
 */

/** @typedef {import('./math/complex.js').Complex} Complex */
/** @typedef {number[][]} Matrix */

/* ------------------------------------------------------------------ *
 *  Capability palette
 * ------------------------------------------------------------------ */

/**
 * Wire every `[data-insert]` chip: click → fill the REPL input with the
 * expression and submit it.
 * @param {import('./repl.js').ScientificREPL} repl
 */
export function initPalette(repl) {
    const chips = document.querySelectorAll('[data-insert]');
    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            const expr = /** @type {HTMLElement} */ (chip).dataset.insert;
            if (!expr) return;
            repl.input.value = expr;
            repl.input.focus();
            repl.submitCurrent();
        });
    });
}

/* ------------------------------------------------------------------ *
 *  Linear Algebra Lab
 * ------------------------------------------------------------------ */

/** Format a real number for compact, readable display. @param {number} x @returns {string} */
function fmt(x) {
    if (!Number.isFinite(x)) return String(x);
    const r = Math.abs(x) < 1e-12 ? 0 : x;
    return Number.isInteger(r) ? String(r) : parseFloat(r.toPrecision(6)).toString();
}

/** Format a complex number. @param {Complex} z @returns {string} */
function fmtComplex(z) {
    if (Math.abs(z.im) < 1e-12) return fmt(z.re);
    const sign = z.im < 0 ? '−' : '+';
    return `${fmt(z.re)} ${sign} ${fmt(Math.abs(z.im))}i`;
}

/** Build a titled block. @param {string} title @returns {HTMLDivElement} */
function block(title) {
    const wrap = document.createElement('div');
    const t = document.createElement('span');
    t.className = 'ml-title';
    t.textContent = title;
    wrap.appendChild(t);
    return wrap;
}

/** Render a matrix as a bracketed grid. @param {Matrix} m @returns {HTMLElement} */
function renderMatrix(m) {
    const grid = document.createElement('div');
    grid.className = 'mtx';
    const cols = m.length ? m[0].length : 0;
    grid.style.gridTemplateColumns = `repeat(${cols}, auto)`;
    for (const row of m) {
        for (const cell of row) {
            const c = document.createElement('span');
            c.className = 'mtx-cell';
            c.textContent = fmt(cell);
            grid.appendChild(c);
        }
    }
    return grid;
}

/** Render a list of strings as stacked rows. @param {string[]} items @returns {HTMLElement} */
function renderList(items) {
    const ul = document.createElement('div');
    ul.className = 'ml-list';
    for (const it of items) {
        const li = document.createElement('span');
        li.textContent = it;
        ul.appendChild(li);
    }
    return ul;
}

/** @param {number} x @returns {HTMLElement} */
function renderScalar(x) {
    const s = document.createElement('span');
    s.className = 'ml-scalar';
    s.textContent = fmt(x);
    return s;
}

/**
 * Wire the Matrix Lab operation buttons to the engine.
 * @param {typeof import('./math/index.js')} math
 */
export function initMatrixLab(math) {
    const input = /** @type {HTMLTextAreaElement | null} */ (document.getElementById('ml-input'));
    const output = document.getElementById('ml-output');
    if (!input || !output) return;
    const buttons = document.querySelectorAll('.ml-ops [data-op]');
    const { Matrix, Decomposition } = math;

    /** @param {HTMLElement} node */
    const show = (node) => output.replaceChildren(node);

    /** @param {string} msg */
    const showError = (msg) => {
        const e = document.createElement('span');
        e.className = 'ml-err';
        e.textContent = `⚠ ${msg}`;
        show(e);
    };

    /** Parse the textarea into a real matrix via the engine's own parser. @returns {Matrix} */
    const readMatrix = () => {
        const res = math.compute(input.value.trim());
        if (!res.isMatrix) throw new Error('enter a matrix literal, e.g. [[1,2],[3,4]]');
        return /** @type {Matrix} */ (res.value);
    };

    /** @param {string} op */
    const run = (op) => {
        try {
            const m = readMatrix();
            switch (op) {
                case 'det':       return show(wrap('det A', renderScalar(Matrix.det(m))));
                case 'trace':     return show(wrap('tr A', renderScalar(Matrix.trace(m))));
                case 'rank':      return show(wrap('rank A', renderScalar(Matrix.rank(m))));
                case 'norm':      return show(wrap('‖A‖_F', renderScalar(Matrix.normFro(m))));
                case 'transpose': return show(wrap('Aᵀ', renderMatrix(Matrix.transpose(m))));
                case 'inv':       return show(wrap('A⁻¹', renderMatrix(Matrix.inv(m))));
                case 'cond':      return show(wrap('cond₂(A) = κ', renderScalar(Decomposition.conditionNumber(m))));
                case 'svd':
                    return show(wrap('singular values σ', renderList(Decomposition.singularValues(m).map(fmt))));
                case 'eig':
                    return show(wrap('eigenvalues λ', renderList(Matrix.eigenvalues(m).map(fmtComplex))));
                default:
                    return showError(`unknown operation '${op}'`);
            }
        } catch (err) {
            showError(err instanceof Error ? err.message : String(err));
        }
    };

    /** @param {string} title @param {HTMLElement} body @returns {HTMLElement} */
    function wrap(title, body) {
        const b = block(title);
        b.appendChild(body);
        return b;
    }

    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const op = /** @type {HTMLElement} */ (btn).dataset.op;
            if (op) run(op);
        });
    });
}
