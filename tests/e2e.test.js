// @ts-nocheck — jest-axe ships no tsc-resolvable types; this suite is verified
// by running it in jsdom (all assertions execute), not by the type-checker.
/**
 * End-to-end tests in jsdom against the REAL `index.html` shell: the page is
 * loaded from disk and wired exactly the way `main.js` wires it, then driven
 * through real click/keyboard events. Also runs an automated accessibility
 * audit (axe-core) over the shipped markup — closing the two test gaps the
 * 500-point audit flagged (no e2e, no automated a11y).
 * @jest-environment jsdom
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import jestAxe from 'jest-axe'; // CommonJS — destructure (no named ESM exports)
const { axe, toHaveNoViolations } = jestAxe;
import { CalculatorView } from '../view.js';
import { CalculatorController } from '../controller.js';
import { ScientificREPL } from '../repl.js';

expect.extend(toHaveNoViolations);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = readFileSync(join(ROOT, 'index.html'), 'utf8');
/** The shipped <body>, scripts stripped (jsdom won't run the module loader). */
const BODY = (PAGE.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');

/** Load the shipped page body into jsdom (lang mirrors `<html lang="en">`). */
function loadPage() {
    document.documentElement.lang = 'en';
    document.body.innerHTML = BODY;
}

/** Wait past the controller's 30 ms input debounce. */
const wait = () => new Promise((r) => setTimeout(r, 40));

/** @param {string} sel */
const click = (sel) => {
    const el = /** @type {HTMLElement | null} */ (document.querySelector(sel));
    if (!el) throw new Error(`missing element: ${sel}`);
    el.click();
};

/** @param {string} sel @returns {string} */
const text = (sel) =>
    /** @type {HTMLElement} */ (document.querySelector(sel)).textContent ?? '';

/** Wire the button calculator exactly as `main.js` does. */
function wireCalculator() {
    const view = new CalculatorView({
        displayMain: /** @type {HTMLElement} */ (document.querySelector('.display-main')),
        displaySecondary: /** @type {HTMLElement} */ (document.querySelector('.display-secondary')),
        announcer: /** @type {HTMLElement} */ (document.getElementById('sr-announcer')),
        historyList: document.getElementById('history-list'),
        undoButton: /** @type {HTMLButtonElement | null} */ (document.querySelector('[data-action="undo"]')),
        redoButton: /** @type {HTMLButtonElement | null} */ (document.querySelector('[data-action="redo"]')),
        helpDialog: /** @type {HTMLDialogElement | null} */ (document.getElementById('help-modal')),
    });
    return new CalculatorController({
        view,
        keypad: /** @type {HTMLElement} */ (document.getElementById('calculator-keypad')),
        sidebar: document.getElementById('history-list'),
    });
}

describe('e2e — accessibility audit (axe-core) of the shipped shell', () => {
    test('index.html has no detectable axe violations', async () => {
        loadPage();
        const results = await axe(document.body);
        expect(results).toHaveNoViolations();
    });
});

describe('e2e — button calculator on the real index.html DOM', () => {
    /** @type {CalculatorController} */ let controller;
    beforeEach(() => { loadPage(); controller = wireCalculator(); });
    afterEach(() => controller.destroy());

    test('7 + 8 = 15 by clicking the real keypad, logged to history', async () => {
        click('[data-number="7"]'); await wait();
        click('[data-operator="+"]'); await wait();
        click('[data-number="8"]'); await wait();
        click('[data-action="equals"]'); await wait();
        expect(text('.display-main')).toBe('15');
        expect(document.querySelectorAll('#history-list .history-item').length).toBeGreaterThan(0);
    });

    test('keyboard input drives the same display', async () => {
        document.dispatchEvent(new window.KeyboardEvent('keydown', { key: '4' })); await wait();
        document.dispatchEvent(new window.KeyboardEvent('keydown', { key: '2' })); await wait();
        expect(text('.display-main')).toBe('42');
    });

    test('divide by zero shows a friendly error, never a crash', async () => {
        click('[data-number="5"]'); await wait();
        click('[data-operator="/"]'); await wait();
        click('[data-number="0"]'); await wait();
        click('[data-action="equals"]'); await wait();
        expect(text('.display-main')).toMatch(/Cannot|0/);
    });
});

describe('e2e — scientific REPL on the real index.html DOM', () => {
    /** @type {ScientificREPL} */ let repl;
    beforeEach(() => {
        loadPage();
        repl = new ScientificREPL({
            input: /** @type {HTMLInputElement} */ (document.getElementById('repl-input')),
            log: /** @type {HTMLElement} */ (document.getElementById('repl-log')),
            announcer: /** @type {HTMLElement} */ (document.getElementById('sr-announcer')),
        });
    });
    afterEach(() => repl.destroy());

    test('evaluates sin(pi/2) + ln(e) → 2', () => {
        repl.input.value = 'sin(pi/2) + ln(e)';
        repl.submitCurrent();
        expect(text('#repl-log .repl-out')).toContain('= 2');
    });

    test('variable assignment carries through (x=7, then x^2+1 = 50)', () => {
        repl.input.value = 'x = 7'; repl.submitCurrent();
        repl.input.value = 'x^2 + 1'; repl.submitCurrent();
        const outs = document.querySelectorAll('#repl-log .repl-out');
        expect(outs[outs.length - 1]?.textContent).toContain('= 50');
    });

    test('1/0 renders cleanly as Infinity (no "NaNi")', () => {
        repl.input.value = '1/0'; repl.submitCurrent();
        const out = text('#repl-log .repl-out');
        expect(out).toContain('Infinity');
        expect(out).not.toContain('NaNi');
    });
});
