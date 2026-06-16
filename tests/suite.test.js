/**
 * @jest-environment jsdom
 *
 * Calculator Suite — registry shape + end-to-end "every operation runs"
 * regression. Mounts the real renderer against the real math engine and
 * exercises all 4 pages × 12 tiles × every dropdown option with default inputs,
 * asserting none throw (no `⚠`) and none produce an empty / NaN / ∞ result.
 * This is the in-CI equivalent of the manual preview probe.
 */
import * as math from '../math/index.js';
import {
    initSuite,
    suiteManifest,
    suiteOpCount,
    suiteTileCount,
    suitePageCount,
} from '../suite.js';

function mount() {
    document.body.innerHTML = `
        <div class="suite-tabs" role="group"></div>
        <div id="suite-grid"></div>
    `;
    const tabs = /** @type {HTMLElement} */ (document.querySelector('.suite-tabs'));
    const grid = /** @type {HTMLElement} */ (document.getElementById('suite-grid'));
    initSuite(math, tabs, grid);
    return { tabs, grid };
}

describe('Calculator Suite — registry shape', () => {
    test('declares 4 pages, 48 tiles, and ≥250 operations', () => {
        expect(suitePageCount()).toBe(4);
        expect(suiteTileCount()).toBe(48);
        expect(suiteOpCount()).toBeGreaterThanOrEqual(250);
    });

    test('manifest is consistent with the count helpers', () => {
        const man = suiteManifest();
        expect(man).toHaveLength(suitePageCount());
        const tiles = man.flatMap((p) => p.tiles);
        expect(tiles).toHaveLength(suiteTileCount());
        const ops = tiles.flatMap((t) => t.ops);
        expect(ops).toHaveLength(suiteOpCount());
        // every page carries exactly 12 tiles
        for (const p of man) expect(p.tiles).toHaveLength(12);
        // every tile has a non-empty title, blurb, and at least one op + input
        for (const t of tiles) {
            expect(t.title.length).toBeGreaterThan(0);
            expect(t.blurb.length).toBeGreaterThan(0);
            expect(t.ops.length).toBeGreaterThanOrEqual(1);
            expect(t.inputs.length).toBeGreaterThanOrEqual(1);
        }
    });
});

describe('Calculator Suite — renderer', () => {
    test('renders one tab per page and 12 tiles for the active page', () => {
        const { tabs, grid } = mount();
        expect(tabs.querySelectorAll('.suite-tab')).toHaveLength(4);
        expect(grid.querySelectorAll('.stile')).toHaveLength(12);
        // first tab is pressed by default
        expect(tabs.querySelector('.suite-tab')?.getAttribute('aria-pressed')).toBe('true');
    });

    test('switching tabs re-renders the grid and updates aria-pressed', () => {
        const { tabs, grid } = mount();
        const tabButtons = [...tabs.querySelectorAll('.suite-tab')];
        const firstTitle = grid.querySelector('.stile-title')?.textContent;
        tabButtons[3].dispatchEvent(new window.Event('click'));
        expect(tabButtons[3].getAttribute('aria-pressed')).toBe('true');
        expect(tabButtons[0].getAttribute('aria-pressed')).toBe('false');
        expect(grid.querySelectorAll('.stile')).toHaveLength(12);
        // page IV starts with a different tile than page I
        expect(grid.querySelector('.stile-title')?.textContent).not.toBe(firstTitle);
    });
});

describe('Calculator Suite — every operation runs on defaults', () => {
    test('no operation throws, errors, or yields NaN/∞ with default inputs', () => {
        const { tabs, grid } = mount();
        const tabButtons = [...tabs.querySelectorAll('.suite-tab')];
        /** @type {{page:number,tile:string|undefined,op:string,result:string}[]} */
        const failures = [];
        let executed = 0;

        tabButtons.forEach((tab, pageIndex) => {
            tab.dispatchEvent(new window.Event('click'));
            const tiles = [...grid.querySelectorAll('.stile')];
            for (const tile of tiles) {
                const title = tile.querySelector('.stile-title')?.textContent ?? undefined;
                const sel = /** @type {HTMLSelectElement|null} */ (tile.querySelector('.stile-op'));
                const btn = /** @type {HTMLButtonElement} */ (tile.querySelector('.stile-run'));
                const out = /** @type {HTMLElement} */ (tile.querySelector('.stile-result'));
                const nOps = sel ? sel.options.length : 1;
                for (let j = 0; j < nOps; j++) {
                    if (sel) sel.selectedIndex = j;
                    btn.dispatchEvent(new window.Event('click'));
                    executed += 1;
                    const text = out.textContent ?? '';
                    const opName = sel ? sel.options[j].text : '(only)';
                    if (
                        text.startsWith('⚠') ||
                        text.trim() === '=' ||
                        text.trim() === '' ||
                        /\bNaN\b/.test(text) ||
                        text.includes('undefined') ||
                        text.includes('Infinity')
                    ) {
                        failures.push({ page: pageIndex + 1, tile: title, op: opName, result: text.slice(0, 80) });
                    }
                }
            }
        });

        expect(executed).toBe(suiteOpCount());
        expect(failures).toEqual([]);
    });
});
