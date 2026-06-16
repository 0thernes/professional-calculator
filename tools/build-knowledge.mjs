// @ts-nocheck
/**
 * Knowledge compiler (build-time, run once; output is committed so the app stays
 * zero-dependency and build-step-free at runtime).
 *
 * Reads the governing blueprint XML taxonomy + the Mathematics Study Atlas and
 * emits two queryable JSON knowledge bases consumed by `knowledge.js`:
 *   knowledge/taxonomy.json  — 21 domains → 190 subdomains → 1094 topics
 *   knowledge/atlas.json     — 542 leveled courses/topics
 *
 * Usage:  node tools/build-knowledge.mjs [path-to-blueprint.xml]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const XML = process.argv[2] || 'Z:/super_math_calculator_rag_blueprint.xml';
const ATLAS = 'docs/MATH_STUDY_ATLAS.md';
const OUT = 'knowledge';

const attr = (tag, a) => { const m = tag.match(new RegExp(a + '="([^"]*)"')); return m ? m[1] : ''; };
const unescape = (s) => String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

/* ----------------------------- taxonomy.json ----------------------------- */
function buildTaxonomy(xml) {
    const domains = [];
    // Split the file into <domain ...> ... </domain> blocks.
    const domainRe = /<domain\b([^>]*)>([\s\S]*?)<\/domain>/g;
    let dm;
    while ((dm = domainRe.exec(xml))) {
        const head = '<domain ' + dm[1] + '>';
        const body = dm[2];
        const id = attr(head, 'id');
        const name = attr(head, 'name');
        const tier = attr(head, 'tier');
        const summary = unescape(attr(head, 'summary'));
        const capabilities = [...body.matchAll(/<capability>([\s\S]*?)<\/capability>/g)].map((m) => unescape(m[1]));

        const subdomains = [];
        const subRe = /<subdomain\b([^>]*)>([\s\S]*?)<\/subdomain>/g;
        let sm;
        while ((sm = subRe.exec(body))) {
            const shead = '<subdomain ' + sm[1] + '>';
            const sbody = sm[2];
            const sid = attr(shead, 'id');
            const sname = attr(shead, 'name');
            // description is the text before <topics>
            const descRaw = sbody.split('<topics>')[0] || '';
            const description = unescape(descRaw);
            const topics = [...sbody.matchAll(/<topic\b([^>]*)>([\s\S]*?)<\/topic>/g)].map((tm) => {
                const thead = '<topic ' + tm[1] + '>';
                return { id: attr(thead, 'id'), name: attr(thead, 'name'), tags: attr(thead, 'tags') };
            });
            subdomains.push({ id: sid, name: sname, description, topics });
        }
        domains.push({ id, name, tier, summary, capabilities, subdomains });
    }
    return domains;
}

/* ------------------------------- atlas.json ------------------------------ */
const DOMAIN_BY_NAME = {
    'Foundations, Logic, and Proof Systems': 'foundations-logic-proof',
    'Number Systems and Arithmetic Substrates': 'number-systems-arithmetic',
    'Number Theory and Arithmetic Geometry': 'number-theory',
    'Algebra: Structures, Symmetries, and Representations': 'algebra',
    'Geometry: Shape, Space, Curvature, and Measurement': 'geometry',
    'Topology: Continuity, Holes, Manifolds, and Invariants': 'topology',
    'Analysis, Calculus, and Function Spaces': 'analysis-calculus',
    'Differential Equations, Dynamical Systems, and Chaos': 'differential-equations-dynamics',
    'Probability, Statistics, and Inference': 'probability-statistics-inference',
    'Optimization, Control, Operations Research, and Game Theory': 'optimization-control-or',
    'Discrete Mathematics, Combinatorics, and Graph Theory': 'discrete-combinatorics-graphs',
    'Numerical and Computational Mathematics': 'numerical-computational-math',
    'Symbolic Computation and Automated Reasoning': 'symbolic-computation-automated-reasoning',
    'Mathematical Physics, Cosmology, and Astronomy': 'physics-cosmology-astronomy',
    'Engineering Mathematics, Signals, Systems, and Control': 'engineering-signals-systems',
    'Quantitative Finance, Economics, and Risk Engineering': 'finance-economics-risk',
    'Cryptography, Security Mathematics, and Coding Theory': 'cryptography-security-coding',
    'AI, Machine Learning, Data Science, and Learning Theory': 'ai-ml-data-science',
    'Computer Science, Algorithms, and Complexity': 'computer-science-algorithms',
    'Applied Sciences, Biology, Networks, and Social Systems': 'applied-sciences-bio-social',
    'Meta-Mathematics, Modeling, Pedagogy, and Knowledge Systems': 'meta-math-knowledge-systems',
};

function buildAtlas(md) {
    const lines = md.split(/\r?\n/);
    const entries = [];
    let domainId = null, subdomain = null;
    for (const line of lines) {
        const dh = line.match(/^## [IVXLC]+ · (.+)$/);
        if (dh) { domainId = DOMAIN_BY_NAME[dh[1].trim()] || null; subdomain = null; continue; }
        const sh = line.match(/^### (.+)$/);
        if (sh) { subdomain = sh[1].trim(); continue; }
        const item = line.match(/^- \*\*(.+?)\*\* — `([^`]+)` · (\w+)$/);
        if (item && domainId && subdomain) {
            entries.push({ name: item[1].trim(), domainId, subdomain, level: item[2], kind: item[3] });
        }
    }
    return entries;
}

/* --------------------------------- main ---------------------------------- */
const xml = readFileSync(XML, 'utf8');
const md = readFileSync(ATLAS, 'utf8');

const domains = buildTaxonomy(xml);
const atlas = buildAtlas(md);

const subCount = domains.reduce((n, d) => n + d.subdomains.length, 0);
const topicCount = domains.reduce((n, d) => n + d.subdomains.reduce((m, s) => m + s.topics.length, 0), 0);

mkdirSync(OUT, { recursive: true });
const taxonomy = {
    version: '1.0.0',
    source: 'super_math_calculator_rag_blueprint.xml',
    counts: { domains: domains.length, subdomains: subCount, topics: topicCount },
    domains,
};
writeFileSync(resolve(OUT, 'taxonomy.json'), JSON.stringify(taxonomy));
writeFileSync(resolve(OUT, 'atlas.json'), JSON.stringify({ version: '1.0.0', count: atlas.length, entries: atlas }));

console.log(`taxonomy.json: ${domains.length} domains, ${subCount} subdomains, ${topicCount} topics`);
console.log(`atlas.json: ${atlas.length} entries`);
const perDom = {};
for (const e of atlas) perDom[e.domainId] = (perDom[e.domainId] || 0) + 1;
const missing = domains.filter((d) => !perDom[d.id]).map((d) => d.id);
console.log('atlas domains with 0 entries:', missing.length ? missing.join(', ') : '(none)');
