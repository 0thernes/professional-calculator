// @ts-check
/**
 * Scientific REPL controller. Drives the expression-input panel: evaluates
 * what the user types via the {@link module:math/parser}, supports variable
 * assignment (`x = 3`), an implicit `ans` of the last result, command history
 * (↑/↓), and a scrollback log. The 4-function button calculator and this
 * REPL coexist; this never touches the calculator's DOM.
 *
 * @module repl
 */

import { compute } from './math/parser.js';
import { diff, integral } from './math/symbolic.js';
import * as C from './math/complex.js';

/**
 * @typedef {object} ReplElements
 * @property {HTMLInputElement} input
 * @property {HTMLElement} log
 * @property {HTMLElement} [announcer]
 */

/** Matches a bare assignment `name = expr` (name not followed by another '='). */
const ASSIGN_RE = /^\s*([A-Za-z_]\w*)\s*=\s*(?!=)(.+)$/;
/** Matches `diff(<expr>, <var>)` — greedy expr so the LAST comma splits off the var. */
const DIFF_RE = /^\s*diff\(\s*(.+),\s*([A-Za-z_]\w*)\s*\)\s*$/;
/** Matches `integrate(<expr>, <var>)` (alias `integral`). */
const INTEGRATE_RE = /^\s*(?:integrate|integral)\(\s*(.+),\s*([A-Za-z_]\w*)\s*\)\s*$/;

export class ScientificREPL {
    /** @param {ReplElements} el */
    constructor(el) {
        this.input = el.input;
        this.log = el.log;
        this.announcer = el.announcer ?? null;
        /** User-assigned variables + implicit `ans` (scalars or matrices). @type {Record<string, number | import('./math/complex.js').Complex | number[][]>} */
        this.scope = { ans: 0 };
        /** Command history for ↑/↓ recall. @type {string[]} */
        this.commandHistory = [];
        this.historyIndex = -1;

        this._onKeydown = this._handleKeydown.bind(this);
        this.input.addEventListener('keydown', this._onKeydown);
    }

    /**
     * Evaluate a line of input. Returns a structured outcome (also rendered to
     * the log). Pure-ish: only mutates scope/history and the DOM log.
     * @param {string} raw
     * @returns {{ ok: boolean, input: string, output: string, assigned?: string }}
     */
    submit(raw) {
        const text = raw.trim();
        if (text === '') return { ok: true, input: '', output: '' };

        this.commandHistory.push(text);
        this.historyIndex = this.commandHistory.length;

        try {
            // Symbolic differentiation: diff(expr, x) → derivative expression.
            const dm = DIFF_RE.exec(text);
            if (dm) {
                const out = diff(dm[1], dm[2]).string;
                this._render(text, out, false);
                return { ok: true, input: text, output: out };
            }
            // Symbolic integration: integrate(expr, x) → antiderivative (+C).
            const im = INTEGRATE_RE.exec(text);
            if (im) {
                const out = `${integral(im[1], im[2]).string} + C`;
                this._render(text, out, false);
                return { ok: true, input: text, output: out };
            }
            const assign = ASSIGN_RE.exec(text);
            // Only treat as assignment when the LHS is a plain new variable
            // (not a reserved imaginary unit).
            if (assign && assign[1] !== 'i' && assign[1] !== 'j') {
                const name = assign[1];
                const result = compute(assign[2], this.scope);
                this.scope[name] = result.value;
                this.scope.ans = result.value;
                const out = `${name} = ${result.display}`;
                this._render(text, out, false);
                return { ok: true, input: text, output: out, assigned: name };
            }
            const result = compute(text, this.scope);
            this.scope.ans = result.value;
            this._render(text, result.display, false);
            return { ok: true, input: text, output: result.display };
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this._render(text, msg, true);
            return { ok: false, input: text, output: msg };
        }
    }

    /** Submit whatever is currently in the input box, then clear it. */
    submitCurrent() {
        const value = this.input.value;
        const outcome = this.submit(value);
        // Clear only on success, so a failed expression stays editable (↑ still recalls it).
        if (outcome.ok) this.input.value = '';
        return outcome;
    }

    /**
     * @param {string} inText
     * @param {string} outText
     * @param {boolean} isError
     */
    _render(inText, outText, isError) {
        if (!inText) return;
        const entry = document.createElement('li');
        entry.className = `repl-entry${isError ? ' repl-error' : ''}`;

        const inEl = document.createElement('div');
        inEl.className = 'repl-in';
        inEl.textContent = `› ${inText}`;

        const outEl = document.createElement('div');
        outEl.className = 'repl-out';
        outEl.textContent = isError ? `⚠ ${outText}` : `= ${outText}`;

        entry.append(inEl, outEl);
        this.log.appendChild(entry);
        this.log.scrollTop = this.log.scrollHeight;

        if (this.announcer) {
            this.announcer.textContent = '';
            const a = this.announcer;
            queueMicrotask(() => { a.textContent = isError ? `Error: ${outText}` : `Result ${outText}`; });
        }
    }

    /** @param {KeyboardEvent} e */
    _handleKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.submitCurrent();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this._recall(-1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this._recall(1);
        }
    }

    /** @param {number} dir */
    _recall(dir) {
        if (this.commandHistory.length === 0) return;
        this.historyIndex = Math.max(0, Math.min(this.commandHistory.length, this.historyIndex + dir));
        this.input.value = this.commandHistory[this.historyIndex] ?? '';
        // place caret at end
        const len = this.input.value.length;
        this.input.setSelectionRange(len, len);
    }

    /** Clear scope (keeping ans=0) and the visible log. */
    reset() {
        this.scope = { ans: 0 };
        this.log.replaceChildren();
    }

    destroy() {
        this.input.removeEventListener('keydown', this._onKeydown);
    }
}

/** Re-export for callers that just want one-shot evaluation. */
export { compute, C };
