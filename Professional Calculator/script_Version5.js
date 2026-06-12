/**
 * Professional Calculator — Definitive Production Version
 *
 * Fixes mapped to the 17-dimension audit:
 *  L1  Event-listener leak  → bound handler refs stored on instance
 *  L2  History not captured after calculate → saveToHistory() on success
 *  L3  Undo doesn't restore state → state snapshot in history entry
 *  L4  Double-click bypass → time-window debounce in canOperate()
 *  L5  Keyboard repeat spam → event.repeat guard
 *  L6  Dead code in updateSecondaryDisplay → simplified
 *  L7  Display color leak across error state → CSS class, not inline style
 *  L9  Input normalization → leading-zero rules tightened
 *  L10 State-machine validation → TRANSITIONS table enforced
 *  Q1  Cyclomatic complexity → strategy dispatch map (CC: 9 → 2)
 *  Q2  Sparse try/catch → withErrorBoundary() wraps every public op
 *  Q3  Type validation → strict guards on appendNumber/setOperator
 *  P1  Array.shift() O(n) → CircularBuffer O(1)
 *  P3  announce() DOM churn → single live region reused
 *  P4  classList.contains() O(n) → data-type O(1) dispatch
 *  A1  Display semantics → <output>, sr-only help, atomic live region
 *  A2  Error type classification → validation | computation | system
 *  SEC2 window.__calculator exposure → frozen public surface only
 *  UX1 Undo button → wired up
 *  UX4 Help modal → keyboard-discoverable
 */

'use strict';

/** @typedef {{ displayElement?: Element, displaySecElement?: Element, buttonElements?: NodeListOf<HTMLElement>, keypadElement?: HTMLElement, debug?: boolean }} CalculatorConfig */
/** @typedef {HTMLElement & { dataset: DOMStringMap }} CalculatorButton */

/* ──────────────────────────────────────────────────────────────
   CircularBuffer — O(1) push/pop, fixed memory footprint (P1)
   ────────────────────────────────────────────────────────────── */
class CircularBuffer {
    /**
     * @param {number} capacity
     */
    constructor(capacity) {
        this.capacity = capacity;
        this.buffer = new Array(capacity);
        this.head = 0;       // next write index
        this.length = 0;
    }
    /** @param {unknown} item */
    push(item) {
        this.buffer[this.head] = item;
        this.head = (this.head + 1) % this.capacity;
        if (this.length < this.capacity) this.length++;
    }
    pop() {
        if (this.length === 0) return null;
        this.head = (this.head - 1 + this.capacity) % this.capacity;
        const item = this.buffer[this.head];
        this.buffer[this.head] = undefined;
        this.length--;
        return item;
    }
    clear() {
        this.buffer = new Array(this.capacity);
        this.head = 0;
        this.length = 0;
    }
}

/* ──────────────────────────────────────────────────────────────
   ProfessionalCalculator
   ────────────────────────────────────────────────────────────── */
class ProfessionalCalculator extends EventTarget {

    static CONFIG = {
        MAX_INPUT_LENGTH:       15,
        DECIMAL_PRECISION:      10,
        DECIMAL_POWER:          1e10,
        EXPONENTIAL_THRESHOLD:  1e10,
        ERROR_DISPLAY_TIME:     2500,
        MAX_DISPLAY_CHARS:      18,
        HISTORY_SIZE:           50,
        DEBOUNCE_MS:            30,
    };

    static STATE = Object.freeze({
        IDLE:         'idle',
        ENTERING:     'entering',
        OPERATOR_SET: 'operator_set',
        ERROR:        'error',
    });

    // L10: explicit transition table
    static TRANSITIONS = Object.freeze({
        idle:         ['entering', 'operator_set', 'error'],
        entering:     ['operator_set', 'idle', 'error'],
        operator_set: ['entering', 'idle', 'error'],
        error:        ['idle'],
    });

    static ERROR_TYPES = Object.freeze({
        VALIDATION:  'validation',
        COMPUTATION: 'computation',
        SYSTEM:      'system',
    });

