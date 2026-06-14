// @ts-check
/**
 * Controller — wires engine + state + history + view.
 * Receives input events (clicks, keys, history clicks),
 * delegates math to the engine, mutates state, and asks the view
 * to render.
 *
 * @module controller
 */

import * as Engine from './engine.js';
import { STATE, StateMachine } from './state.js';
import { HistoryManager } from './history.js';

const DEBOUNCE_MS         = 30;
const ERROR_DISPLAY_TIME  = 2500;

export class CalculatorController {
    /**
     * @param {{
     *   view: import('./view.js').CalculatorView,
     *   keypad: HTMLElement,
     *   sidebar?: HTMLElement | null,
     *   debug?: boolean
     * }} deps
     */
    constructor(deps) {
        this.view    = deps.view;
        this.keypad  = deps.keypad;
        this.sidebar = deps.sidebar ?? null;
        this.debug   = !!deps.debug;

        this.fsm     = new StateMachine(STATE.IDLE);
        this.history = new HistoryManager(50);

        /** @type {string} */            this.currentValue       = '0';
        /** @type {string} */            this.previousValue      = '';
        /** @type {Engine.Operator|null} */ this.operator         = null;
        /** @type {boolean} */           this.shouldResetDisplay = false;
        /** @type {boolean} */           this.isInErrorState     = false;
        /** @type {number|null} */       this._errorTimer        = null;
        /** @type {number} */            this._lastOp            = 0;

        this._onClick        = this._handleClick.bind(this);
        this._onKey          = this._handleKey.bind(this);
        this._onSidebarClick = this._handleSidebarClick.bind(this);
        this._onSidebarKey   = this._handleSidebarKey.bind(this);

        // Strategy dispatch — O(1) by data-type
        /** @type {Record<string, (btn: HTMLElement) => void>} */
        this._strategies = {
            number:   (btn) => this.appendNumber(btn.dataset.number ?? ''),
            operator: (btn) => this.setOperator(/** @type {Engine.Operator} */ (btn.dataset.operator ?? '')),
            action:   (btn) => {
                const fn = this._actions[btn.dataset.action ?? ''];
                if (fn) fn();
            },
        };
        /** @type {Record<string, () => void>} */
        this._actions = {
            equals:  () => this.calculate(),
            clear:   () => this.clear(),
            delete:  () => this.deleteLast(),
            percent: () => this.percent(),
            negate:  () => this.toggleNegative(),
            undo:    () => this.undo(),
            redo:    () => this.redo(),
            help:    () => this.view.openHelp(),
        };

        this._init();
    }

    /* ============ lifecycle ============ */
    _init() {
        this.keypad.addEventListener('click', this._onClick);
        document.addEventListener('keydown', this._onKey);
        if (this.sidebar) {
            this.sidebar.addEventListener('click', this._onSidebarClick);
            this.sidebar.addEventListener('keydown', this._onSidebarKey);
        }
        this.history.addEventListener('change',          () => this._renderControls());
        this.history.addEventListener('completedChange', () => this._renderSidebar());

        this._renderAll();
    }

    destroy() {
        this.keypad.removeEventListener('click', this._onClick);
        document.removeEventListener('keydown', this._onKey);
        if (this.sidebar) {
            this.sidebar.removeEventListener('click', this._onSidebarClick);
            this.sidebar.removeEventListener('keydown', this._onSidebarKey);
        }
        if (this._errorTimer) clearTimeout(this._errorTimer);
        this.history.clear();
    }

    /* ============ guards ============ */
    _canOperate() {
        if (this.isInErrorState) return false;
        const now = Date.now();
        if (now - this._lastOp < DEBOUNCE_MS) return false;
        this._lastOp = now;
        return true;
    }

    _withBoundary(/** @type {string} */ name, /** @type {() => void} */ fn) {
        try { fn(); } catch (err) {
            if (this.debug) console.error(`[${name}]`, err);
            this._showError('Error', 'computation', true);
        }
    }

    /* ============ snapshot ============ */
    _snapshot() {
        return {
            current: this.currentValue,
            previous: this.previousValue,
            operator: this.operator,
            state: this.fsm.current,
            shouldResetDisplay: this.shouldResetDisplay,
            timestamp: Date.now(),
        };
    }

