// @ts-check
/**
 * View — all DOM mutation lives here. Pure functions in engine.js produce
 * values; the View renders them. The Controller is the only thing that
 * talks to both.
 *
 * Includes the single-element screen-reader announcer (P3) and the
 * history sidebar renderer.
 *
 * @module view
 */

import { operatorSymbol } from './engine.js';

/**
 * @typedef {object} ViewElements
 * @property {HTMLElement} displayMain
 * @property {HTMLElement} displaySecondary
 * @property {HTMLElement} announcer
 * @property {HTMLElement | null} historyList
 * @property {HTMLButtonElement | null} undoButton
 * @property {HTMLButtonElement | null} redoButton
 * @property {HTMLDialogElement | null} helpDialog
 */

export class CalculatorView extends EventTarget {
    /** @param {ViewElements} elements */
    constructor(elements) {
        super();
        this.el = elements;
        /** @type {number | null} */
        this._announceTimer = null;
    }

    /** @param {string} value */
    renderMain(value) {
        if (this.el.displayMain.textContent !== value) {
            this.el.displayMain.textContent = value;
        }
    }

    /**
     * @param {string} previousValue
     * @param {(import('./engine.js').Operator | null)} operator
     */
    renderSecondary(previousValue, operator) {
        const text = operator ? `${previousValue} ${operatorSymbol(operator)}` : '';
        if (this.el.displaySecondary.textContent !== text) {
            this.el.displaySecondary.textContent = text || ' '; // non-breaking space to preserve height
        }
    }

    /**
     * @param {string} message
     * @param {import('./engine.js').ErrorType | 'system'} type
     */
    renderError(message, type) {
        this.el.displayMain.textContent = message;
        this.el.displayMain.classList.add('is-error');
        this.el.displayMain.setAttribute('role', 'alert');
        this.el.displayMain.setAttribute('aria-live', 'assertive');
        this.el.displayMain.setAttribute('data-error-type', type);

        const label = { validation: 'Input validation error',
                        computation: 'Calculation error',
                        system: 'System error' }[type] || 'Error';
        this.announce(`${label}: ${message}`);
    }

    clearError() {
        this.el.displayMain.classList.remove('is-error');
        this.el.displayMain.removeAttribute('role');
        this.el.displayMain.removeAttribute('aria-live');
        this.el.displayMain.removeAttribute('data-error-type');
    }

    /** @param {string} message */
    announce(message) {
        const node = this.el.announcer;
        node.textContent = '';
        // Microtask delay forces AT to re-announce identical strings.
        queueMicrotask(() => { node.textContent = message; });
    }

    /**
     * @param {boolean} canUndo
     * @param {boolean} canRedo
     */
    renderHistoryControls(canUndo, canRedo) {
        if (this.el.undoButton) this.el.undoButton.disabled = !canUndo;
        if (this.el.redoButton) this.el.redoButton.disabled = !canRedo;
    }

    /**
     * Render the sidebar list of completed calculations.
     * @param {import('./history.js').Snapshot[]} snapshots
     */
    renderHistoryList(snapshots) {
        const list = this.el.historyList;
        if (!list) return;
        // Build off-DOM, then swap in one go (DOM batching).
        const frag = document.createDocumentFragment();
        for (const snap of snapshots) {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.setAttribute('role', 'button');
            li.tabIndex = 0;
            li.setAttribute('data-value', snap.current);
            const text = snap.label ?? `${snap.previous} ${snap.operator ? operatorSymbol(snap.operator) : ''} = ${snap.current}`;
            li.textContent = text.replace(/\s+/g, ' ').trim();
            li.title = `Click to restore ${snap.current}`;
            frag.appendChild(li);
        }
        list.replaceChildren(frag);
    }

    /** Visual press feedback on a button. @param {HTMLElement} btn */
    pulsePress(btn) {
        btn.classList.add('is-pressed');
        setTimeout(() => btn.classList.remove('is-pressed'), 150);
    }

    /** Pulse the clear button when an error needs manual attention. */
    highlightClear() {
        const clearBtn = document.querySelector('[data-action="clear"]');
        if (!clearBtn) return;
        clearBtn.classList.add('is-highlighted');
        setTimeout(() => clearBtn.classList.remove('is-highlighted'), 2500);
    }

    openHelp() {
        const d = this.el.helpDialog;
        if (d && typeof d.showModal === 'function' && !d.open) d.showModal();
    }
}