    /* ----------------- construction ----------------- */
    /** @param {CalculatorConfig} config */
    constructor(config = {}) {
        super();

        // SEC4: validated DOM resolution
        this.displayMain      = this._resolveEl(config.displayElement,    '.display-main');
        this.displaySecondary = this._resolveEl(config.displaySecElement, '.display-secondary');
        this.buttons          = config.buttonElements || document.querySelectorAll('.btn');
        this.keypad           = config.keypadElement  || document.getElementById('calculator-keypad');
        this.announcer        = document.getElementById('sr-announcer');
        this.helpDialog       = /** @type {HTMLDialogElement|null} */ (document.getElementById('help-modal'));

        if (!this.buttons || this.buttons.length === 0) {
            throw new Error('No calculator buttons found in DOM');
        }
        if (!this.announcer) {
            // P3: create once if author forgot to include it in HTML
            this.announcer = document.createElement('div');
            this.announcer.id = 'sr-announcer';
            this.announcer.className = 'sr-only';
            this.announcer.setAttribute('aria-live', 'polite');
            this.announcer.setAttribute('aria-atomic', 'true');
            document.body.appendChild(this.announcer);
        }

        // Core state
        this.currentValue       = '0';
        this.previousValue      = '';
        this.operator           = null;
        this.shouldResetDisplay = false;
        /** @type {string} */
        this.state              = ProfessionalCalculator.STATE.IDLE;

        // Error
        this.isInErrorState = false;
        this.errorTimeout   = null;

        // L4 debounce
        this.lastOperationTime = 0;

        // P1: O(1) history
        this.history = new CircularBuffer(ProfessionalCalculator.CONFIG.HISTORY_SIZE);

        // Misc
        this.debug = !!config.debug;

        // L1: stable bound refs so addEventListener / removeEventListener pair up
        this._onClick   = this._handleDelegatedClick.bind(this);
        this._onKeydown = this._handleKeypress.bind(this);

        // Q1: strategy dispatch map (replaces if-else chain)
        /** @type {Record<string, (btn: HTMLElement) => void>} */
        this._strategies = {
            number:   /** @param {HTMLElement} btn */ (btn) => this.appendNumber(btn.dataset.number ?? ''),
            operator: /** @param {HTMLElement} btn */ (btn) => this.setOperator(btn.dataset.operator ?? ''),
            action:   /** @param {HTMLElement} btn */ (btn) => {
                const fn = this._actions[/** @type {keyof typeof this._actions} */(btn.dataset.action)];
                if (fn) fn();
            },
        };
        this._actions = {
            equals:  () => this.calculate(),
            clear:   () => this.clear(),
            delete:  () => this.delete(),
            percent: () => this.percent(),
            negate:  () => this.toggleNegative(),
            undo:    () => this.undo(),
            help:    () => this.openHelp(),
        };

        this._init();
    }

    /** @param {Element|null|undefined} injected @param {string} selector @returns {HTMLElement} */
    _resolveEl(injected, selector) {
        const el = /** @type {HTMLElement|null} */ (injected || document.querySelector(selector));
        if (!el) throw new Error(`Required element not found: ${selector}`);
        return el;
    }

    _init() {
        // OPT1: single delegated click listener at keypad root if available
        if (this.keypad) {
            this.keypad.addEventListener('click', this._onClick);
        } else {
            this.buttons.forEach(btn => btn.addEventListener('click', this._onClick));
        }
        document.addEventListener('keydown', this._onKeydown);

        this._setupTestIds();
        this._log('debug', 'Calculator initialized');
    }

    _setupTestIds() {
        this.buttons.forEach((btn) => {
            const type   = btn.dataset.type;
            const ident  = btn.dataset.number ?? btn.dataset.operator ?? btn.dataset.action ?? 'btn';
            btn.setAttribute('data-testid', `btn-${type}-${ident}`);
        });
    }

