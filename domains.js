// @ts-check
/**
 * Knowledge Explorer UI — the "each domain has its own page" surface plus the
 * orchestrator query box. Renders 21 domain pages (summary, capabilities,
 * subdomains, leveled study path from the atlas, and the live Suite calculators
 * that operate in the domain) and a research-card view of the orchestrator's
 * rigor contract. All DOM is built with createElement/textContent (no innerHTML,
 * no injection surface); results are announced via aria-live.
 *
 * @module domains
 */

/** @typedef {import('./knowledge.js').Knowledge} Knowledge */
/** @typedef {import('./orchestrator.js').Orchestrator} Orchestrator */

/** @param {string} tag @param {string} [cls] @param {string} [text] */
function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
}

const LEVELS = ['UG', 'UG/Grad', 'Grad', 'PhD'];

/**
 * @param {Object} o
 * @param {Knowledge} o.knowledge
 * @param {Orchestrator} o.orchestrator
 * @param {() => {page:string, tiles:{id:string,title:string}[]}[]} o.suiteManifest
 * @param {HTMLInputElement} o.input
 * @param {HTMLButtonElement} o.runBtn
 * @param {HTMLElement} o.cardHost
 * @param {HTMLElement} o.domainsHost
 * @param {HTMLElement} o.detailHost
 * @param {HTMLElement} [o.statHost]
 */
