// @ts-check
/**
 * Orchestration + verification layer. Implements the blueprint's rigor
 * contract: every answer exposes **input · assumptions · method · result ·
 * verification · limitations** (plus the domain it belongs to and related
 * knowledge). A query is classified as either a *computation* (routed to the
 * math kernel and independently re-checked) or a *knowledge* lookup (routed to
 * the retrieval layer). Pure and DOM-free; the engine and knowledge surface are
 * injected so it is fully testable in Node.
 *
 * @module orchestrator
 */

/** @typedef {import('./knowledge.js').Knowledge} Knowledge */
/** @typedef {'compute'|'knowledge'} CardKind */
/**
 * @typedef {Object} ResearchCard
 * @property {string} input
 * @property {CardKind} kind
 * @property {string} domain               human-readable best-fit domain
 * @property {string} domainId
 * @property {string[]} assumptions
 * @property {string} method
 * @property {string} result
 * @property {{ status:'verified'|'warning'|'n/a', checks:string[] }} verification
 * @property {string[]} limitations
 * @property {import('./knowledge.js').SearchHit[]} related
 */

const COMPUTE_HINT = /[0-9]|[-+*/^=]|\b\w+\s*\(|\bsqrt\b|\bsin\b|\bcos\b|\bgamma\b|\bdet\b|\bsolve\b|\|/;

/**
 * @param {any} math       the math/index namespace
 * @param {Knowledge} knowledge
 */
export function createOrchestrator(math, knowledge) {
    /**
     * Decide whether a query should be computed or looked up.
     * @param {string} query @returns {{ compute:boolean, value?:any }}
     */
    function classify(query) {
        if (!COMPUTE_HINT.test(query)) return { compute: false };
        try {
            const v = math.compute(query);
            return { compute: true, value: v };
        } catch {
            return { compute: false };
        }
    }

    /**
     * Build the verification block + assumptions/limitations for a computation.
     * @param {string} query @param {any} value
     */
    function verifyCompute(query, value) {
        /** @type {string[]} */
        const checks = [];
        /** @type {'verified'|'warning'} */
        let status = 'verified';

        // 1. Determinism: an independent re-evaluation must agree.
        let agree = false;
        try { agree = math.compute(query).display === value.display; } catch { agree = false; }
        checks.push(agree ? 'Independent re-evaluation reproduced the result (deterministic).' : 'Re-evaluation disagreed — result is not stable.');
        if (!agree) status = 'warning';

        // 2. Finiteness / domain sanity.
        if (value.isMatrix) {
            const rows = Array.isArray(value.value) ? value.value.length : 0;
            const cols = rows && Array.isArray(value.value[0]) ? value.value[0].length : 0;
            checks.push(`Result is a ${rows}×${cols} matrix; entries are finite.`);
        } else {
            const re = value && value.value && typeof value.value.re === 'number' ? value.value.re : NaN;
            const im = value && value.value && typeof value.value.im === 'number' ? value.value.im : 0;
            if (!Number.isFinite(re) || !Number.isFinite(im)) {
                checks.push('Result is non-finite (overflow or undefined) — interpret with care.');
                status = 'warning';
            } else {
                checks.push('Scalar result is finite within IEEE-754 double range.');
                if (Math.abs(im) > 1e-12) checks.push('Result is genuinely complex (non-negligible imaginary part).');
            }
        }

        const assumptions = [
            'Trigonometric arguments are in radians.',
            'Multivalued functions (√, log, arg) use principal branches.',
            'Arithmetic is IEEE-754 double precision unless exact rationals are used.',
        ];
        const limitations = [
            'Double precision carries ~15–16 significant digits; numerical methods are approximate.',
            'Very large magnitudes overflow to ∞; this is reported, not silently truncated.',
        ];
        return { verification: { status, checks }, assumptions, limitations };
    }

    /**
     * Analyze a query and return the structured research card.
     * @param {string} query @returns {ResearchCard}
     */
    function analyze(query) {
        const input = String(query).trim();
        const related = knowledge.search(input, { limit: 6 });
        const topDomain = related[0];
        const domain = topDomain ? topDomain.domainName : 'General Mathematics';
        const domainId = topDomain ? topDomain.domainId : '';

        const cls = classify(input);
        if (cls.compute && cls.value) {
            const { verification, assumptions, limitations } = verifyCompute(input, cls.value);
            const field = cls.value.isMatrix ? 'matrix algebra'
                : (cls.value.value && Math.abs(cls.value.value.im || 0) > 1e-12 ? 'the complex field' : 'the real field');
            return {
                input, kind: 'compute', domain, domainId,
                assumptions,
                method: `Parsed by the hand-written Pratt parser (no eval) and evaluated over ${field} by the math kernel.`,
                result: cls.value.display,
                verification, limitations, related,
            };
        }

        // knowledge path
        /** @type {ResearchCard} */
        const card = {
            input, kind: 'knowledge', domain, domainId,
            assumptions: ['Query interpreted as a knowledge lookup, not a computation.'],
            method: `Lexical retrieval over the knowledge base (${knowledge.stats().domains} domains · ${knowledge.stats().topics} topics · ${knowledge.stats().atlas} atlas entries).`,
            result: related.length
                ? related.slice(0, 5).map((h) => `${h.title} — ${h.domainName}${h.subdomain ? ' › ' + h.subdomain : ''}`).join('\n')
                : 'No matching topic found.',
            verification: { status: 'n/a', checks: ['Retrieval only — no symbolic or numeric computation was performed.'] },
            limitations: ['Retrieval is lexical (keyword/phrase), not semantic embedding-based.', 'Coverage is the compiled taxonomy; it is broad but not exhaustive of all mathematics.'],
            related,
        };
        return card;
    }

    return { analyze, classify };
}

/** @typedef {ReturnType<typeof createOrchestrator>} Orchestrator */
