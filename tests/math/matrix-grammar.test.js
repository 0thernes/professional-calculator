/**
 * @jest-environment node
 */
// Matrix/vector literals and linear algebra through the expression grammar.
import { parse, evaluateValue, compute } from '../../math/parser.js';

/** @param {string} src @param {Record<string, any>} [scope] @returns {any} */
const evalV = (src, scope) => evaluateValue(parse(src), scope);
/** @param {any} m @param {number[][]} expected */
const nearMat = (m, expected, eps = 1e-9) => {
    expect(Array.isArray(m)).toBe(true);
    expect(m.length).toBe(expected.length);
    for (let i = 0; i < expected.length; i++) {
        expect(m[i].length).toBe(expected[i].length);
        for (let j = 0; j < expected[i].length; j++) {
            expect(Math.abs(m[i][j] - expected[i][j])).toBeLessThanOrEqual(eps);
        }
    }
};
const near = (/** @type {number} */ a, /** @type {number} */ b, eps = 1e-9) =>
    expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);

describe('grammar — literals', () => {
    test('matrix literal', () => nearMat(evalV('[[1,2],[3,4]]'), [[1, 2], [3, 4]]));
    test('vector literal → column', () => nearMat(evalV('[1,2,3]'), [[1], [2], [3]]));
    test('entries can be expressions', () => nearMat(evalV('[[1+1, 2*3],[sqrt(4), 5]]'), [[2, 6], [2, 5]]));
    test('ragged matrix throws', () => expect(() => parse('[[1,2],[3]]')).toThrow(SyntaxError));
    test('empty literal throws', () => expect(() => parse('[]')).toThrow(SyntaxError));
});

describe('grammar — matrix arithmetic', () => {
    test('add', () => nearMat(evalV('[[1,2],[3,4]] + [[5,6],[7,8]]'), [[6, 8], [10, 12]]));
    test('sub', () => nearMat(evalV('[[5,6],[7,8]] - [[1,1],[1,1]]'), [[4, 5], [6, 7]]));
    test('matrix product', () => nearMat(evalV('[[1,2],[3,4]] * [[5,6],[7,8]]'), [[19, 22], [43, 50]]));
    test('scalar × matrix', () => nearMat(evalV('2 * [[1,2],[3,4]]'), [[2, 4], [6, 8]]));
    test('matrix × scalar', () => nearMat(evalV('[[1,2],[3,4]] * 3'), [[3, 6], [9, 12]]));
    test('matrix / scalar', () => nearMat(evalV('[[2,4],[6,8]] / 2'), [[1, 2], [3, 4]]));
    test('unary minus', () => nearMat(evalV('-[[1,-2],[3,4]]'), [[-1, 2], [-3, -4]]));
    test('matrix^2 = matrix·matrix', () => nearMat(evalV('[[1,1],[0,1]]^2'), [[1, 2], [0, 1]]));
    test('matrix^-1 = inverse', () => nearMat(evalV('[[4,7],[2,6]]^-1'), [[0.6, -0.7], [-0.2, 0.4]]));
    test('A·inv(A) = I', () => nearMat(evalV('[[4,3],[6,3]] * inv([[4,3],[6,3]])'), [[1, 0], [0, 1]]));
    test('scalar + matrix throws', () => expect(() => evalV('2 + [[1,2],[3,4]]')).toThrow(RangeError));
});

describe('grammar — linear-algebra functions', () => {
    test('det', () => near(evalV('det([[1,2],[3,4]])').re, -2));
    test('det 3×3', () => near(evalV('det([[6,1,1],[4,-2,5],[2,8,7]])').re, -306));
    test('trace', () => near(evalV('trace([[1,9],[9,5]])').re, 6));
    test('rank deficient', () => near(evalV('rank([[1,2],[2,4]])').re, 1));
    test('transpose', () => nearMat(evalV('transpose([[1,2,3],[4,5,6]])'), [[1, 4], [2, 5], [3, 6]]));
    test('inv', () => nearMat(evalV('inv([[4,7],[2,6]])'), [[0.6, -0.7], [-0.2, 0.4]]));
    test('identity(3)', () => nearMat(evalV('identity(3)'), [[1, 0, 0], [0, 1, 0], [0, 0, 1]]));
    test('zeros(2,3)', () => nearMat(evalV('zeros(2,3)'), [[0, 0, 0], [0, 0, 0]]));
    test('norm = Frobenius', () => near(evalV('norm([[3,0],[0,4]])').re, 5));
    test('|matrix| = Frobenius too', () => near(evalV('|[[3,0],[0,4]]|').re, 5));
    test('solve 2×2 system', () => nearMat(evalV('solve([[2,1],[1,3]], [3,5])'), [[0.8], [1.4]]));
    test('eigvals of diagonal (ascending)', () => nearMat(evalV('eigvals([[2,0],[0,3]])'), [[2], [3]]));
    test('eigvals sum = trace', () => {
        const ev = evalV('eigvals([[4,1],[1,3]])');
        near(ev[0][0] + ev[1][0], 7);
    });
    test('det of non-square throws', () => expect(() => evalV('det([[1,2,3],[4,5,6]])')).toThrow(RangeError));
    test('factor(360) → column of prime factors', () =>
        nearMat(evalV('factor(360)'), [[2], [2], [2], [3], [3], [5]]));
    test('divisors(28) → column', () =>
        nearMat(evalV('divisors(28)'), [[1], [2], [4], [7], [14], [28]]));
});

describe('grammar — variables & quadratic-style use', () => {
    test('assign matrix to var, then use', () => {
        const A = evalV('[[2,1],[1,3]]');
        const s = { A };
        near(evalV('det(A)', s).re, 5);
        nearMat(evalV('A * inv(A)', s), [[1, 0], [0, 1]]);
        nearMat(evalV('A^2', s), [[5, 5], [5, 10]]); // [[2,1],[1,3]]²
    });
});

describe('grammar — compute() formatting & scalar back-compat', () => {
    test('matrix result formats', () => {
        const r = compute('[[1,2],[3,4]]');
        expect(r.isMatrix).toBe(true);
        expect(r.display).toBe('[[1, 2], [3, 4]]');
    });
    test('det result is scalar', () => {
        const r = compute('det([[1,2],[3,4]])');
        expect(r.isMatrix).toBe(false);
        expect(r.display).toBe('-2');
    });
    test('scalar expressions unaffected', () => {
        expect(compute('2 + 3 * 4').display).toBe('14');
        expect(compute('2 + 3 * 4').isMatrix).toBe(false);
        expect(compute('2 + 3i').display).toBe('2 + 3i');
    });
});
