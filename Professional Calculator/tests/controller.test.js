/**
 * @jest-environment jsdom
 */
import { CalculatorView } from '../view.js';
import { CalculatorController } from '../controller.js';
import { STATE } from '../state.js';

/**
 * Build a fresh DOM and controller for each test. Mirrors the
 * production HTML closely enough that the controller can wire up.
 */
function setup() {
    document.body.innerHTML = `
        <div id="sr-announcer" aria-live="polite" aria-atomic="true"></div>
        <output class="display-main">0</output>
        <div class="display-secondary"></div>
        <div id="calculator-keypad">
            <button class="btn btn-number"  data-type="number"  data-number="0">0</button>
            <button class="btn btn-number"  data-type="number"  data-number="1">1</button>
            <button class="btn btn-number"  data-type="number"  data-number="2">2</button>
            <button class="btn btn-number"  data-type="number"  data-number="3">3</button>
            <button class="btn btn-number"  data-type="number"  data-number="5">5</button>
            <button class="btn btn-number"  data-type="number"  data-number="."> . </button>
            <button class="btn btn-operator" data-type="operator" data-operator="+">+</button>
            <button class="btn btn-operator" data-type="operator" data-operator="-">−</button>
            <button class="btn btn-operator" data-type="operator" data-operator="*">×</button>
            <button class="btn btn-operator" data-type="operator" data-operator="/">÷</button>
            <button class="btn btn-equals"   data-type="action"   data-action="equals">=</button>
            <button class="btn btn-function" data-type="action"   data-action="clear">C</button>
            <button class="btn btn-function" data-type="action"   data-action="delete">←</button>
            <button class="btn btn-function" data-type="action"   data-action="negate">±</button>
            <button class="btn btn-function" data-type="action"   data-action="percent">%</button>
            <button class="btn btn-function" data-type="action"   data-action="undo">undo</button>
            <button class="btn btn-function" data-type="action"   data-action="redo">redo</button>
        </div>
        <ul id="history-list"></ul>
    `;
    const view = new CalculatorView({
        displayMain:      document.querySelector('.display-main'),
        displaySecondary: document.querySelector('.display-secondary'),
        announcer:        document.getElementById('sr-announcer'),
        historyList:      document.getElementById('history-list'),
        undoButton:       document.querySelector('[data-action="undo"]'),
        redoButton:       document.querySelector('[data-action="redo"]'),
        helpDialog:       null,
    });
    const controller = new CalculatorController({
        view,
        keypad:  document.getElementById('calculator-keypad'),
        sidebar: document.getElementById('history-list'),
    });
    return { controller, view };
}

/** Sleep just past the debounce window so successive ops register. */
const wait = () => new Promise((r) => setTimeout(r, 40));

describe('Controller — basic arithmetic', () => {
    test('5 + 3 = 8', async () => {
        const { controller } = setup();
        controller.appendNumber('5');     await wait();
        controller.setOperator('+');      await wait();
        controller.appendNumber('3');     await wait();
        controller.calculate();
        expect(controller.currentValue).toBe('8');
        expect(controller.fsm.current).toBe(STATE.IDLE);
    });

    test('chained: 5 + 3 + 2 = 10 (left-to-right)', async () => {
        const { controller } = setup();
        controller.appendNumber('5');  await wait();
        controller.setOperator('+');   await wait();
        controller.appendNumber('3');  await wait();
        controller.setOperator('+');   await wait();
        controller.appendNumber('2');  await wait();
        controller.calculate();
        expect(controller.currentValue).toBe('10');
    });

    test('divide by zero shows error', async () => {
        const { controller } = setup();
        controller.appendNumber('5');  await wait();
        controller.setOperator('/');   await wait();
        controller.appendNumber('0');  await wait();
        controller.calculate();
        expect(controller.isInErrorState).toBe(true);
        expect(controller.fsm.current).toBe(STATE.ERROR);
    });
});

describe('Controller — state machine', () => {
    test('idle → entering on digit', () => {
        const { controller } = setup();
        controller.appendNumber('5');
        expect(controller.fsm.current).toBe(STATE.ENTERING);
    });

    test('entering → operator_set on operator', async () => {
        const { controller } = setup();
        controller.appendNumber('5');  await wait();
        controller.setOperator('+');
        expect(controller.fsm.current).toBe(STATE.OPERATOR_SET);
    });

    test('operator_set → idle after equals', async () => {
        const { controller } = setup();
        controller.appendNumber('5');  await wait();
        controller.setOperator('+');   await wait();
        controller.appendNumber('3');  await wait();
        controller.calculate();
        expect(controller.fsm.current).toBe(STATE.IDLE);
    });
});