    /* ============ operations ============ */
    /** @param {string} digit */
    appendNumber(digit) {
        this._withBoundary('appendNumber', () => {
            if (!this._canOperate()) return;
            this.history.record(this._snapshot());

            if (this.shouldResetDisplay) {
                this.currentValue = digit === '.' ? '0.' : digit;
                this.shouldResetDisplay = false;
                this.fsm.transition(STATE.ENTERING);
            } else {
                this.currentValue = Engine.appendDigit(this.currentValue, digit);
                if (this.fsm.current === STATE.IDLE) this.fsm.transition(STATE.ENTERING);
            }
            this._renderAll();
        });
    }

    /** @param {Engine.Operator} op */
    setOperator(op) {
        this._withBoundary('setOperator', () => {
            if (!Engine.OPERATORS.includes(op)) throw new TypeError(`Bad operator: ${op}`);
            if (!this._canOperate()) return;
            if (this.currentValue === '' && this.previousValue === '') return;

            if (this.operator !== null && !this.shouldResetDisplay) {
                this.calculate();
                if (this.isInErrorState) return;
            }

            this.history.record(this._snapshot());
            this.previousValue = this.currentValue;
            this.operator = op;
            this.shouldResetDisplay = true;
            this.fsm.transition(STATE.OPERATOR_SET);
            this._renderAll();
        });
    }

    calculate() {
        this._withBoundary('calculate', () => {
            if (this.operator === null || this.shouldResetDisplay) return;
            if (this.isInErrorState) return;

            const result = Engine.compute(this.previousValue, this.currentValue, this.operator);
            if (!result.ok) {
                this._showError(result.error, result.type, result.type === 'computation');
                return;
            }

            const completedLabel =
                `${this.previousValue} ${Engine.operatorSymbol(this.operator)} ${this.currentValue} = ${result.value}`;

            this.history.record(this._snapshot());

            this.currentValue       = result.value;
            this.previousValue      = '';
            this.operator           = null;
            this.shouldResetDisplay = true;
            this.fsm.transition(STATE.IDLE);

            // Sidebar entry (separate from undo stack).
            this.history.recordCompleted({
                ...this._snapshot(),
                label: completedLabel,
            });

            this._renderAll();
            this.view.announce(`Result ${result.value}`);
        });
    }

    toggleNegative() {
        this._withBoundary('toggleNegative', () => {
            if (!this._canOperate()) return;
            if (!Engine.isValidNumber(this.currentValue)) {
                this._showError('Invalid', 'validation', false);
                return;
            }
            this.history.record(this._snapshot());
            this.currentValue = Engine.toggleSign(this.currentValue);
            this._renderAll();
        });
    }

    percent() {
        this._withBoundary('percent', () => {
            if (!this._canOperate()) return;
            if (!Engine.isValidNumber(this.currentValue)) {
                this._showError('Invalid', 'validation', false);
                return;
            }
            this.history.record(this._snapshot());
            this.currentValue = Engine.percent(this.currentValue);
            this.shouldResetDisplay = true;
            this._renderAll();
        });
    }

    deleteLast() {
        this._withBoundary('delete', () => {
            if (!this._canOperate()) return;
            this.history.record(this._snapshot());
            this.currentValue = Engine.deleteLast(this.currentValue);
            if (this.currentValue === '0' && this.fsm.current === STATE.ENTERING) {
                this.fsm.transition(STATE.IDLE);
            }
            this._renderAll();
        });
    }

    clear() {
        this._withBoundary('clear', () => {
            this.history.record(this._snapshot());
            this.currentValue       = '0';
            this.previousValue      = '';
            this.operator           = null;
            this.shouldResetDisplay = false;
            this._clearErrorTimer();
            this.isInErrorState = false;
            this.view.clearError();
            this.fsm.transition(STATE.IDLE);
            this._renderAll();
            this.view.announce('Cleared');
        });
    }

    undo() {
        this._withBoundary('undo', () => {
            const snap = this.history.undo(this._snapshot());
            if (!snap) return;
            this._restoreFrom(snap);
            this.view.announce('Undone');
        });
    }

    redo() {
        this._withBoundary('redo', () => {
            const snap = this.history.redo(this._snapshot());
            if (!snap) return;
            this._restoreFrom(snap);
            this.view.announce('Redone');
        });
    }

    /** @param {import('./history.js').Snapshot} snap */
    _restoreFrom(snap) {
        this.currentValue       = snap.current;
        this.previousValue      = snap.previous;
        this.operator           = snap.operator;
        this.shouldResetDisplay = snap.shouldResetDisplay;
        this.fsm.restore(snap.state);
        this._clearErrorTimer();
        this.isInErrorState = false;
        this.view.clearError();
        this._renderAll();
    }