    /* ----------------- helpers ----------------- */
    /** @param {string|number} value @returns {boolean} */
    _isValidNumber(value) {
        const n = parseFloat(String(value));
        return !isNaN(n) && isFinite(n);
    }

    _canOperate() {
        if (this.isInErrorState) return false;
        // L4: time-window debounce
        const now = Date.now();
        if (now - this.lastOperationTime < ProfessionalCalculator.CONFIG.DEBOUNCE_MS) {
            return false;
        }
        this.lastOperationTime = now;
        return true;
    }

    /** @param {string} level @param {string} message @param {Record<string, unknown>} [data] */
    _log(level, message, data = {}) {
        if (!this.debug && level === 'debug') return;
        // SEC3: redact numeric payloads when not in debug mode
        const payload = this.debug ? data : this._sanitize(data);
        // eslint-disable-next-line no-console
        console[/** @type {'log'|'debug'|'info'|'warn'|'error'} */(level)](`[Calculator] ${message}`, payload);
    }

    /** @param {Record<string, unknown>} data @returns {Record<string, unknown>} */
    _sanitize(data) {
        /** @type {Record<string, unknown>} */
        const out = {};
        for (const [k, v] of Object.entries(data)) {
            out[k] = /^-?[\d.eE+-]+$/.test(String(v)) ? '[NUM]' : v;
        }
        return out;
    }

    // Q2: wrap public ops with consistent error boundary
    /** @param {string} name @param {() => unknown} fn @returns {unknown} */
    _withBoundary(name, fn) {
        try {
            return fn();
        } catch (err) {
            this._log('error', `${name} failed`, { err: /** @type {Error} */(err).message });
            this._displayError('Error', ProfessionalCalculator.ERROR_TYPES.SYSTEM);
            return undefined;
        }
    }

    // L10: enforce valid state transitions
    /** @param {string} newState */
    _setState(newState) {
        if (this.state === newState) return;
        const allowed = ProfessionalCalculator.TRANSITIONS[/** @type {keyof typeof ProfessionalCalculator.TRANSITIONS} */(this.state)] || [];
        if (!allowed.includes(newState)) {
            this._log('warn', `Invalid state transition`, { from: this.state, to: newState });
            return;
        }
        this._log('debug', `state ${this.state} → ${newState}`);
        this.state = newState;
        this.dispatchEvent(new CustomEvent('stateChanged', { detail: { state: newState } }));
    }

    // L3: include state in history snapshot
    _saveToHistory() {
        this.history.push({
            current:  this.currentValue,
            previous: this.previousValue,
            operator: this.operator,
            state:    this.state,
            shouldResetDisplay: this.shouldResetDisplay,
            timestamp: Date.now(),
        });
    }

    /* ----------------- core operations ----------------- */
    /** @param {string} num */
    appendNumber(num) {
        return this._withBoundary('appendNumber', () => {
            // Q3: type guard
            if (typeof num !== 'string' || !/^[0-9.]$/.test(num)) {
                throw new TypeError(`Invalid digit input: ${num}`);
            }
            if (!this._canOperate()) return;

            this._saveToHistory();

            if (this.shouldResetDisplay) {
                this.currentValue = (num === '.') ? '0.' : num;
                this.shouldResetDisplay = false;
                this._setState(ProfessionalCalculator.STATE.ENTERING);
            } else {
                if (this.currentValue.length >= ProfessionalCalculator.CONFIG.MAX_INPUT_LENGTH) {
                    return;
                }
                if (num === '.') {
                    if (!this.currentValue.includes('.')) this.currentValue += '.';
                } else if (this.currentValue === '0') {
                    this.currentValue = num;          // L9: collapse leading zero
                } else {
                    this.currentValue += num;
                }
                if (this.state === ProfessionalCalculator.STATE.IDLE) {
                    this._setState(ProfessionalCalculator.STATE.ENTERING);
                }
            }

            this._updateDisplay();
            this._log('debug', 'Number appended', { value: this.currentValue });
        });
    }