export function initDomains(o) {
    const { knowledge, orchestrator, suiteManifest, input, runBtn, cardHost, domainsHost, detailHost, statHost } = o;
    if (!knowledge || !orchestrator || !input || !runBtn || !cardHost || !domainsHost || !detailHost) return;

    // Build a tile → {page index, page name, title} index from the live Suite registry.
    /** @type {Record<string,{page:number,pageName:string,title:string}>} */
    const tileIndex = {};
    suiteManifest().forEach((pg, i) => { for (const t of pg.tiles) tileIndex[t.id] = { page: i, pageName: pg.page, title: t.title }; });

    if (statHost) {
        const s = knowledge.stats();
        statHost.textContent = `${s.domains} domains · ${s.subdomains} subdomains · ${s.topics} topics · ${s.atlas} atlas`;
    }

    /* ----------------------------- domain grid ---------------------------- */
    const domains = knowledge.domains();
    domainsHost.replaceChildren();
    /** @type {HTMLButtonElement|null} */
    let activeBtn = null;
    domains.forEach((d) => {
        const btn = /** @type {HTMLButtonElement} */ (el('button', 'ko-domtile'));
        btn.type = 'button';
        btn.setAttribute('aria-pressed', 'false');
        const title = el('span', 'ko-domtile-name', d.name);
        const meta = el('span', 'ko-domtile-meta', `${d.subdomains.length} subdomains · ${knowledge.atlasFor(d.id).length} courses`);
        const tier = el('span', 'ko-tier', d.tier);
        btn.append(tier, title, meta);
        btn.addEventListener('click', () => {
            if (activeBtn) activeBtn.setAttribute('aria-pressed', 'false');
            btn.setAttribute('aria-pressed', 'true');
            activeBtn = btn;
            renderDomain(d.id);
        });
        domainsHost.appendChild(btn);
    });

    /* --------------------------- domain detail ---------------------------- */
    /** @param {string} domainId */
    function renderDomain(domainId) {
        const d = knowledge.domain(domainId);
        if (!d) return;
        detailHost.replaceChildren();

        detailHost.append(el('h3', 'ko-detail-title', d.name));
        detailHost.append(el('p', 'ko-detail-summary', d.summary));

        // calculator capabilities
        if (d.capabilities.length) {
            detailHost.append(el('h4', 'ko-h4', 'What the calculator can do here'));
            const caps = el('div', 'ko-chips');
            for (const c of d.capabilities) caps.append(el('span', 'ko-chip', c));
            detailHost.append(caps);
        }

        // Suite calculators mapped to this domain
        const tiles = knowledge.suiteTilesFor(domainId).map((id) => tileIndex[id]).filter(Boolean);
        if (tiles.length) {
            detailHost.append(el('h4', 'ko-h4', 'Live calculators in this domain'));
            const wrap = el('div', 'ko-chips');
            // group by page for a single "open" affordance per page
            const pages = [...new Set(tiles.map((t) => t.page))];
            for (const t of tiles) wrap.append(el('span', 'ko-chip ko-chip-calc', t.title));
            detailHost.append(wrap);
            for (const p of pages) {
                const open = /** @type {HTMLButtonElement} */ (el('button', 'ko-open', `↳ Open Suite — ${suiteManifest()[p].page}`));
                open.type = 'button';
                open.addEventListener('click', () => {
                    const tabs = document.querySelectorAll('.suite-tab');
                    const tab = /** @type {HTMLElement} */ (tabs[p]);
                    if (tab) { tab.click(); tab.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                });
                detailHost.append(open);
            }
        }

        // Study path — atlas entries grouped by level
        const atlas = knowledge.atlasFor(domainId);
        if (atlas.length) {
            detailHost.append(el('h4', 'ko-h4', `Study path · ${atlas.length} courses & topics (undergrad → PhD)`));
            for (const lv of LEVELS) {
                const items = atlas.filter((a) => a.level === lv);
                if (!items.length) continue;
                const row = el('div', 'ko-level');
                row.append(el('span', 'ko-level-tag', lv));
                const list = el('span', 'ko-level-items', items.map((a) => a.name).join(' · '));
                row.append(list);
                detailHost.append(row);
            }
        }

        // Subdomains + topic chips
        detailHost.append(el('h4', 'ko-h4', `Subdomains · ${d.subdomains.length}`));
        for (const s of d.subdomains) {
            const block = el('div', 'ko-sub');
            block.append(el('span', 'ko-sub-name', s.name));
            if (s.description) block.append(el('span', 'ko-sub-desc', s.description));
            const chips = el('div', 'ko-chips');
            for (const t of s.topics) chips.append(el('span', 'ko-chip ko-chip-topic', t.name));
            block.append(chips);
            detailHost.append(block);
        }
    }

    /* ----------------------------- research card -------------------------- */
    /** @param {import('./orchestrator.js').ResearchCard} card */
    function renderCard(card) {
        cardHost.replaceChildren();
        const head = el('div', 'ko-card-head');
        head.append(el('span', `ko-kind ko-kind-${card.kind}`, card.kind === 'compute' ? 'COMPUTATION' : 'KNOWLEDGE'));
        head.append(el('span', 'ko-card-input', card.input));
        head.append(el('span', 'ko-card-domain', card.domain));
        cardHost.append(head);

        const result = el('div', 'ko-block');
        result.append(el('span', 'ko-label', 'Result'));
        result.append(el('pre', 'ko-result', card.result));
        cardHost.append(result);

        const v = el('div', 'ko-block');
        const vlabel = el('span', `ko-label ko-vstatus-${card.verification.status}`, `Verification · ${card.verification.status}`);
        v.append(vlabel);
        const vlist = el('ul', 'ko-list');
        for (const c of card.verification.checks) vlist.append(el('li', undefined, c));
        v.append(vlist);
        cardHost.append(v);

        const blocks = [
            ['Method', [card.method]],
            ['Assumptions', card.assumptions],
            ['Limitations', card.limitations],
        ];
        for (const [label, items] of blocks) {
            const b = el('div', 'ko-block');
            b.append(el('span', 'ko-label', /** @type {string} */(label)));
            const ul = el('ul', 'ko-list');
            for (const it of /** @type {string[]} */(items)) ul.append(el('li', undefined, it));
            b.append(ul);
            cardHost.append(b);
        }

        if (card.related.length) {
            const r = el('div', 'ko-block');
            r.append(el('span', 'ko-label', 'Related'));
            const chips = el('div', 'ko-chips');
            for (const h of card.related) {
                const chip = /** @type {HTMLButtonElement} */ (el('button', 'ko-chip ko-chip-rel', `${h.title} · ${h.domainName}`));
                chip.type = 'button';
                chip.addEventListener('click', () => {
                    const tile = [...domainsHost.children].find((c) => c.querySelector('.ko-domtile-name')?.textContent === h.domainName);
                    if (tile instanceof HTMLElement) tile.click();
                    detailHost.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                });
                chips.append(chip);
            }
            r.append(chips);
            cardHost.append(r);
        }
    }

    const run = () => {
        const q = input.value.trim();
        if (!q) return;
        try {
            renderCard(orchestrator.analyze(q));
        } catch (e) {
            cardHost.replaceChildren(el('div', 'ko-err', '⚠ ' + (e instanceof Error ? e.message : String(e))));
        }
    };
    runBtn.addEventListener('click', run);
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') run(); });

    // Open on the first domain so the page is never empty.
    const first = /** @type {HTMLButtonElement|null} */ (domainsHost.querySelector('.ko-domtile'));
    if (first) first.click();
}
