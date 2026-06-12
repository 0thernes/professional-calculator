// @ts-check
/**
 * State machine for the calculator. Pure: no DOM, no side effects.
 * Centralizes valid transitions so the controller can't accidentally
 * skip a guard.
 *
 * @module state
 */

/** @typedef {'idle' | 'entering' | 'operator_set' | 'error'} CalcState */

export const STATE = Object.freeze(
    /** @type {Record<string, CalcState>} */ ({
        IDLE:         'idle',
        ENTERING:     'entering',
        OPERATOR_SET: 'operator_set',
        ERROR:        'error',
    })
);

/** @type {Readonly<Record<CalcState, CalcState[]>>} */
export const TRANSITIONS = Object.freeze({
    idle:         ['entering', 'operator_set', 'error'],
    entering:     ['operator_set', 'idle', 'error'],
    operator_set: ['entering', 'idle', 'error'],
    error:        ['idle'],
});

/**
 * @param {CalcState} from
 * @param {CalcState} to
 * @returns {boolean}
 */
export function canTransition(from, to) {
    if (from === to) return true;
    return TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Tiny event emitter for state changes. Used by controller.
 */
export class StateMachine extends EventTarget {
    /** @param {CalcState} [initial] */
    constructor(initial = STATE.IDLE) {
        super();
        /** @type {CalcState} */
        this.current = initial;
    }

    /**
     * @param {CalcState} next
     * @returns {boolean} whether the transition was accepted
     */
    transition(next) {
        if (!canTransition(this.current, next)) return false;
        if (this.current === next) return true;
        const prev = this.current;
        this.current = next;
        this.dispatchEvent(new CustomEvent('change', { detail: { from: prev, to: next } }));
        return true;
    }

    /**
     * Force-set the state without transition validation. Used by undo/redo
     * when restoring a previously-valid snapshot.
     * @param {CalcState} next
     */
    restore(next) {
        if (this.current === next) return;
        const prev = this.current;
        this.current = next;
        this.dispatchEvent(new CustomEvent('change', { detail: { from: prev, to: next, restored: true } }));
    }
}