    /** @param {string} op */
    setOperator(op) {
        return this._withBoundary('setOperator', () => {
            if (!['+', '-', '*', '/'].includes(op)) {
                throw new TypeError(`Invalid operator: ${op}`);
            }
            if (!this._canOperate()) return;
            if (this.currentValue === '' && this.previousValue === '') return;

            // Chained ops: finalize prior before starting new
            if (this.operator !== null && !this.shouldResetDisplay) {
                this.calculate();
                if (this.isInErrorState) return;
            }

            this._saveToHistory();
            this.previousValue = this.currentValue;
            this.operator = op;
            this.shouldResetDisplay = true;
            this._setState(ProfessionalCalculator.STATE.OPERATOR_SET);
            this._updateSecondaryDisplay();
            this._log('debug', 'Operator set', { operator: op });
        });
    }

    toggleNegative() {
        return this._withBoundary('toggleNegative', () => {
            if (!this._canOperate()) return;
            if (!this._isValidNumber(this.currentValue)) {
                this._displayError('Invalid', ProfessionalCalculator.ERROR_TYPES.VALIDATION);
                return;
            }
            this._saveToHistory();
            const v = parseFloat(this.currentValue);
            this.currentValue = (v === 0) ? '0' : (-v).toString();
            this._updateDisplay();
        });
    }

    percent() {
        return this._withBoundary('percent', () => {
            if (!this._canOperate()) return;
            if (!this._isValidNumber(this.currentValue)) {
                this._displayError('Invalid', ProfessionalCalculator.ERROR_TYPES.VALIDATION);
                return;
            }
            this._saveToHistory();
            this.currentValue = this._formatResult(parseFloat(this.currentValue) / 100);
            this.shouldResetDisplay = true;
            this._updateDisplay();
        });
    }

    delete() {
        return this._withBoundary('delete', () => {
            if (!this._canOperate()) return;
            this._saveToHistory();
            if (this.currentValue.length > 1 && this.currentValue !== '-0') {
                this.currentValue = this.currentValue.slice(0, -1);
                // collapse "-" → "0"
                if (this.currentValue === '-' || this.currentValue === '') {
                    this.currentValue = '0';
                }
            } else {
                this.currentValue = '0';
                if (this.state === ProfessionalCalculator.STATE.ENTERING) {
                    this._setState(ProfessionalCalculator.STATE.IDLE);
                }
            }
            this._updateDisplay();
        });
    }

    calculate() {
        return this._withBoundary('calculate', () => {
            if (this.operator === null || this.shouldResetDisplay) return;
            if (this.isInErrorState) return;

            const prev = parseFloat(this.previousValue);
            const cur  = parseFloat(this.currentValue);
            if (!this._isValidNumber(prev) || !this._isValidNumber(cur)) {
                this._displayError('Invalid Input', ProfessionalCalculator.ERROR_TYPES.VALIDATION);
                return;
            }

            let result;
            switch (this.operator) {
                case '+': result = prev + cur; break;
                case '-': result = prev - cur; break;
                case '*': result = prev * cur; break;
                case '/':
                    if (cur === 0) {
                        this._displayError('Cannot ÷ by 0', ProfessionalCalculator.ERROR_TYPES.COMPUTATION);
                        return;
                    }
                    result = prev / cur;
                    break;
                default: return;
            }

            if (!isFinite(result)) {
                this._displayError('Overflow', ProfessionalCalculator.ERROR_TYPES.COMPUTATION);
                return;
            }

            const formatted = this._formatResult(result);
            this.currentValue = formatted;
            this.operator = null;
            this.previousValue = '';
            this.shouldResetDisplay = true;
            this._setState(ProfessionalCalculator.STATE.IDLE);

            // L2: save post-calc snapshot so undo can return here
            this._saveToHistory();

            this._updateDisplay();
            this.displaySecondary.textContent = '';

            this.dispatchEvent(new CustomEvent('calculated', { detail: { result: formatted } }));
            this._log('debug', 'Calculation complete', { result: formatted });
        });
    }

