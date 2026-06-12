/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';
import { CircularBuffer, HistoryManager, emptySnapshot } from '../history.js';

describe('CircularBuffer', () => {
    test('rejects non-positive capacity', () => {
        expect(() => new CircularBuffer(0)).toThrow(RangeError);
        expect(() => new CircularBuffer(-1)).toThrow(RangeError);
    });

    test('push/pop LIFO', () => {
        const b = new CircularBuffer(5);
        b.push('a'); b.push('b'); b.push('c');
        expect(b.length).toBe(3);
        expect(b.pop()).toBe('c');
        expect(b.pop()).toBe('b');
        expect(b.pop()).toBe('a');
        expect(b.pop()).toBeNull();
    });

    test('overwrites oldest when full', () => {
        const b = new CircularBuffer(3);
        b.push(1); b.push(2); b.push(3); b.push(4); // 1 evicted
        expect(b.length).toBe(3);
        expect(b.toArray()).toEqual([2, 3, 4]);
    });

    test('peek does not remove', () => {
        const b = new CircularBuffer(3);
        b.push('x');
        expect(b.peek()).toBe('x');
        expect(b.length).toBe(1);
    });

    test('toArray returns oldest → newest', () => {
        const b = new CircularBuffer(5);
        for (const x of [1, 2, 3]) b.push(x);
        expect(b.toArray()).toEqual([1, 2, 3]);
    });

    test('clear empties everything', () => {
        const b = new CircularBuffer(5);
        b.push(1); b.push(2);
        b.clear();
        expect(b.length).toBe(0);
        expect(b.pop()).toBeNull();
    });
});

describe('HistoryManager', () => {
    test('undo returns previous snapshot', () => {
        const h = new HistoryManager(10);
        const s1 = { ...emptySnapshot(), current: '1' };
        const s2 = { ...emptySnapshot(), current: '2' };
        h.record(s1);
        const restored = h.undo(s2);
        expect(restored).toEqual(s1);
    });

    test('redo returns the formerly-current snapshot', () => {
        const h = new HistoryManager(10);
        const s1 = { ...emptySnapshot(), current: '1' };
        const s2 = { ...emptySnapshot(), current: '2' };
        h.record(s1);
        h.undo(s2);          // now redo stack has s2
        const next = h.redo({ ...emptySnapshot(), current: '1' });
        expect(next).toEqual(s2);
    });

    test('new record invalidates the redo stack', () => {
        const h = new HistoryManager(10);
        h.record({ ...emptySnapshot(), current: '1' });
        h.undo({ ...emptySnapshot(), current: '2' });
        expect(h.canRedo()).toBe(true);

        h.record({ ...emptySnapshot(), current: 'branch' });
        expect(h.canRedo()).toBe(false);
    });

    test('canUndo / canRedo reflect state', () => {
        const h = new HistoryManager(10);
        expect(h.canUndo()).toBe(false);
        expect(h.canRedo()).toBe(false);

        h.record(emptySnapshot());
        expect(h.canUndo()).toBe(true);

        h.undo(emptySnapshot());
        expect(h.canRedo()).toBe(true);
    });

    test('completed log keeps newest first, capped', () => {
        const h = new HistoryManager(3);
        for (let i = 0; i < 5; i++) {
            h.recordCompleted({ ...emptySnapshot(), current: String(i) });
        }
        expect(h.completed.length).toBe(3);
        expect(h.completed[0].current).toBe('4'); // newest first
        expect(h.completed[2].current).toBe('2');
    });

    test('change event fires on record', () => {
        const h = new HistoryManager(5);
        const spy = jest.fn();
        h.addEventListener('change', spy);
        h.record(emptySnapshot());
        expect(spy).toHaveBeenCalled();
    });
});
