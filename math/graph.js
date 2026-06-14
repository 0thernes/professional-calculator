// @ts-check
/**
 * Graph algorithms on vertices labelled `0 … n−1`.
 *
 * Traversal (BFS/DFS), single-source shortest paths (Dijkstra, non-negative
 * weights) with path reconstruction, connected components and minimum spanning
 * tree (both via union–find), and topological sort (Kahn's algorithm).
 *
 * Two input shapes are used, both plain arrays:
 * - **Unweighted adjacency list** `number[][]` — `adj[u]` lists `u`'s neighbours
 *   (out-neighbours for a directed graph). Used by {@link bfs}/{@link dfs}.
 * - **Weighted adjacency list** `Array<Array<{to,w}>>` — used by
 *   {@link dijkstra}/{@link shortestPath}.
 * - **Edge lists** — `[u,v]` pairs for {@link connectedComponents}/
 *   {@link topologicalSort}; `{u,v,w}` records for {@link mst}.
 *
 * Implementations favour clarity at interactive scale (Dijkstra uses an O(V²)
 * array scan, fine for the hundreds-of-vertices envelope). Nothing mutates its
 * inputs.
 *
 * @module math/graph
 */

/** @typedef {number[][]} AdjList */
/** @typedef {Array<Array<{ to: number, w: number }>>} WeightedAdj */
/** @typedef {{ u: number, v: number, w: number }} WEdge */

/* ------------------------------------------------------------------ *
 *  Union–find (disjoint set)
 * ------------------------------------------------------------------ */

/**
 * @param {number} n
 * @returns {{ find: (x: number) => number, union: (a: number, b: number) => boolean }}
 */
function makeDSU(n) {
    const parent = Array.from({ length: n }, (_, i) => i);
    /** @param {number} x */
    const find = (x) => {
        let r = x;
        while (parent[r] !== r) {
            parent[r] = parent[parent[r]]; // path halving
            r = parent[r];
        }
        return r;
    };
    /** @param {number} a @param {number} b */
    const union = (a, b) => {
        const ra = find(a);
        const rb = find(b);
        if (ra === rb) return false;
        parent[ra] = rb;
        return true;
    };
    return { find, union };
}

/* ------------------------------------------------------------------ *
 *  Traversal
 * ------------------------------------------------------------------ */

/**
 * Breadth-first search from `start`. Returns the visitation `order`, hop
 * `dist`ances (Infinity if unreachable), and the BFS-tree `parent` (−1 at the
 * root / for unreached vertices).
 * @param {AdjList} adj
 * @param {number} start
 * @returns {{ order: number[], dist: number[], parent: number[] }}
 */
export function bfs(adj, start) {
    const n = adj.length;
    const dist = new Array(n).fill(Infinity);
    const parent = new Array(n).fill(-1);
    /** @type {number[]} */
    const order = [];
    const queue = [start];
    dist[start] = 0;
    let head = 0;
    while (head < queue.length) {
        const u = queue[head];
        head += 1;
        order.push(u);
        for (const v of adj[u]) {
            if (dist[v] === Infinity) {
                dist[v] = dist[u] + 1;
                parent[v] = u;
                queue.push(v);
            }
        }
    }
    return { order, dist, parent };
}

/**
 * Depth-first search (recursive pre-order) from `start`.
 * @param {AdjList} adj
 * @param {number} start
 * @returns {{ order: number[], parent: number[] }}
 */
export function dfs(adj, start) {
    const n = adj.length;
    const visited = new Array(n).fill(false);
    const parent = new Array(n).fill(-1);
    /** @type {number[]} */
    const order = [];
    /** @param {number} u */
    const visit = (u) => {
        visited[u] = true;
        order.push(u);
        for (const v of adj[u]) {
            if (!visited[v]) {
                parent[v] = u;
                visit(v);
            }
        }
    };
    visit(start);
    return { order, parent };
}

/* ------------------------------------------------------------------ *
 *  Shortest paths (Dijkstra)
 * ------------------------------------------------------------------ */

/**
 * Dijkstra single-source shortest paths from `start` over non-negative edge
 * weights. Returns `dist` (Infinity if unreachable) and the shortest-path-tree
 * `parent` (−1 at the root / for unreached vertices).
 * @param {WeightedAdj} wadj
 * @param {number} start
 * @returns {{ dist: number[], parent: number[] }}
 */
