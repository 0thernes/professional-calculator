/**
 * @jest-environment node
 */
import {
    bfs, dfs, dijkstra, shortestPath, connectedComponents, topologicalSort, mst,
} from '../../math/graph.js';

describe('graph — BFS', () => {
    // square: 0–1, 0–2, 1–3, 2–3
    const adj = [[1, 2], [0, 3], [0, 3], [1, 2]];
    test('distances from 0 are [0,1,1,2]', () => {
        expect(bfs(adj, 0).dist).toEqual([0, 1, 1, 2]);
    });
    test('visits the source first and every vertex once', () => {
        const { order } = bfs(adj, 0);
        expect(order[0]).toBe(0);
        expect([...order].sort()).toEqual([0, 1, 2, 3]);
    });
    test('unreachable vertices stay at Infinity', () => {
        const g = [[1], [0], [3], [2]]; // two disjoint edges
        expect(bfs(g, 0).dist).toEqual([0, 1, Infinity, Infinity]);
    });
    test('parent of the root is -1', () => expect(bfs(adj, 0).parent[0]).toBe(-1));
});

describe('graph — DFS', () => {
    const adj = [[1, 2], [0, 3], [0, 3], [1, 2]];
    test('pre-order starts at the source and covers all vertices', () => {
        const { order } = dfs(adj, 0);
        expect(order[0]).toBe(0);
        expect([...order].sort()).toEqual([0, 1, 2, 3]);
    });
    test('parent tree is consistent (every non-root has a parent)', () => {
        const { parent } = dfs(adj, 0);
        expect(parent[0]).toBe(-1);
        for (let v = 1; v < 4; v++) expect(parent[v]).toBeGreaterThanOrEqual(0);
    });
});

describe('graph — Dijkstra', () => {
    // 0→1(4) 0→2(1) 2→1(2) 1→3(1) 2→3(5)
    /** @type {Array<Array<{to:number,w:number}>>} */
    const wadj = [
        [{ to: 1, w: 4 }, { to: 2, w: 1 }],
        [{ to: 3, w: 1 }],
        [{ to: 1, w: 2 }, { to: 3, w: 5 }],
        [],
    ];
    test('shortest distances from 0 are [0,3,1,4]', () => {
        expect(dijkstra(wadj, 0).dist).toEqual([0, 3, 1, 4]);
    });
    test('shortestPath 0→3 is [0,2,1,3] with dist 4', () => {
        const r = shortestPath(wadj, 0, 3);
        expect(r.dist).toBe(4);
        expect(r.path).toEqual([0, 2, 1, 3]);
    });
    test('unreachable goal → Infinity, empty path', () => {
        const g = [[{ to: 1, w: 2 }], [], []]; // vertex 2 unreachable
        expect(shortestPath(g, 0, 2)).toEqual({ dist: Infinity, path: [] });
    });
    test('negative weights throw', () => {
        const g = [[{ to: 1, w: -1 }], []];
        expect(() => dijkstra(g, 0)).toThrow(RangeError);
    });
    test('trivial path to self', () => {
        expect(shortestPath(wadj, 2, 2)).toEqual({ dist: 0, path: [2] });
    });
});

describe('graph — connected components', () => {
    test('two components', () => {
        const comps = connectedComponents(5, [[0, 1], [1, 2], [3, 4]]);
        expect(comps.length).toBe(2);
        const sorted = comps.map((c) => [...c].sort((a, b) => a - b)).sort((a, b) => a[0] - b[0]);
        expect(sorted).toEqual([[0, 1, 2], [3, 4]]);
    });
    test('isolated vertices are their own components', () => {
        expect(connectedComponents(3, []).length).toBe(3);
    });
    test('fully connected → one component', () => {
        expect(connectedComponents(4, [[0, 1], [1, 2], [2, 3]]).length).toBe(1);
    });
});

describe('graph — topological sort', () => {
    test('order respects every directed edge', () => {
        const edges = /** @type {Array<[number,number]>} */ ([[0, 1], [0, 2], [1, 3], [2, 3]]);
        const order = topologicalSort(4, edges);
        const pos = new Map(order.map((v, i) => [v, i]));
        for (const [u, v] of edges) expect(pos.get(u)).toBeLessThan(/** @type {number} */(pos.get(v)));
    });
    test('linear chain → exact order', () => {
        expect(topologicalSort(4, [[0, 1], [1, 2], [2, 3]])).toEqual([0, 1, 2, 3]);
    });
    test('cycle throws', () => {
        expect(() => topologicalSort(3, [[0, 1], [1, 2], [2, 0]])).toThrow(RangeError);
    });
});

describe('graph — minimum spanning tree (Kruskal)', () => {
    test('MST weight of a known graph is 6', () => {
        const edges = [
            { u: 0, v: 1, w: 1 }, { u: 1, v: 2, w: 2 }, { u: 2, v: 3, w: 3 },
            { u: 0, v: 3, w: 4 }, { u: 0, v: 2, w: 5 },
        ];
        const t = mst(4, edges);
        expect(t.weight).toBe(6);
        expect(t.edges.length).toBe(3); // n-1
    });
    test('skips edges that would form a cycle', () => {
        const edges = [
            { u: 0, v: 1, w: 1 }, { u: 1, v: 2, w: 1 }, { u: 0, v: 2, w: 1 },
        ];
        const t = mst(3, edges);
        expect(t.edges.length).toBe(2);
        expect(t.weight).toBe(2);
    });
});
