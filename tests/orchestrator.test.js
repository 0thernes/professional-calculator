/**
 * Orchestration + verification layer — the blueprint rigor contract. Routes
 * queries to the real math kernel or the retrieval layer and asserts the
 * input/assumptions/method/result/verification/limitations card is well-formed.
 */
import { readFileSync } from 'node:fs';
import * as math from '../math/index.js';
import { createKnowledge } from '../knowledge.js';
import { createOrchestrator } from '../orchestrator.js';

const taxonomy = JSON.parse(readFileSync(new URL('../knowledge/taxonomy.json', import.meta.url), 'utf8'));
const atlas = JSON.parse(readFileSync(new URL('../knowledge/atlas.json', import.meta.url), 'utf8'));
const orch = createOrchestrator(math, createKnowledge(taxonomy, atlas));

/** @param {any} c */
const wellFormed = (c) => {
    expect(typeof c.input).toBe('string');
    expect(['compute', 'knowledge']).toContain(c.kind);
    expect(Array.isArray(c.assumptions)).toBe(true);
    expect(typeof c.method).toBe('string');
    expect(typeof c.result).toBe('string');
    expect(c.verification && Array.isArray(c.verification.checks)).toBe(true);
    expect(Array.isArray(c.limitations)).toBe(true);
    expect(Array.isArray(c.related)).toBe(true);
};

describe('orchestrator — computation path', () => {
    test('arithmetic is computed and verified', () => {
        const c = orch.analyze('2+3*4');
        wellFormed(c);
        expect(c.kind).toBe('compute');
        expect(c.result).toBe('14');
        expect(c.verification.status).toBe('verified');
        expect(c.verification.checks.join(' ')).toMatch(/re-evaluation/i);
    });

    test('matrix determinant is computed over matrix/real field', () => {
        const c = orch.analyze('det([[2,1],[1,3]])');
        expect(c.kind).toBe('compute');
        expect(c.result).toBe('5');
    });

    test('complex result is flagged in verification', () => {
        const c = orch.analyze('sqrt(-1)');
        expect(c.kind).toBe('compute');
        expect(c.result.toLowerCase()).toContain('i');
        expect(c.verification.checks.join(' ')).toMatch(/complex/i);
    });

    test('overflow is reported as a warning, not a silent number', () => {
        const c = orch.analyze('10^1000');
        expect(c.kind).toBe('compute');
        expect(c.verification.status).toBe('warning');
    });
});

describe('orchestrator — knowledge path', () => {
    test('a field name routes to retrieval, not computation', () => {
        const c = orch.analyze('algebraic topology');
        wellFormed(c);
        expect(c.kind).toBe('knowledge');
        expect(c.verification.status).toBe('n/a');
        expect(c.related.length).toBeGreaterThan(0);
    });

    test('classify distinguishes computable from prose', () => {
        expect(orch.classify('5! + 2^10').compute).toBe(true);
        expect(orch.classify('what is set theory').compute).toBe(false);
    });
});
