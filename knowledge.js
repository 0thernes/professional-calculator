// @ts-check
/**
 * Knowledge / RAG layer. Wraps the compiled taxonomy + study atlas (see
 * `tools/build-knowledge.mjs`) in a pure, DOM-free, zero-dependency retrieval
 * surface: lexical search across domains, subdomains, topics, and atlas
 * entries, plus domain lookups and a Suite↔domain mapping. All ranking is
 * deterministic so it is testable in Node without a server.
 *
 * @module knowledge
 */

/** @typedef {{ id:string, name:string, tags:string }} TaxTopic */
/** @typedef {{ id:string, name:string, description:string, topics:TaxTopic[] }} TaxSub */
/** @typedef {{ id:string, name:string, tier:string, summary:string, capabilities:string[], subdomains:TaxSub[] }} TaxDomain */
/** @typedef {{ version:string, source:string, counts:{domains:number,subdomains:number,topics:number}, domains:TaxDomain[] }} Taxonomy */
/** @typedef {{ name:string, domainId:string, subdomain:string, level:string, kind:string }} AtlasEntry */
/** @typedef {{ version:string, count:number, entries:AtlasEntry[] }} Atlas */
/** @typedef {{ type:'domain'|'subdomain'|'topic'|'atlas', title:string, domainId:string, domainName:string, subdomain?:string, level?:string, kind?:string, score:number }} SearchHit */

const STOP = new Set(['the', 'a', 'an', 'of', 'and', 'or', 'for', 'to', 'in', 'on', 'is', 'are', 'with', 'by', 'as', 'at', 'how', 'what', 'do', 'i', 'me', 'my']);

/** @param {string} s @returns {string[]} */
function tokenize(s) {
    return String(s).toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !STOP.has(t));
}

/**
 * Suite tile id → knowledge domain id. Lets a domain page surface the live
 * calculators that operate in that domain.
 * @type {Record<string,string>}
 */
export const SUITE_DOMAIN_MAP = {
    arith: 'number-systems-arithmetic', powroot: 'number-systems-arithmetic', logexp: 'number-systems-arithmetic',
    percent: 'number-systems-arithmetic', rational: 'number-systems-arithmetic', bases: 'number-systems-arithmetic',
    everyday: 'number-systems-arithmetic',
    trig: 'geometry', invtrig: 'geometry', vector: 'geometry', coords: 'geometry', mensuration: 'geometry',
    complex: 'analysis-calculus', series: 'analysis-calculus', deriv: 'analysis-calculus', integ: 'analysis-calculus',
    specfn: 'analysis-calculus',
    quad: 'algebra', polyeval: 'algebra', matrix: 'algebra', eig: 'algebra', lsolve: 'algebra',
    simplify: 'symbolic-computation-automated-reasoning', units: 'engineering-signals-systems',
    roots: 'numerical-computational-math', interp: 'numerical-computational-math',
    opt: 'optimization-control-or',
    numtheory: 'number-theory',
    combo: 'discrete-combinatorics-graphs', graph: 'discrete-combinatorics-graphs', sets: 'foundations-logic-proof',
    descr: 'probability-statistics-inference', dist: 'probability-statistics-inference', discrete: 'probability-statistics-inference',
    htest: 'probability-statistics-inference', regress: 'probability-statistics-inference', comboProb: 'probability-statistics-inference',
    tvm: 'finance-economics-risk', cashflow: 'finance-economics-risk', bs: 'finance-economics-risk', rates: 'finance-economics-risk',
    kinematics: 'physics-cosmology-astronomy', relativity: 'physics-cosmology-astronomy', quantumph: 'physics-cosmology-astronomy',
    qcircuit: 'physics-cosmology-astronomy',
    fft: 'engineering-signals-systems', eecalc: 'engineering-signals-systems',
    ode: 'differential-equations-dynamics',
};

/**
 * Build a knowledge surface over injected data (pure — no fetch, no DOM).
 * @param {Taxonomy} taxonomy
 * @param {Atlas} atlas
 */
