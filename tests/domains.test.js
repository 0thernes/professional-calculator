/**
 * @jest-environment jsdom
 *
 * Knowledge Explorer UI — mounts the real renderer against the real knowledge
 * base, orchestrator, and Suite registry, then drives the domain navigation and
 * the orchestrator query box exactly as a user would.
 */
import { readFileSync } from 'node:fs';
import * as math from '../math/index.js';
import { createKnowledge } from '../knowledge.js';
import { createOrchestrator } from '../orchestrator.js';
import { suiteManifest } from '../suite.js';
import { initDomains } from '../domains.js';

const taxonomy = JSON.parse(readFileSync(new URL('../knowledge/taxonomy.json', import.meta.url), 'utf8'));
const atlas = JSON.parse(readFileSync(new URL('../knowledge/atlas.json', import.meta.url), 'utf8'));

// jsdom does not implement scrollIntoView; stub it so click handlers don't throw.
beforeAll(() => { Element.prototype.scrollIntoView = function () {}; });

function mount() {
    document.body.innerHTML = `
        <input id="ko-input" type="text" />
        <button id="ko-run" type="button">Analyze</button>
        <div id="ko-card"></div>
        <nav id="ko-domains"></nav>
        <div id="ko-detail"></div>
        <span id="ko-stat"></span>
        <div class="suite-tabs"><button class="suite-tab"></button><button class="suite-tab"></button><button class="suite-tab"></button><button class="suite-tab"></button></div>
    `;
    const $ = (/** @type {string} */ id) => /** @type {any} */ (document.getElementById(id));
    initDomains({
        knowledge: createKnowledge(taxonomy, atlas),
        orchestrator: createOrchestrator(math, createKnowledge(taxonomy, atlas)),
        suiteManifest,
        input: $('ko-input'), runBtn: $('ko-run'), cardHost: $('ko-card'),
        domainsHost: $('ko-domains'), detailHost: $('ko-detail'), statHost: $('ko-stat'),
    });
    return { $, card: $('ko-card'), detail: $('ko-detail'), domains: $('ko-domains'), input: $('ko-input'), run: $('ko-run') };
}

describe('Knowledge Explorer — domain navigation', () => {
    test('renders 21 domain tiles and auto-opens the first', () => {
        const m = mount();
        expect(m.domains.querySelectorAll('.ko-domtile')).toHaveLength(21);
        expect(m.domains.querySelector('.ko-domtile').getAttribute('aria-pressed')).toBe('true');
        expect(m.detail.querySelector('.ko-detail-title')).not.toBeNull();
        expect(document.getElementById('ko-stat')?.textContent).toMatch(/21 domains/);
    });

    test('selecting a domain renders its subdomains, study path, and mapped calculators', () => {
        const m = mount();
        const tiles = [...m.domains.querySelectorAll('.ko-domtile')];
        const algebra = tiles.find((t) => /^Algebra/.test(t.querySelector('.ko-domtile-name').textContent));
        algebra.dispatchEvent(new window.Event('click'));
        expect(algebra.getAttribute('aria-pressed')).toBe('true');
        expect(m.detail.querySelector('.ko-detail-title').textContent).toMatch(/^Algebra/);
        expect(m.detail.querySelectorAll('.ko-sub').length).toBeGreaterThan(0);
        expect(m.detail.querySelectorAll('.ko-level').length).toBeGreaterThan(0);
        // algebra maps to matrix/eig/lsolve/quad/polyeval Suite calculators
        expect(m.detail.querySelectorAll('.ko-chip-calc').length).toBeGreaterThanOrEqual(5);
        expect(m.detail.querySelector('.ko-open')).not.toBeNull();
    });
});

describe('Knowledge Explorer — orchestrator query box', () => {
    test('a computation renders a verified research card', () => {
        const m = mount();
        m.input.value = 'det([[2,1],[1,3]])';
        m.run.dispatchEvent(new window.Event('click'));
        expect(m.card.querySelector('.ko-kind').textContent).toBe('COMPUTATION');
        expect(m.card.querySelector('.ko-result').textContent).toBe('5');
        expect(m.card.querySelector('.ko-vstatus-verified')).not.toBeNull();
    });

    test('a field name renders a knowledge card with related chips', () => {
        const m = mount();
        m.input.value = 'galois theory';
        m.run.dispatchEvent(new window.Event('click'));
        expect(m.card.querySelector('.ko-kind').textContent).toBe('KNOWLEDGE');
        expect(m.card.querySelectorAll('.ko-chip-rel').length).toBeGreaterThan(0);
    });

    test('empty query does not render a card', () => {
        const m = mount();
        m.input.value = '   ';
        m.run.dispatchEvent(new window.Event('click'));
        expect(m.card.children.length).toBe(0);
    });
});
