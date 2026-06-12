/**
 * @jest-environment node
 */
import { STATE, TRANSITIONS, canTransition, StateMachine } from '../state.js';

describe('canTransition', () => {
    test('allows self-transition', () => {
        expect(canTransition(STATE.IDLE, STATE.IDLE)).toBe(true);
    });
    test('allows idle → entering', () => {
        expect(canTransition(STATE.IDLE, STATE.ENTERING)).toBe(true);
    });
    test('allows entering → operator_set', () => {
        expect(canTransition(STATE.ENTERING, STATE.OPERATOR_SET)).toBe(true);
    });
    test('rejects error → entering directly', () => {
        expect(canTransition(STATE.ERROR, STATE.ENTERING)).toBe(false);
    });
    test('error only allows return to idle', () => {
        expect(canTransition(STATE.ERROR, STATE.IDLE)).toBe(true);
        expect(canTransition(STATE.ERROR, STATE.OPERATOR_SET)).toBe(false);
    });
});

describe('StateMachine', () => {
    test('starts at idle by default', () => {
        const m = new StateMachine();
        expect(m.current).toBe(STATE.IDLE);
    });

    test('transition() respects table', () => {
        const m = new StateMachine();
        expect(m.transition(STATE.ENTERING)).toBe(true);
        expect(m.current).toBe(STATE.ENTERING);
        expect(m.transition(STATE.ERROR)).toBe(true);
        // error → entering is illegal
        expect(m.transition(STATE.ENTERING)).toBe(false);
        expect(m.current).toBe(STATE.ERROR);
    });

    test('change event fires with from/to', () => {
        const m = new StateMachine();
        const spy = jest.fn();
        m.addEventListener('change', spy);
        m.transition(STATE.ENTERING);
        expect(spy).toHaveBeenCalledTimes(1);
        const evt = spy.mock.calls[0][0];
        expect(evt.detail).toEqual({ from: STATE.IDLE, to: STATE.ENTERING });
    });

    test('restore() bypasses validation', () => {
        const m = new StateMachine(STATE.ERROR);
        // illegal via transition()
        expect(m.transition(STATE.OPERATOR_SET)).toBe(false);
        // legal via restore()
        m.restore(STATE.OPERATOR_SET);
        expect(m.current).toBe(STATE.OPERATOR_SET);
    });

    test('TRANSITIONS table is frozen', () => {
        expect(Object.isFrozen(TRANSITIONS)).toBe(true);
    });
});