    /** Restore directly from a sidebar click. @param {string} value */
    restoreValue(value) {
        if (!Engine.isValidNumber(value)) return;
        this.history.record(this._snapshot());
        this.currentValue       = value;
        this.previousValue      = '';
        this.operator           = null;
        this.shouldResetDisplay = true;
        this.fsm.transition(STATE.IDLE);
        this._renderAll();
        this.view.announce(`Restored ${value}`);
    }

    /* ============ error helpers ============ */
    /**
     * @param {string} message
     * @param {import('./engine.js').ErrorType | 'system'} type
     * @param {boolean} requireManualClear
     */
    _showError(message, type, requireManualClear) {
        this._clearErrorTimer();
        this.isInErrorState = true;
        this.fsm.transition(STATE.ERROR);
        this.view.renderError(message, type);
        if (requireManualClear) this.view.highlightClear();
        this._errorTimer = /** @type {any} */ (setTimeout(() => {
            this.isInErrorState = false;
            this.currentValue = '0';
            this.view.clearError();
            this.fsm.restore(STATE.IDLE);
            this._renderAll();
        }, ERROR_DISPLAY_TIME));
    }

    _clearErrorTimer() {
        if (this._errorTimer) {
            clearTimeout(this._errorTimer);
            this._errorTimer = null;
        }
    }

    /* ============ rendering ============ */
    _renderAll() {
        this.view.renderMain(this.currentValue);
        this.view.renderSecondary(this.previousValue, this.operator);
        this._renderControls();
    }
    _renderControls() {
        this.view.renderHistoryControls(this.history.canUndo(), this.history.canRedo());
    }
    _renderSidebar() {
        this.view.renderHistoryList(this.history.completed);
    }

    /* ============ event handlers ============ */
    /** @param {MouseEvent} e */
    _handleClick(e) {
        const btn = /** @type {HTMLElement | null} */ (e.target instanceof Element ? e.target.closest('.btn') : null);
        if (!btn) return;
        this.view.pulsePress(btn);
        const type = btn.dataset.type;
        if (!type) return;
        const strat = this._strategies[type];
        if (strat) strat(btn);
    }

    /** @param {KeyboardEvent} e */
    _handleKey(e) {
        if (e.repeat) return;
        const k = e.key;

        if (k >= '0' && k <= '9')                        return this.appendNumber(k);
        if (k === '.')                                   return this.appendNumber('.');
        if (k === '+' || k === '-')                      return this.setOperator(/** @type {Engine.Operator} */ (k));
        if (k === '*' || k === '/')                    { e.preventDefault(); return this.setOperator(/** @type {Engine.Operator} */ (k)); }
        if (k === 'Enter' || k === '=')                { e.preventDefault(); return this.calculate(); }
        if (k === 'Backspace')                           return this.deleteLast();
        if (k === 'Escape')                              return this.clear();
        if (k === '%')                                 { e.preventDefault(); return this.percent(); }
        if ((k === 'u' || k === 'U' || k === 'z' || k === 'Z') && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
            e.preventDefault(); return this.undo();
        }
        if (((k === 'y' || k === 'Y') && (e.ctrlKey || e.metaKey)) ||
            ((k === 'z' || k === 'Z') && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
            e.preventDefault(); return this.redo();
        }
        if ((k === 'n' || k === 'N') && (e.ctrlKey || e.metaKey)) {
            e.preventDefault(); return this.toggleNegative();
        }
        if (k === '?' && e.shiftKey) { e.preventDefault(); this.view.openHelp(); }
    }

    /** @param {MouseEvent} e */
    _handleSidebarClick(e) {
        const item = /** @type {HTMLElement | null} */ (e.target instanceof Element ? e.target.closest('.history-item') : null);
        if (!item) return;
        const v = item.getAttribute('data-value');
        if (v) this.restoreValue(v);
    }

    /** @param {KeyboardEvent} e */
    _handleSidebarKey(e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const item = /** @type {HTMLElement | null} */ (e.target instanceof Element ? e.target.closest('.history-item') : null);
        if (!item) return;
        e.preventDefault();
        const v = item.getAttribute('data-value');
        if (v) this.restoreValue(v);
    }
}