    clear() {
        return this._withBoundary('clear', () => {
            this._saveToHistory();
            this.currentValue       = '0';
            this.previousValue      = '';
            this.operator           = null;
            this.shouldResetDisplay = false;
            this._clearErrorState();
            this._setState(ProfessionalCalculator.STATE.IDLE);
            this._updateDisplay();
            this.displaySecondary.textContent = '';
            this.dispatchEvent(new CustomEvent('cleared'));
        });
    }

    undo() {
        return this._withBoundary('undo', () => {
            const snap = this.history.pop();
            if (!snap) return;
            this.currentValue       = snap.current;
            this.previousValue      = snap.previous;
            this.operator           = snap.operator;
            this.shouldResetDisplay = snap.shouldResetDisplay;
            // bypass transition check — restoring a previously valid state
            this.state = snap.state;
            this._clearErrorState();
            this._updateDisplay();
            this._updateSecondaryDisplay();
            this._announce('Undone');
        });
    }

    openHelp() {
        if (this.helpDialog && typeof this.helpDialog.showModal === 'function') {
            this.helpDialog.showModal();
        }
    }

    /* ----------------- formatting ----------------- */
    /** @param {number} num @returns {string} */
    _formatResult(num) {
        const C = ProfessionalCalculator.CONFIG;
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

    /* ----------------- error handling ----------------- */
    /** @param {string} message @param {string} [type] */
    _displayError(message, type = ProfessionalCalculator.ERROR_TYPES.VALIDATION) {
        // Cancel any previous error timer first
        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
            this.errorTimeout = null;
        }

        this.isInErrorState = true;
        this._setState(ProfessionalCalculator.STATE.ERROR);

        this.displayMain.textContent = message;
        this.displayMain.setAttribute('role', 'alert');
        this.displayMain.setAttribute('aria-live', 'assertive');
        this.displayMain.setAttribute('data-error-type', type);
        this.displayMain.classList.add('is-error');     // L7

        const typeLabel = {
            validation:  'Input validation error',
            computation: 'Calculation error',
            system:      'System error',
        }[type] || 'Error';
        this._announce(`${typeLabel}: ${message}`);

        this.errorTimeout = setTimeout(
            () => this._clearErrorState(),
            ProfessionalCalculator.CONFIG.ERROR_DISPLAY_TIME
        );
    }

