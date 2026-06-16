/**
 * Knowledge / RAG layer — retrieval correctness over the compiled taxonomy +
 * atlas. Loads the committed JSON directly (no fetch) and exercises the pure
 * search/lookup surface.
 */
import { readFileSync } from 'node:fs';
import { createKnowledge, SUITE_DOMAIN_MAP } from '../knowledge.js';

const taxonomy = JSON.parse(readFileSync(new URL('../knowledge/taxonomy.json', import.meta.url), 'utf8'));
const atlas = JSON.parse(readFileSync(new URL('../knowledge/atlas.json', import.meta.url), 'utf8'));
const K = createKnowledge(taxonomy, atlas);

describe('knowledge — shape', () => {
    test('compiled counts match the blueprint taxonomy', () => {
        const s = K.stats();
        expect(s.domains).toBe(21);
        expect(s.subdomains).toBe(190);
        expect(s.topics).toBe(1094);
        expect(s.atlas).toBe(617);
        expect(s.corpus).toBe(21 + 190 + 1094 + 617);
    });

    test('domain lookups resolve', () => {
        expect(K.domains()).toHaveLength(21);
        const alg = K.domain('algebra');
        expect(alg).toBeDefined();
        expect(alg?.subdomains.length ?? 0).toBeGreaterThan(0);
        expect(K.domain('does-not-exist')).toBeUndefined();
    });

    test('atlas + suite mappings resolve per domain', () => {
        expect(K.atlasFor('algebra').length).toBeGreaterThan(0);
        const tiles = K.suiteTilesFor('algebra');
        expect(tiles).toEqual(expect.arrayContaining(['matrix', 'eig', 'lsolve', 'quad', 'polyeval']));
        // every mapped tile points at a real domain id
        const ids = new Set(K.domains().map((d) => d.id));
        for (const dom of Object.values(SUITE_DOMAIN_MAP)) expect(ids.has(dom)).toBe(true);
    });
});

describe('knowledge — search', () => {
    test('empty query returns nothing', () => {
        expect(K.search('')).toEqual([]);
        expect(K.search('   ')).toEqual([]);
    });

    test('finds a canonical topic and ranks it well', () => {
        const hits = K.search('galois theory');
        expect(hits.length).toBeGreaterThan(0);
        expect(hits.some((h) => /galois/i.test(h.title))).toBe(true);
        // scores are sorted descending
        for (let i = 1; i < hits.length; i++) expect(hits[i - 1].score).toBeGreaterThanOrEqual(hits[i].score);
    });

    test('eigenvalue query lands in the algebra domain', () => {
        const hits = K.search('eigenvalues');
        expect(hits.length).toBeGreaterThan(0);
        expect(hits.some((h) => h.domainId === 'algebra')).toBe(true);
    });

    test('type and domain filters narrow results', () => {
        const onlyAtlas = K.search('analysis', { type: 'atlas', limit: 20 });
        expect(onlyAtlas.length).toBeGreaterThan(0);
        expect(onlyAtlas.every((h) => h.type === 'atlas')).toBe(true);

        const onlyTopo = K.search('manifold', { domainId: 'topology', limit: 20 });
        expect(onlyTopo.every((h) => h.domainId === 'topology')).toBe(true);
    });

    test('limit is respected', () => {
        expect(K.search('theory', { limit: 3 }).length).toBeLessThanOrEqual(3);
    });
});
