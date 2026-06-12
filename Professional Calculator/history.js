// @ts-check
/**
 * Calculation history with undo/redo.
 *
 * - CircularBuffer for O(1) push/pop with bounded memory (P1 fix).
 * - Redo stack invalidated on any new push (standard undo/redo semantics).
 * - Snapshots include full state so undo restores everything.
 *
 * @module history
 */

import { STATE } from './state.js';

/**
 * @typedef {object} Snapshot
 * @property {string} current
 * @property {string} previous
 * @property {(import('./engine.js').Operator | null)} operator
 * @property {import('./state.js').CalcState} state
 * @property {boolean} shouldResetDisplay
 * @property {string} [label]    Optional display label (e.g. "5 + 3 = 8")
 * @property {number} timestamp
 */

/**
 * @template T
 */
export class CircularBuffer {
    /** @param {number} capacity */
    constructor(capacity) {
        if (capacity <= 0) throw new RangeError('capacity must be > 0');
        this.capacity = capacity;
        /** @type {(T | undefined)[]} */
        this.buffer = new Array(capacity);
        this.head = 0;
        this.length = 0;
    }

    /** @param {T} item */
    push(item) {
        this.buffer[this.head] = item;
        this.head = (this.head + 1) % this.capacity;
        if (this.length < this.capacity) this.length++;
    }

    /** @returns {T | null} */
    pop() {
        if (this.length === 0) return null;
        this.head = (this.head - 1 + this.capacity) % this.capacity;
        const item = this.buffer[this.head];
        this.buffer[this.head] = undefined;
        this.length--;
        return item ?? null;
    }

    /** @returns {T | null} */
    peek() {
        if (this.length === 0) return null;
        const idx = (this.head - 1 + this.capacity) % this.capacity;
        return this.buffer[idx] ?? null;
    }

    /** Iterate from oldest to newest. @returns {T[]} */
    toArray() {
        /** @type {T[]} */
        const out = [];
        if (this.length === 0) return out;
        const start = (this.head - this.length + this.capacity) % this.capacity;
        for (let i = 0; i < this.length; i++) {
            const idx = (start + i) % this.capacity;
            const item = this.buffer[idx];
            if (item !== undefined) out.push(item);
        }
        return out;
    }

    clear() {
        this.buffer = new Array(this.capacity);
        this.head = 0;
        this.length = 0;
    }
}

export class HistoryManager extends EventTarget {
    /** @param {number} [capacity] */
    constructor(capacity = 50) {
        super();
        /** @type {CircularBuffer<Snapshot>} */
        this.undoStack = new CircularBuffer(capacity);
        /** @type {Snapshot[]} */
        this.redoStack = [];
        /** @type {Snapshot[]} */
        this.completed = []; // Completed calculations for the sidebar
        this.maxCompleted = capacity;
    }

    /**
     * Record a snapshot for undo. Invalidates the redo stack
     * (standard undo/redo semantics: branching kills the future).
     * @param {Snapshot} snapshot
     */
    record(snapshot) {
        this.undoStack.push(snapshot);
        if (this.redoStack.length > 0) {
            this.redoStack = [];
        }
        this.dispatchEvent(new CustomEvent('change'));
    }

    /**
     * Pop a snapshot. The provided `currentSnapshot` is pushed to redo
     * so a subsequent redo can return here.
     * @param {Snapshot} currentSnapshot
     * @returns {Snapshot | null}
     */
    undo(currentSnapshot) {
        const previous = this.undoStack.pop();
        if (!previous) return null;
        this.redoStack.push(currentSnapshot);
        this.dispatchEvent(new CustomEvent('change'));
        return previous;
    }

    /**
     * @param {Snapshot} currentSnapshot
     * @returns {Snapshot | null}
     */
    redo(currentSnapshot) {
        const next = this.redoStack.pop();
        if (!next) return null;
        this.undoStack.push(currentSnapshot);
        this.dispatchEvent(new CustomEvent('change'));
        return next ?? null;
    }

    /**
     * Record a completed calculation (for the sidebar). Distinct
     * from undo because it's a user-visible log, not a step-back stack.
     * @param {Snapshot} snapshot
     */
    recordCompleted(snapshot) {
        this.completed.unshift(snapshot);
        if (this.completed.length > this.maxCompleted) {
            this.completed.length = this.maxCompleted;
        }
        this.dispatchEvent(new CustomEvent('completedChange'));
    }

    canUndo() { return this.undoStack.length > 0; }
    canRedo() { return this.redoStack.length > 0; }

    clear() {
        this.undoStack.clear();
        this.redoStack = [];
        this.completed = [];
        this.dispatchEvent(new CustomEvent('change'));
        this.dispatchEvent(new CustomEvent('completedChange'));
    }
}

/**
 * Build an initial snapshot for testing or bootstrap.
 * @returns {Snapshot}
 */
export function emptySnapshot() {
    return {
        current: '0',
        previous: '',
        operator: null,
        state: STATE.IDLE,
        shouldResetDisplay: false,
        timestamp: Date.now(),
    };
}