    _clearErrorState() {
        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
            this.errorTimeout = null;
        }
        if (!this.isInErrorState) return;
        this.isInErrorState = false;
        this.currentValue   = '0';
        this.displayMain.classList.remove('is-error');
        this.displayMain.removeAttribute('role');
        this.displayMain.removeAttribute('aria-live');
        this.displayMain.removeAttribute('data-error-type');
        this._setState(ProfessionalCalculator.STATE.IDLE);
        this._updateDisplay();
    }

    /* ----------------- view ----------------- */
    _updateDisplay() {
        if (this.displayMain.textContent !== this.currentValue) {
            this.displayMain.textContent = this.currentValue;
        }
    }

    // L6: simplified, no duplicate branches
    _updateSecondaryDisplay() {
        this.displaySecondary.textContent = this.operator
            ? `${this.previousValue} ${this._operatorSymbol(this.operator)}`
            : '';
    }

    /** @param {string} op @returns {string} */
    _operatorSymbol(op) {
        return { '+': '+', '-': '−', '*': '×', '/': '÷' }[/** @type {'+'|'-'|'*'|'/'} */(op)] || op;
    }

    // P3: reuse single live region
    /** @param {string} message */
    _announce(message) {
        if (!this.announcer) return;
        // Toggle textContent to force SR re-announcement of identical strings
        this.announcer.textContent = '';
        // microtask gap so AT picks up the change
        Promise.resolve().then(() => { this.announcer.textContent = message; });
    }

    /* ----------------- event handlers ----------------- */
    /** @param {MouseEvent} event */
    _handleDelegatedClick(event) {
        const btn = /** @type {HTMLElement|null} */ (event.target)?.closest('.btn');
        if (!btn || !this.keypad?.contains(btn) && !btn.classList.contains('btn')) return;
        if (!btn.classList.contains('btn')) return;

        // visual press feedback
        btn.classList.add('is-pressed');
        setTimeout(() => btn.classList.remove('is-pressed'), 150);

        this._dispatch(/** @type {HTMLElement} */ (btn));
    }

    // P4: O(1) dispatch via data-type
    /** @param {HTMLElement} btn */
    _dispatch(btn) {
        const type = btn.dataset.type;
        if (!type) return;
        const strategy = this._strategies[type];
        if (strategy) strategy(btn);
    }

    /** @param {KeyboardEvent} event */
    _handleKeypress(event) {
        // L5: ignore key auto-repeat
        if (event.repeat) return;

        const key = event.key;

        if (key >= '0' && key <= '9') {
            this.appendNumber(key);
        } else if (key === '.') {
            this.appendNumber('.');
        } else if (key === '+' || key === '-') {
            this.setOperator(key);
        } else if (key === '*') {
            event.preventDefault();
            this.setOperator('*');
        } else if (key === '/') {
            event.preventDefault();
            this.setOperator('/');
        } else if (key === 'Enter' || key === '=') {
            event.preventDefault();
            this.calculate();
        } else if (key === 'Backspace') {
            this.delete();
        } else if (key === 'Escape') {
            // If help is open, browser handles ESC; otherwise clear.
            if (!this.helpDialog?.open) this.clear();
        } else if (key === '%') {
            event.preventDefault();
            this.percent();
        } else if ((key === 'u' || key === 'U') && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this.undo();
        } else if ((key === 'n' || key === 'N') && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this.toggleNegative();
        } else if (key === '?' && event.shiftKey) {
            event.preventDefault();
            this.openHelp();
        }
    }

    /* ----------------- teardown ----------------- */
    destroy() {
        this._clearErrorState();
        if (this.keypad) {
            this.keypad.removeEventListener('click', this._onClick);
        } else {
            this.buttons.forEach(btn => btn.removeEventListener('click', this._onClick));
        }
        document.removeEventListener('keydown', this._onKeydown);
        this.history.clear();
        this._log('info', 'Calculator destroyed');
    }
}

/* ──────────────────────────────────────────────────────────────
   Bootstrap
   ────────────────────────────────────────────────────────────── */
function _bootstrap() {
    try {
        const calculator = new ProfessionalCalculator({
            debug: window.location.hostname === 'localhost'
                || window.location.hostname === '127.0.0.1',
        });

        // SEC2: expose only a frozen, read-only public surface
        const publicApi = Object.freeze({
            appendNumber:   calculator.appendNumber.bind(calculator),
            setOperator:    calculator.setOperator.bind(calculator),
            calculate:      calculator.calculate.bind(calculator),
            clear:          calculator.clear.bind(calculator),
            delete:         calculator.delete.bind(calculator),
            percent:        calculator.percent.bind(calculator),
            toggleNegative: calculator.toggleNegative.bind(calculator),
            undo:           calculator.undo.bind(calculator),
            destroy:        calculator.destroy.bind(calculator),
            get state()        { return calculator.state; },
            get value()        { return calculator.currentValue; },
            addEventListener:    calculator.addEventListener.bind(calculator),
            removeEventListener: calculator.removeEventListener.bind(calculator),
        });

        Object.defineProperty(window, '__calculator', {
            value: publicApi,
            configurable: false,
            writable: false,
            enumerable: false,
        });

        // Wipe in-memory history when the page is left (SEC1)
        window.addEventListener('beforeunload', () => calculator.history.clear());
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Calculator failed to initialize:', err);
        const main = document.querySelector('.calculator');
        if (main) {
            main.innerHTML =
                '<p role="alert" style="padding:20px;color:#c00;">' +
                'Calculator initialization failed. Please reload the page.</p>';
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _bootstrap);
} else {
    _bootstrap();
}

// CommonJS export for unit tests (no-op in browser)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProfessionalCalculator, CircularBuffer };
}
