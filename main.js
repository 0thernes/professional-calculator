// @ts-check
/**
 * Bootstrap entry point. Resolves DOM elements, wires the controller,
 * exposes a frozen public surface on window.__calculator.
 *
 * @module main
 */

import { CEvent } from './events.js';
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
            controller.history.dispatchEvent(new CEvent('completedChange'));
        });
    }

    bootstrapScientificEngine();
}

/**
 * Wire up the scientific REPL panel and populate the capability cheatsheet.
 * Loaded lazily so the core calculator works even if the engine modules are
 * unavailable.
 */
async function bootstrapScientificEngine() {
    const input = /** @type {HTMLInputElement | null} */ (document.getElementById('repl-input'));
    const log = document.getElementById('repl-log');
    if (!input || !log) return;
    try {
        const [{ ScientificREPL }, mathIndex] = await Promise.all([
            import('./repl.js'),
            import('./math/index.js'),
        ]);
        const announcer = document.getElementById('sr-announcer');
        const repl = new ScientificREPL({ input, log, announcer: announcer ?? undefined });

        // populate capability list
        const capList = document.getElementById('repl-capabilities');
        if (capList) {
            const frag = document.createDocumentFragment();
            for (const cap of mathIndex.CAPABILITIES) {
                const li = document.createElement('li');
                const strong = document.createElement('strong');
                strong.textContent = `${cap.domain}: `;
                li.append(strong, document.createTextNode(cap.functions.join(', ')));
                frag.appendChild(li);
            }
            capList.replaceChildren(frag);
        }
        const versionBadge = document.getElementById('repl-version');
        if (versionBadge) versionBadge.textContent = `v${mathIndex.VERSION}`;

        // STEM Lab paged visualizations
        const stemController = await bootstrapStemLab();

        // expose for debugging/testing
        Object.defineProperty(window, '__sciEngine', {
            value: Object.freeze({ repl, stem: stemController, ...mathIndex }),
            configurable: false, writable: false, enumerable: false,
        });
    } catch (err) {
        console.error('Scientific engine failed to load:', err);
        log.innerHTML = '<li class="repl-entry repl-error"><div class="repl-out">⚠ engine unavailable</div></li>';
    }
}

/**
 * Wire up the STEM Lab paged visualizer (prev/next buttons + arrow keys).
 * @returns {Promise<import('./stem.js').StemController | null>}
 */
async function bootstrapStemLab() {
    const stage = document.getElementById('stem-stage');
    const title = document.getElementById('stem-title');
    const caption = document.getElementById('stem-caption');
    const indicator = document.getElementById('stem-indicator');
    if (!stage || !title || !caption || !indicator) return null;
    const { StemController } = await import('./stem.js');
    const controller = new StemController({ stage, title, caption, indicator });
    controller.start();

    document.getElementById('stem-prev')?.addEventListener('click', () => controller.prev());
    document.getElementById('stem-next')?.addEventListener('click', () => controller.next());
    // Arrow keys cycle pages when focus isn't in a text input.
    document.addEventListener('keydown', (e) => {
        const tag = /** @type {HTMLElement} */ (e.target)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (e.key === 'ArrowLeft') controller.prev();
        else if (e.key === 'ArrowRight') controller.next();
    });
    return controller;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