describe('Controller — undo / redo', () => {
    test('undo restores prior value', async () => {
        const { controller } = setup();
        controller.appendNumber('5');  await wait();
        controller.appendNumber('3');  await wait();
        expect(controller.currentValue).toBe('53');
        controller.undo();
        expect(controller.currentValue).toBe('5');
    });

    test('redo re-applies the undone change', async () => {
        const { controller } = setup();
        controller.appendNumber('5');  await wait();
        controller.appendNumber('3');  await wait();
        controller.undo();             await wait();
        expect(controller.currentValue).toBe('5');
        controller.redo();
        expect(controller.currentValue).toBe('53');
    });

    test('new action invalidates redo', async () => {
        const { controller } = setup();
        controller.appendNumber('5');  await wait();
        controller.appendNumber('3');  await wait();
        controller.undo();             await wait();   // can redo '53'
        controller.appendNumber('7');  await wait();   // branches
        expect(controller.history.canRedo()).toBe(false);
        expect(controller.currentValue).toBe('57');
    });
});

describe('Controller — input rules', () => {
    test('multiple decimals prevented', async () => {
        const { controller } = setup();
        controller.appendNumber('1');  await wait();
        controller.appendNumber('.');  await wait();
        controller.appendNumber('2');  await wait();
        controller.appendNumber('.');  await wait();
        controller.appendNumber('3');  await wait();
        expect(controller.currentValue).toBe('1.23');
    });

    test('toggleNegative respects -0 rule', async () => {
        const { controller } = setup();
        controller.toggleNegative();
        expect(controller.currentValue).toBe('0');
    });

    test('percent moves decimal', async () => {
        const { controller } = setup();
        controller.appendNumber('5');  await wait();
        controller.appendNumber('0');  await wait();
        controller.percent();
        expect(controller.currentValue).toBe('0.5');
    });

    test('delete on single digit returns 0', async () => {
        const { controller } = setup();
        controller.appendNumber('5');  await wait();
        controller.deleteLast();
        expect(controller.currentValue).toBe('0');
    });

    test('clear resets everything', async () => {
        const { controller } = setup();
        controller.appendNumber('5');  await wait();
        controller.setOperator('+');   await wait();
        controller.appendNumber('3');  await wait();
        controller.clear();
        expect(controller.currentValue).toBe('0');
        expect(controller.previousValue).toBe('');
        expect(controller.operator).toBeNull();
        expect(controller.fsm.current).toBe(STATE.IDLE);
    });
});

describe('Controller — click dispatch', () => {
    test('clicking a number button updates value', () => {
        const { controller } = setup();
        const btn = document.querySelector('[data-number="5"]');
        btn.click();
        expect(controller.currentValue).toBe('5');
    });

    test('clicking the equals button calculates', async () => {
        const { controller } = setup();
        document.querySelector('[data-number="5"]').click();   await wait();
        document.querySelector('[data-operator="+"]').click();  await wait();
        document.querySelector('[data-number="3"]').click();    await wait();
        document.querySelector('[data-action="equals"]').click();
        expect(controller.currentValue).toBe('8');
    });
});

describe('Controller — sidebar', () => {
    test('completed calculation appears in sidebar list', async () => {
        const { controller } = setup();
        controller.appendNumber('5');  await wait();
        controller.setOperator('+');   await wait();
        controller.appendNumber('3');  await wait();
        controller.calculate();        await wait();
        expect(controller.history.completed.length).toBe(1);
        expect(controller.history.completed[0].current).toBe('8');
    });

    test('restoreValue replaces current and pushes undo', async () => {
        const { controller } = setup();
        controller.appendNumber('5');  await wait();
        const before = controller.history.canUndo();
        controller.restoreValue('42');
        expect(controller.currentValue).toBe('42');
        expect(controller.history.canUndo()).toBe(true && before);
    });
});

describe('Controller — keyboard', () => {
    test('Enter calculates', async () => {
        const { controller } = setup();
        controller.appendNumber('5');  await wait();
        controller.setOperator('+');   await wait();
        controller.appendNumber('3');  await wait();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(controller.currentValue).toBe('8');
    });

    test('Escape clears', async () => {
        const { controller } = setup();
        controller.appendNumber('9');  await wait();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(controller.currentValue).toBe('0');
    });

    test('event.repeat ignored', () => {
        const { controller } = setup();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: '5', repeat: true }));
        expect(controller.currentValue).toBe('0');
    });

    test('Ctrl+Z undoes', async () => {
        const { controller } = setup();
        controller.appendNumber('5');  await wait();
        controller.appendNumber('3');  await wait();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
        expect(controller.currentValue).toBe('5');
    });

    test('Ctrl+Y redoes', async () => {
        const { controller } = setup();
        controller.appendNumber('5');  await wait();
        controller.appendNumber('3');  await wait();
        controller.undo();             await wait();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }));
        expect(controller.currentValue).toBe('53');
    });
});

describe('Controller — destroy', () => {
    test('destroy removes listeners', () => {
        const { controller } = setup();
        controller.destroy();
        // After destroy, clicks should not change state
        const before = controller.currentValue;
        document.querySelector('[data-number="9"]')?.click();
        expect(controller.currentValue).toBe(before);
    });
});