export function dijkstra(wadj, start) {
    const n = wadj.length;
    const dist = new Array(n).fill(Infinity);
    const parent = new Array(n).fill(-1);
    const visited = new Array(n).fill(false);
    dist[start] = 0;
    for (let iter = 0; iter < n; iter++) {
        let u = -1;
        let best = Infinity;
        for (let i = 0; i < n; i++) {
            if (!visited[i] && dist[i] < best) { best = dist[i]; u = i; }
        }
        if (u === -1) break; // remaining vertices unreachable
        visited[u] = true;
        for (const { to, w } of wadj[u]) {
            if (w < 0) throw new RangeError('dijkstra requires non-negative weights');
            if (dist[u] + w < dist[to]) {
                dist[to] = dist[u] + w;
                parent[to] = u;
            }
        }
    }
    return { dist, parent };
}

/**
 * Shortest path from `start` to `goal` (via {@link dijkstra}). Returns the total
 * `dist`ance and the `path` as a vertex list (empty if unreachable).
 * @param {WeightedAdj} wadj
 * @param {number} start
 * @param {number} goal
 * @returns {{ dist: number, path: number[] }}
 */
export function shortestPath(wadj, start, goal) {
    const { dist, parent } = dijkstra(wadj, start);
    if (dist[goal] === Infinity) return { dist: Infinity, path: [] };
    /** @type {number[]} */
    const path = [];
    for (let v = goal; v !== -1; v = parent[v]) path.push(v);
    path.reverse();
    return { dist: dist[goal], path };
}

/* ------------------------------------------------------------------ *
 *  Components, topological order, MST
 * ------------------------------------------------------------------ */

/**
 * Connected components of an undirected graph (`n` vertices, `[u,v]` edges),
 * as a list of vertex-index arrays.
 * @param {number} n
 * @param {ReadonlyArray<[number, number]>} edges
 * @returns {number[][]}
 */
export function connectedComponents(n, edges) {
    const dsu = makeDSU(n);
    for (const [u, v] of edges) dsu.union(u, v);
    /** @type {Map<number, number[]>} */
    const groups = new Map();
    for (let i = 0; i < n; i++) {
        const r = dsu.find(i);
        let g = groups.get(r);
        if (!g) { g = []; groups.set(r, g); }
        g.push(i);
    }
    return Array.from(groups.values());
}

/**
 * Topological ordering of a DAG (`n` vertices, directed `[u,v]` edges meaning
 * u → v) by Kahn's algorithm. Throws if the graph has a cycle.
 * @param {number} n
 * @param {ReadonlyArray<[number, number]>} edges
 * @returns {number[]}
 */
export function topologicalSort(n, edges) {
    /** @type {number[][]} */
    const adj = Array.from({ length: n }, () => []);
    const indeg = new Array(n).fill(0);
    for (const [u, v] of edges) {
        adj[u].push(v);
        indeg[v] += 1;
    }
    /** @type {number[]} */
    const queue = [];
    for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
    /** @type {number[]} */
    const order = [];
    let head = 0;
    while (head < queue.length) {
        const u = queue[head];
        head += 1;
        order.push(u);
        for (const v of adj[u]) {
            indeg[v] -= 1;
            if (indeg[v] === 0) queue.push(v);
        }
    }
    if (order.length !== n) {
        throw new RangeError('graph has a cycle; topological sort is undefined');
    }
    return order;
}

/**
 * Minimum spanning tree / forest of an undirected weighted graph by Kruskal's
 * algorithm. Returns the total `weight` and the chosen `edges`.
 * @param {number} n
 * @param {ReadonlyArray<WEdge>} edges
 * @returns {{ weight: number, edges: WEdge[] }}
 */
export function mst(n, edges) {
    const sorted = [...edges].sort((a, b) => a.w - b.w);
    const dsu = makeDSU(n);
    /** @type {WEdge[]} */
    const chosen = [];
    let weight = 0;
    for (const e of sorted) {
        if (dsu.union(e.u, e.v)) {
            chosen.push(e);
            weight += e.w;
            if (chosen.length === n - 1) break;
        }
    }
    return { weight, edges: chosen };
}
