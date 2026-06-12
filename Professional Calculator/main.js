// @ts-check
/**
 * Bootstrap entry point. Resolves DOM elements, wires the controller,
 * exposes a frozen public surface on window.__calculator.
 *
 * @module main
 */

import { CalculatorView } from './view.js';
import { CalculatorController } from './controller.js';

function bootstrap() {
    /** @param {string} sel */
    const must = (sel) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error(`Required element not found: ${sel}`);
        return /** @type {HTMLElement} */ (el);
    };

    const displayMain      = must('.display-main');
    const displaySecondary = must('.display-secondary');
    const keypad           = must('#calculator-keypad');
    const announcer        = /** @type {HTMLElement} */ (document.getElementById('sr-announcer')) || (() => {
        const n = document.createElement('div');
        n.id = 'sr-announcer';
        n.className = 'sr-only';
        n.setAttribute('aria-live', 'polite');
        n.setAttribute('aria-atomic', 'true');
        document.body.appendChild(n);
        return n;
    })();

    const view = new CalculatorView({
        displayMain,
        displaySecondary,
        announcer,
        historyList: /** @type {HTMLElement | null} */ (document.getElementById('history-list')),
        undoButton:  /** @type {HTMLButtonElement | null} */ (document.querySelector('[data-action="undo"]')),
        redoButton:  /** @type {HTMLButtonElement | null} */ (document.querySelector('[data-action="redo"]')),
        helpDialog:  /** @type {HTMLDialogElement | null} */ (document.getElementById('help-modal')),
    });

    const controller = new CalculatorController({
        view,
        keypad,
        sidebar: document.getElementById('history-list'),
        debug: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
    });

    // Frozen, read-only public surface (SEC2).
    const api = Object.freeze({
        appendNumber:   controller.appendNumber.bind(controller),
        setOperator:    controller.setOperator.bind(controller),
        calculate:      controller.calculate.bind(controller),
        clear:          controller.clear.bind(controller),
        delete:         controller.deleteLast.bind(controller),
        percent:        controller.percent.bind(controller),
        toggleNegative: controller.toggleNegative.bind(controller),
        undo:           controller.undo.bind(controller),
        redo:           controller.redo.bind(controller),
        destroy:        controller.destroy.bind(controller),
        get value()  { return controller.currentValue; },
        get state()  { return controller.fsm.current; },
    });

    Object.defineProperty(window, '__calculator', {
        value: api,
        configurable: false,
        writable: false,
        enumerable: false,
    });

    window.addEventListener('beforeunload', () => controller.history.clear());

    // Clear-history button
    const clearHistBtn = document.getElementById('clear-history');
    if (clearHistBtn) {
        clearHistBtn.addEventListener('click', () => {
            controller.history.completed = [];
            controller.history.dispatchEvent(new CustomEvent('completedChange'));
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