export function createKnowledge(taxonomy, atlas) {
    const domains = taxonomy.domains;
    /** @type {Map<string,TaxDomain>} */
    const byId = new Map(domains.map((d) => [d.id, d]));

    // Precompute a flat, tokenized search corpus once.
    /** @type {{ rec: SearchHit, tokens: Set<string>, text:string }[]} */
    const corpus = [];
    const add = (/** @type {SearchHit} */ rec, /** @type {string} */ text) => {
        corpus.push({ rec, tokens: new Set(tokenize(text)), text: text.toLowerCase() });
    };
    for (const d of domains) {
        add({ type: 'domain', title: d.name, domainId: d.id, domainName: d.name, score: 0 }, `${d.name} ${d.summary} ${d.capabilities.join(' ')}`);
        for (const s of d.subdomains) {
            add({ type: 'subdomain', title: s.name, domainId: d.id, domainName: d.name, subdomain: s.name, score: 0 }, `${s.name} ${d.name} ${s.description}`);
            for (const t of s.topics) {
                add({ type: 'topic', title: t.name, domainId: d.id, domainName: d.name, subdomain: s.name, score: 0 }, `${t.name} ${t.tags}`);
            }
        }
    }
    for (const e of atlas.entries) {
        const dn = byId.get(e.domainId);
        add({ type: 'atlas', title: e.name, domainId: e.domainId, domainName: dn ? dn.name : e.domainId, subdomain: e.subdomain, level: e.level, kind: e.kind, score: 0 },
            `${e.name} ${e.subdomain} ${e.level}`);
    }

    /** Weight by record type — more specific records rank a touch higher on ties. */
    const TYPE_W = { topic: 1.15, atlas: 1.1, subdomain: 1.0, domain: 0.95 };

    /**
     * Lexical search across the whole knowledge base.
     * @param {string} query
     * @param {{ limit?:number, type?:SearchHit['type'], domainId?:string }} [opts]
     * @returns {SearchHit[]}
     */
    function search(query, opts = {}) {
        const q = String(query).trim();
        if (!q) return [];
        const qTokens = tokenize(q);
        const qLower = q.toLowerCase();
        const limit = opts.limit ?? 12;
        /** @type {SearchHit[]} */
        const hits = [];
        for (const item of corpus) {
            if (opts.type && item.rec.type !== opts.type) continue;
            if (opts.domainId && item.rec.domainId !== opts.domainId) continue;
            let score = 0;
            for (const tok of qTokens) if (item.tokens.has(tok)) score += 2;
            // phrase / substring boost
            if (qTokens.length && item.text.includes(qLower)) score += 5;
            // title exact/substring boost
            const titleLower = item.rec.title.toLowerCase();
            if (titleLower === qLower) score += 8;
            else if (titleLower.includes(qLower)) score += 3;
            if (score <= 0) continue;
            score *= (TYPE_W[item.rec.type] || 1);
            hits.push({ ...item.rec, score: Math.round(score * 100) / 100 });
        }
        hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
        return hits.slice(0, limit);
    }

    return {
        /** @returns {TaxDomain[]} */
        domains: () => domains,
        /** @param {string} id @returns {TaxDomain|undefined} */
        domain: (id) => byId.get(id),
        /** @param {string} domainId @returns {AtlasEntry[]} */
        atlasFor: (domainId) => atlas.entries.filter((e) => e.domainId === domainId),
        /** @param {string} domainId @returns {string[]} suite tile ids mapped to this domain */
        suiteTilesFor: (domainId) => Object.keys(SUITE_DOMAIN_MAP).filter((k) => SUITE_DOMAIN_MAP[k] === domainId),
        search,
        stats: () => ({ ...taxonomy.counts, atlas: atlas.entries.length, corpus: corpus.length }),
    };
}

/** @typedef {ReturnType<typeof createKnowledge>} Knowledge */

/**
 * Browser loader: fetch the compiled JSON and build the knowledge surface.
 * @param {string} [base] path prefix (default '' = relative to the page)
 * @returns {Promise<Knowledge>}
 */
export async function loadKnowledge(base = '') {
    const [taxonomy, atlas] = await Promise.all([
        fetch(`${base}knowledge/taxonomy.json`).then((r) => r.json()),
        fetch(`${base}knowledge/atlas.json`).then((r) => r.json()),
    ]);
    return createKnowledge(taxonomy, atlas);
}
