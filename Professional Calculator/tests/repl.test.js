/**
 * @jest-environment jsdom
 */
import { ScientificREPL } from '../repl.js';

function setup() {
    document.body.innerHTML = `
        <input id="repl-input" type="text" />
        <ul id="repl-log"></ul>
        <div id="repl-announcer" aria-live="polite"></div>
    `;
    const repl = new ScientificREPL({
        input: /** @type {HTMLInputElement} */ (document.getElementById('repl-input')),
        log: /** @type {HTMLElement} */ (document.getElementById('repl-log')),
        announcer: /** @type {HTMLElement} */ (document.getElementById('repl-announcer')),
    });
    return repl;
}

describe('REPL — evaluation', () => {
    test('evaluates an expression', () => {
        const r = setup().submit('2 + 3 * 4');
        expect(r.ok).toBe(true);
        expect(r.output).toBe('14');
    });
    test('renders a log entry', () => {
        const repl = setup();
        repl.submit('sqrt(2)');
        const entries = document.querySelectorAll('.repl-entry');
        expect(entries.length).toBe(1);
        expect(entries[0].querySelector('.repl-in')?.textContent).toContain('sqrt(2)');
    });
    test('complex result', () => {
        expect(setup().submit('2 + 3i').output).toBe('2 + 3i');
    });
    test('uses scientific functions', () => {
        const r = setup().submit('sin(pi/2) + ln(e)');
        expect(parseFloat(r.output)).toBeCloseTo(2, 10);
    });
});

describe('REPL — variables & ans', () => {
    test('assignment stores variable', () => {
        const repl = setup();
        const a = repl.submit('x = 5');
        expect(a.assigned).toBe('x');
        expect(repl.submit('x^2').output).toBe('25');
    });
    test('ans carries the last result', () => {
        const repl = setup();
        repl.submit('10 / 4');
        expect(repl.submit('ans * 2').output).toBe('5');
    });
    test('chained variable use (quadratic)', () => {
        const repl = setup();
        repl.submit('a = 1');
        repl.submit('b = -3');
        repl.submit('c = 2');
        expect(repl.submit('(-b + sqrt(b^2 - 4*a*c)) / (2*a)').output).toBe('2');
    });
    test("i is not treated as assignable", () => {
        const repl = setup();
        // "i = ..." would be ambiguous; ensure 'i' stays the imaginary unit
        expect(repl.submit('i^2').output).toBe('-1');
    });
});

describe('REPL — symbolic differentiation', () => {
    test('diff(x^2, x) → 2 · x', () => {
        expect(setup().submit('diff(x^2, x)').output).toBe('2 · x');
    });
    test('diff(sin(x), x) → cos(x)', () => {
        expect(setup().submit('diff(sin(x), x)').output).toBe('cos(x)');
    });
    test('diff handles inner commas: diff(log(x,2), x)', () => {
        const r = setup().submit('diff(log(x, 2), x)');
        expect(r.ok).toBe(true);
    });
    test('derivative output is re-evaluable', () => {
        const repl = setup();
        const d = repl.submit('diff(x^3, x)'); // 3 · x ^ 2
        const v = repl.submit('x = 2'); // set x
        void v;
        expect(repl.submit(d.output).output).toBe('12');
    });
});

describe('REPL — errors', () => {
    test('syntax error is reported, not thrown', () => {
        const r = setup().submit('2 *');
        expect(r.ok).toBe(false);
        expect(document.querySelector('.repl-error')).not.toBeNull();
    });
    test('unknown symbol reported', () => {
        expect(setup().submit('frobnicate(3)').ok).toBe(false);
    });
    test('empty input is a no-op', () => {
        const r = setup().submit('   ');
        expect(r.ok).toBe(true);
        expect(document.querySelectorAll('.repl-entry').length).toBe(0);
    });
});

describe('REPL — input handling', () => {
    test('Enter submits and clears input', () => {
        const repl = setup();
        repl.input.value = '6*7';
        repl.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(repl.input.value).toBe('');
        expect(document.querySelector('.repl-out')?.textContent).toContain('42');
    });
    test('ArrowUp recalls history', () => {
        const repl = setup();
        repl.submit('1+1');
        repl.submit('2+2');
        repl.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
        expect(repl.input.value).toBe('2+2');
        repl.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
        expect(repl.input.value).toBe('1+1');
    });
    test('reset clears scope and log', () => {
        const repl = setup();
        repl.submit('x = 9');
        repl.reset();
        expect(document.querySelectorAll('.repl-entry').length).toBe(0);
        expect(repl.submit('x').ok).toBe(false); // x no longer defined
    });
});
