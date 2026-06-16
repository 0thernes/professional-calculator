// @ts-check
/**
 * Calculator Suite — a paged grid of 48 focused mini‑calculators across 25
 * domains, each exposing an operation dropdown (≈250 operations total) wired to
 * the existing `math/` engine. Data‑driven: one {@link PAGES} registry feeds a
 * generic renderer (page tabs → 12‑tile grid → per‑tile op‑select + inputs +
 * Run + result). All DOM via textContent/createElement (no innerHTML); the
 * engine namespace is treated as untyped (`any`) so the op closures stay terse
 * without fighting the type‑checker.
 *
 * @module suite
 */

/** @typedef {{ M: any, n:(k:string)=>number, nums:(k:string)=>number[], s:(k:string)=>string, R:(expr:string)=>string, fmt:(x:number)=>string }} IO */
/** @typedef {{ name:string, run:(io:IO)=>string }} Op */
/** @typedef {{ id:string, title:string, blurb:string, inputs:{k:string,label:string,def:string}[], ops:Op[] }} Tile */
/** @typedef {{ name:string, tiles:Tile[] }} Page */

/** Compact number format. @param {number} x @returns {string} */
function fnum(x) {
    if (typeof x !== 'number' || Number.isNaN(x)) return String(x);
    if (!Number.isFinite(x)) return x > 0 ? '∞' : '−∞';
    const r = Math.abs(x) < 1e-12 ? 0 : x;
    if (Number.isInteger(r) && Math.abs(r) < 1e15) return String(r);
    return parseFloat(r.toPrecision(8)).toString();
}

/** Parse a comma/space separated list of numbers. @param {string} sv @returns {number[]} */
function parseNums(sv) {
    return String(sv).split(/[,\s]+/).map((t) => parseFloat(t)).filter((x) => Number.isFinite(x));
}

/* ============================================================= *
 *  REGISTRY — 4 pages × 12 tiles = 48 mini‑calculators
 * ============================================================= */

/** @type {Page[]} */
const PAGES = [
  { name: 'I · Core & Algebra', tiles: [
    { id: 'arith', title: 'Scientific', blurb: 'Evaluate any expression', inputs: [{ k: 'e', label: 'expression', def: '2+3*4^2' }], ops: [
      { name: 'evaluate', run: (io) => io.R(io.s('e')) } ] },
    { id: 'powroot', title: 'Powers & Roots', blurb: 'xⁿ, ⁿ√x', inputs: [{ k: 'x', label: 'x', def: '2' }, { k: 'n', label: 'n', def: '10' }], ops: [
      { name: 'x^n', run: (io) => io.R(`(${io.s('x')})^(${io.s('n')})`) },
      { name: 'n-th root', run: (io) => io.R(`(${io.s('x')})^(1/(${io.s('n')}))`) },
      { name: '√x', run: (io) => io.R(`sqrt(${io.s('x')})`) },
      { name: 'cbrt x', run: (io) => io.R(`cbrt(${io.s('x')})`) },
      { name: 'x²', run: (io) => io.R(`(${io.s('x')})^2`) },
      { name: '1/x', run: (io) => io.R(`1/(${io.s('x')})`) },
      { name: '|x|', run: (io) => io.R(`abs(${io.s('x')})`) },
      { name: 'xˣ', run: (io) => io.R(`(${io.s('x')})^(${io.s('x')})`) } ] },
    { id: 'logexp', title: 'Log & Exp', blurb: 'ln, log₁₀, logₐ, eˣ', inputs: [{ k: 'x', label: 'x', def: '100' }, { k: 'b', label: 'base', def: '10' }], ops: [
      { name: 'ln', run: (io) => io.R(`ln(${io.s('x')})`) },
      { name: 'log10', run: (io) => io.R(`log10(${io.s('x')})`) },
      { name: 'log2', run: (io) => io.R(`log2(${io.s('x')})`) },
      { name: 'log base b', run: (io) => io.R(`log(${io.s('x')}, ${io.s('b')})`) },
      { name: 'e^x', run: (io) => io.R(`e^(${io.s('x')})`) },
      { name: 'b^x', run: (io) => io.R(`(${io.s('b')})^(${io.s('x')})`) },
      { name: 'antilog 10^x', run: (io) => io.R(`10^(${io.s('x')})`) } ] },
    { id: 'trig', title: 'Trigonometry', blurb: 'sin cos tan (radians)', inputs: [{ k: 'x', label: 'angle (rad)', def: 'pi/4' }], ops: [
      { name: 'sin', run: (io) => io.R(`sin(${io.s('x')})`) },
      { name: 'cos', run: (io) => io.R(`cos(${io.s('x')})`) },
      { name: 'tan', run: (io) => io.R(`tan(${io.s('x')})`) },
      { name: 'sec = 1/cos', run: (io) => io.R(`1/cos(${io.s('x')})`) },
      { name: 'csc = 1/sin', run: (io) => io.R(`1/sin(${io.s('x')})`) },
      { name: 'cot = 1/tan', run: (io) => io.R(`1/tan(${io.s('x')})`) },
      { name: 'deg→rad', run: (io) => io.R(`rad(${io.s('x')})`) },
      { name: 'rad→deg', run: (io) => io.R(`deg(${io.s('x')})`) } ] },
    { id: 'invtrig', title: 'Inverse / Hyperbolic', blurb: 'asin…, sinh…', inputs: [{ k: 'x', label: 'x', def: '0.5' }], ops: [
      { name: 'asin', run: (io) => io.R(`asin(${io.s('x')})`) },
      { name: 'acos', run: (io) => io.R(`acos(${io.s('x')})`) },
      { name: 'atan', run: (io) => io.R(`atan(${io.s('x')})`) },
      { name: 'sinh', run: (io) => io.R(`sinh(${io.s('x')})`) },
      { name: 'cosh', run: (io) => io.R(`cosh(${io.s('x')})`) },
      { name: 'tanh', run: (io) => io.R(`tanh(${io.s('x')})`) },
      { name: 'asinh', run: (io) => io.R(`asinh(${io.s('x')})`) },
      { name: 'acosh', run: (io) => io.R(`acosh(1+${io.s('x')})`) },
      { name: 'atanh', run: (io) => io.R(`atanh(${io.s('x')})`) } ] },
    { id: 'complex', title: 'Complex Numbers', blurb: 'ℂ field', inputs: [{ k: 'z', label: 'z', def: '3+4i' }], ops: [
      { name: 'evaluate', run: (io) => io.R(io.s('z')) },
      { name: '|z|', run: (io) => io.R(`|${io.s('z')}|`) },
      { name: 'arg', run: (io) => io.R(`arg(${io.s('z')})`) },
      { name: 'conj', run: (io) => io.R(`conj(${io.s('z')})`) },
      { name: 'Re', run: (io) => io.R(`re(${io.s('z')})`) },
      { name: 'Im', run: (io) => io.R(`im(${io.s('z')})`) },
      { name: 'z²', run: (io) => io.R(`(${io.s('z')})^2`) },
      { name: '1/z', run: (io) => io.R(`1/(${io.s('z')})`) },
      { name: '√z', run: (io) => io.R(`sqrt(${io.s('z')})`) },
      { name: 'exp(z)', run: (io) => io.R(`exp(${io.s('z')})`) } ] },
    { id: 'rational', title: 'Exact Rationals', blurb: 'BigInt n/d', inputs: [{ k: 'a', label: 'a', def: '1/3' }, { k: 'b', label: 'b', def: '1/6' }], ops: [
      { name: 'a + b', run: (io) => rat(io, '+') },
      { name: 'a − b', run: (io) => rat(io, '-') },
      { name: 'a × b', run: (io) => rat(io, '*') },
      { name: 'a ÷ b', run: (io) => rat(io, '/') } ] },
    { id: 'polyeval', title: 'Polynomial', blurb: 'eval p(x)', inputs: [{ k: 'c', label: 'coeffs (high→low)', def: '1,-3,2' }, { k: 'x', label: 'x', def: '5' }], ops: [
      { name: 'evaluate p(x)', run: (io) => io.fmt(io.M.Interpolate.polyval(parseNums(io.s('c')), io.n('x'))) } ] },
    { id: 'quad', title: 'Quadratic Solver', blurb: 'ax²+bx+c=0', inputs: [{ k: 'a', label: 'a', def: '1' }, { k: 'b', label: 'b', def: '-3' }, { k: 'c', label: 'c', def: '2' }], ops: [
      { name: 'roots', run: (io) => quad(io) },
      { name: 'discriminant', run: (io) => io.fmt(io.n('b') * io.n('b') - 4 * io.n('a') * io.n('c')) },
      { name: 'vertex x = −b/2a', run: (io) => io.fmt(-io.n('b') / (2 * io.n('a'))) },
      { name: 'sum of roots −b/a', run: (io) => io.fmt(-io.n('b') / io.n('a')) },
      { name: 'product c/a', run: (io) => io.fmt(io.n('c') / io.n('a')) } ] },
    { id: 'simplify', title: 'Algebra (CAS)', blurb: 'symbolic d/dx', inputs: [{ k: 'e', label: 'f(x)', def: 'x^3 + 2*x' }, { k: 'v', label: 'var', def: 'x' }], ops: [
      { name: 'differentiate', run: (io) => io.M.Symbolic.diff(io.s('e'), io.s('v')).string },
      { name: 'integrate', run: (io) => io.M.Symbolic.integral(io.s('e'), io.s('v')).string + ' + C' } ] },
    { id: 'series', title: 'Sequences & Series', blurb: 'Σ, factorial', inputs: [{ k: 'n', label: 'n', def: '20' }], ops: [
      { name: 'n!', run: (io) => io.R(`${io.s('n')}!`) },
      { name: 'Σ 1..n', run: (io) => io.fmt((io.n('n') * (io.n('n') + 1)) / 2) },
      { name: 'Σ i² 1..n', run: (io) => { const n = io.n('n'); return io.fmt((n * (n + 1) * (2 * n + 1)) / 6); } },
      { name: 'Σ i³ 1..n', run: (io) => { const n = io.n('n'); return io.fmt(Math.pow((n * (n + 1)) / 2, 2)); } },
      { name: 'harmonic Hₙ', run: (io) => { const n = io.n('n'); let h = 0; for (let i = 1; i <= n; i++) h += 1 / i; return io.fmt(h); } },
      { name: 'Σ 2ⁱ (0..n)', run: (io) => io.fmt(Math.pow(2, io.n('n') + 1) - 1) },
      { name: 'fib(n)', run: (io) => io.fmt(io.M.NumberTheory.fibonacci(io.n('n'))) } ] },
    { id: 'percent', title: 'Percent & Ratio', blurb: 'business math', inputs: [{ k: 'a', label: 'value', def: '250' }, { k: 'b', label: 'percent / total', def: '15' }], ops: [
      { name: 'a% of total b', run: (io) => io.fmt((io.n('a') / 100) * io.n('b')) },
      { name: 'a is what % of b', run: (io) => io.fmt((io.n('a') / io.n('b')) * 100) + ' %' },
      { name: '% change a→b', run: (io) => io.fmt(((io.n('b') - io.n('a')) / io.n('a')) * 100) + ' %' },
      { name: 'add a% to b', run: (io) => io.fmt(io.n('b') * (1 + io.n('a') / 100)) },
      { name: 'a% off b (sale)', run: (io) => io.fmt(io.n('b') * (1 - io.n('a') / 100)) },
      { name: 'b is a% of what?', run: (io) => io.fmt((io.n('b') * 100) / io.n('a')) } ] },
  ] },

  { name: 'II · Calculus & Linear Algebra', tiles: [
    { id: 'deriv', title: 'Derivative', blurb: 'numeric f′(x)', inputs: [{ k: 'f', label: 'f(x)', def: 'sin(x)' }, { k: 'x', label: 'at x', def: '1' }], ops: [
      { name: "f'(x)", run: (io) => io.fmt(io.M.Calculus.derivative(fx(io, 'f'), io.n('x'))) },
      { name: "f''(x)", run: (io) => io.fmt(io.M.Calculus.secondDerivative(fx(io, 'f'), io.n('x'))) } ] },
    { id: 'integ', title: 'Integral', blurb: '∫ₐᵇ f dx', inputs: [{ k: 'f', label: 'f(x)', def: '4/(1+x*x)' }, { k: 'a', label: 'a', def: '0' }, { k: 'b', label: 'b', def: '1' }], ops: [
      { name: 'adaptive Simpson', run: (io) => io.fmt(io.M.Calculus.integrate(fx(io, 'f'), io.n('a'), io.n('b'))) },
      { name: 'Gauss–Legendre', run: (io) => io.fmt(io.M.Calculus.gaussLegendre(fx(io, 'f'), io.n('a'), io.n('b'))) } ] },
    { id: 'roots', title: 'Root Finder', blurb: 'solve f(x)=0', inputs: [{ k: 'f', label: 'f(x)', def: 'x*x - 2' }, { k: 'a', label: 'a / x₀', def: '1' }, { k: 'b', label: 'b / x₁', def: '2' }], ops: [
      { name: 'Brent (bracket a,b)', run: (io) => io.fmt(io.M.Calculus.brent(fx(io, 'f'), io.n('a'), io.n('b'))) },
      { name: 'Newton (x₀=a)', run: (io) => io.fmt(io.M.Calculus.newton(fx(io, 'f'), io.n('a'))) },
      { name: 'secant (x₀=a,x₁=b)', run: (io) => io.fmt(io.M.Calculus.secant(fx(io, 'f'), io.n('a'), io.n('b'))) },
      { name: 'bisection (a,b)', run: (io) => io.fmt(io.M.Calculus.bisection(fx(io, 'f'), io.n('a'), io.n('b'))) } ] },
    { id: 'opt', title: 'Optimization', blurb: '1‑D extremum', inputs: [{ k: 'f', label: 'f(x)', def: '(x-3)^2 + 1' }, { k: 'a', label: 'a', def: '-10' }, { k: 'b', label: 'b', def: '10' }], ops: [
      { name: 'golden‑section min', run: (io) => { const f = fx(io, 'f'); const r = io.M.Optimize.goldenSection(f, io.n('a'), io.n('b')); const x = r.x ?? r; return `x* = ${io.fmt(x)}  f = ${io.fmt(f(x))}`; } },
      { name: 'golden‑section max', run: (io) => { const f = fx(io, 'f'); const r = io.M.Optimize.goldenSection((/** @type {number} */ x) => -f(x), io.n('a'), io.n('b')); const x = r.x ?? r; return `x* = ${io.fmt(x)}  f = ${io.fmt(f(x))}`; } } ] },
    { id: 'matrix', title: 'Matrix', blurb: 'det inv rank trace', inputs: [{ k: 'A', label: 'A = [[..],[..]]', def: '[[2,1],[1,3]]' }], ops: [
      { name: 'det', run: (io) => io.fmt(io.M.Matrix.det(matOf(io, 'A'))) },
      { name: 'trace', run: (io) => io.fmt(io.M.Matrix.trace(matOf(io, 'A'))) },
      { name: 'rank', run: (io) => io.fmt(io.M.Matrix.rank(matOf(io, 'A'))) },
      { name: 'inverse', run: (io) => matStr(io.M.Matrix.inv(matOf(io, 'A'))) },
      { name: 'transpose', run: (io) => matStr(io.M.Matrix.transpose(matOf(io, 'A'))) },
      { name: '‖A‖_F', run: (io) => io.fmt(io.M.Matrix.normFro(matOf(io, 'A'))) },
      { name: '‖A‖₁', run: (io) => io.fmt(io.M.Matrix.norm1(matOf(io, 'A'))) },
      { name: '‖A‖∞', run: (io) => io.fmt(io.M.Matrix.normInf(matOf(io, 'A'))) },
      { name: 'symmetric?', run: (io) => io.M.Matrix.isSymmetric(matOf(io, 'A')) ? 'yes' : 'no' } ] },
    { id: 'eig', title: 'Eigen / SVD', blurb: 'spectra', inputs: [{ k: 'A', label: 'A', def: '[[0,-1],[1,0]]' }], ops: [
      { name: 'eigenvalues', run: (io) => io.M.Matrix.eigenvalues(matOf(io, 'A')).map((/** @type {any} */ z) => cpx(z)).join(',  ') },
      { name: 'singular values', run: (io) => io.M.Decomposition.singularValues(matOf(io, 'A')).map(io.fmt).join(',  ') },
      { name: 'cond κ₂', run: (io) => io.fmt(io.M.Decomposition.conditionNumber(matOf(io, 'A'))) },
      { name: 'pseudo‑inverse', run: (io) => matStr(io.M.Decomposition.pseudoInverse(matOf(io, 'A'))) } ] },
    { id: 'lsolve', title: 'Linear Solve', blurb: 'Ax = b', inputs: [{ k: 'A', label: 'A', def: '[[2,1],[1,3]]' }, { k: 'b', label: 'b = [[..]]', def: '[[1],[2]]' }], ops: [
      { name: 'solve', run: (io) => matStr(io.M.compute(`solve(${io.s('A')}, ${io.s('b')})`).value) },
      { name: 'least squares (lstsq)', run: (io) => '[' + io.M.Decomposition.lstsq(matOf(io, 'A'), matOf(io, 'b')).map(io.fmt).join(', ') + ']' },
      { name: 'LU factorization', run: (io) => { const lu = io.M.Matrix.lu(matOf(io, 'A')); return `LU = ${matStr(lu.LU)}   piv = [${lu.piv.join(', ')}]   sign = ${lu.sign}`; } } ] },
    { id: 'vector', title: 'Vector Geometry', blurb: 'dot cross ∠', inputs: [{ k: 'u', label: 'u', def: '1,2,3' }, { k: 'v', label: 'v', def: '4,5,6' }], ops: [
      { name: 'dot', run: (io) => io.fmt(io.M.Geometry.dot(parseNums(io.s('u')), parseNums(io.s('v')))) },
      { name: 'cross', run: (io) => '[' + io.M.Geometry.cross(parseNums(io.s('u')), parseNums(io.s('v'))).map(io.fmt).join(', ') + ']' },
      { name: '|u|', run: (io) => io.fmt(io.M.Geometry.norm(parseNums(io.s('u')))) },
      { name: 'angle u,v', run: (io) => io.fmt(io.M.Geometry.angleBetween(parseNums(io.s('u')), parseNums(io.s('v')))) + ' rad' },
      { name: 'distance', run: (io) => io.fmt(io.M.Geometry.distance(parseNums(io.s('u')), parseNums(io.s('v')))) },
      { name: 'normalize û', run: (io) => '[' + io.M.Geometry.normalize(parseNums(io.s('u'))).map(io.fmt).join(', ') + ']' },
      { name: 'projection u→v', run: (io) => '[' + io.M.Geometry.projection(parseNums(io.s('u')), parseNums(io.s('v'))).map(io.fmt).join(', ') + ']' },
      { name: 'midpoint (lerp ½)', run: (io) => '[' + io.M.Geometry.lerp(parseNums(io.s('u')), parseNums(io.s('v')), 0.5).map(io.fmt).join(', ') + ']' } ] },
    { id: 'numtheory', title: 'Number Theory', blurb: 'primes, mod', inputs: [{ k: 'n', label: 'n', def: '360' }, { k: 'm', label: 'm', def: '7' }, { k: 'k', label: 'k / mod', def: '1000' }], ops: [
      { name: 'is prime?', run: (io) => io.M.NumberTheory.isPrime(io.n('n')) ? 'prime' : 'composite' },
      { name: 'factor', run: (io) => io.M.NumberTheory.primeFactors(io.n('n')).join(' × ') },
      { name: 'divisors', run: (io) => io.M.NumberTheory.divisors(io.n('n')).join(', ') },
      { name: 'gcd(n,m)', run: (io) => io.fmt(io.M.NumberTheory.gcd(io.n('n'), io.n('m'))) },
      { name: 'lcm(n,m)', run: (io) => io.fmt(io.M.NumberTheory.lcm(io.n('n'), io.n('m'))) },
      { name: 'φ(n)', run: (io) => io.fmt(io.M.NumberTheory.eulerTotient(io.n('n'))) },
      { name: 'nextprime', run: (io) => io.fmt(io.M.NumberTheory.nextPrime(io.n('n'))) },
      { name: 'nᵐ mod k', run: (io) => io.fmt(io.M.NumberTheory.modPow(io.n('n'), io.n('m'), io.n('k'))) },
      { name: 'modinv(n mod m)', run: (io) => io.fmt(io.M.NumberTheory.modInverse(io.n('n'), io.n('m'))) },
      { name: 'perfect square?', run: (io) => io.M.NumberTheory.isPerfectSquare(io.n('n')) ? 'yes' : 'no' } ] },
    { id: 'combo', title: 'Combinatorics', blurb: 'nCr, Catalan…', inputs: [{ k: 'n', label: 'n', def: '12' }, { k: 'k', label: 'k', def: '5' }], ops: [
      { name: 'nCr', run: (io) => io.R(`nCr(${io.s('n')}, ${io.s('k')})`) },
      { name: 'nPr', run: (io) => io.R(`nPr(${io.s('n')}, ${io.s('k')})`) },
      { name: 'Catalan(n)', run: (io) => io.fmt(io.M.Combinatorics.catalan(io.n('n'))) },
      { name: 'Bell(n)', run: (io) => io.fmt(io.M.Combinatorics.bell(io.n('n'))) },
      { name: 'Stirling2(n,k)', run: (io) => io.fmt(io.M.Combinatorics.stirlingSecond(io.n('n'), io.n('k'))) },
      { name: 'partitions(n)', run: (io) => io.fmt(io.M.Combinatorics.partitions(io.n('n'))) },
      { name: 'derangements !n', run: (io) => io.fmt(io.M.Combinatorics.derangements(io.n('n'))) },
      { name: 'Stirling1(n,k)', run: (io) => io.fmt(io.M.Combinatorics.stirlingFirst(io.n('n'), io.n('k'))) },
      { name: 'multiset C(n,k)', run: (io) => io.fmt(io.M.Combinatorics.combinationsWithRepetition(io.n('n'), io.n('k'))) } ] },
    { id: 'interp', title: 'Interpolation & Fit', blurb: 'spline, polyfit', inputs: [{ k: 'x', label: 'xs', def: '0,1,2,3' }, { k: 'y', label: 'ys', def: '1,3,2,5' }, { k: 'q', label: 'eval at / degree', def: '1.5' }], ops: [
      { name: 'Lagrange @q', run: (io) => io.fmt(io.M.Interpolate.lagrangeEval(parseNums(io.s('x')), parseNums(io.s('y')), io.n('q'))) },
      { name: 'linear @q', run: (io) => io.fmt(io.M.Interpolate.linearInterp(parseNums(io.s('x')), parseNums(io.s('y')), io.n('q'))) },
      { name: 'cubic spline @q', run: (io) => io.fmt(io.M.Interpolate.cubicSpline(parseNums(io.s('x')), parseNums(io.s('y')))(io.n('q'))) },
      { name: 'polyfit(deg=q)', run: (io) => io.M.Interpolate.polyfit(parseNums(io.s('x')), parseNums(io.s('y')), Math.round(io.n('q'))).map(io.fmt).join(', ') } ] },
    { id: 'specfn', title: 'Special Functions', blurb: 'Γ erf β', inputs: [{ k: 'x', label: 'x', def: '0.5' }, { k: 'y', label: 'y', def: '3' }], ops: [
      { name: 'Γ(x)', run: (io) => io.R(`gamma(${io.s('x')})`) },
      { name: 'erf(x)', run: (io) => io.R(`erf(${io.s('x')})`) },
      { name: 'erfc(x)', run: (io) => io.R(`erfc(${io.s('x')})`) },
      { name: 'β(x,y)', run: (io) => io.fmt(io.M.Special.beta(io.n('x'), io.n('y'))) },
      { name: 'lnΓ(x)', run: (io) => io.fmt(io.M.Special.lgamma(io.n('x'))) },
      { name: 'lnβ(x,y)', run: (io) => io.fmt(io.M.Special.lbeta(io.n('x'), io.n('y'))) },
      { name: 'lnΓ(x+y)', run: (io) => io.fmt(io.M.Special.lgamma(io.n('x') + io.n('y'))) } ] },
  ] },

  { name: 'III · Probability, Stats & Finance', tiles: [
    { id: 'descr', title: 'Descriptive Stats', blurb: 'mean σ median…', inputs: [{ k: 'd', label: 'data', def: '4,8,15,16,23,42' }], ops: [
      { name: 'mean', run: (io) => io.fmt(io.M.Stats.mean(parseNums(io.s('d')))) },
      { name: 'median', run: (io) => io.fmt(io.M.Stats.median(parseNums(io.s('d')))) },
      { name: 'std (sample)', run: (io) => io.fmt(io.M.Stats.std(parseNums(io.s('d')), true)) },
      { name: 'variance (sample)', run: (io) => io.fmt(io.M.Stats.variance(parseNums(io.s('d')), true)) },
      { name: 'IQR', run: (io) => io.fmt(io.M.Stats.iqr(parseNums(io.s('d')))) },
      { name: 'skewness', run: (io) => io.fmt(io.M.Stats.skewness(parseNums(io.s('d')))) },
      { name: 'kurtosis', run: (io) => io.fmt(io.M.Stats.kurtosis(parseNums(io.s('d')))) },
      { name: 'mode', run: (io) => io.M.Stats.mode(parseNums(io.s('d'))).map(io.fmt).join(', ') },
      { name: 'range', run: (io) => io.fmt(io.M.Stats.range(parseNums(io.s('d')))) },
      { name: 'sum', run: (io) => io.fmt(io.M.Stats.sum(parseNums(io.s('d')))) } ] },
    { id: 'dist', title: 'Distributions', blurb: 'pdf / cdf / quantile', inputs: [{ k: 'x', label: 'x', def: '1.96' }, { k: 'p', label: 'p / df', def: '0.975' }], ops: [
      { name: 'Φ(x) normal cdf', run: (io) => io.fmt(io.M.Stats.normalCdf(io.n('x'))) },
      { name: 'normal pdf', run: (io) => io.fmt(io.M.Stats.normalPdf(io.n('x'))) },
      { name: 'normal quantile(p)', run: (io) => io.fmt(io.M.Stats.normalQuantile(io.n('p'))) },
      { name: 't cdf (df=p)', run: (io) => io.fmt(io.M.Stats.tCdf(io.n('x'), io.n('p'))) },
      { name: 'χ² cdf (k=p)', run: (io) => io.fmt(io.M.Stats.chiSquareCdf(io.n('x'), io.n('p'))) },
      { name: 't pdf (df=p)', run: (io) => io.fmt(io.M.Stats.tPdf(io.n('x'), io.n('p'))) },
      { name: 'χ² pdf (k=p)', run: (io) => io.fmt(io.M.Stats.chiSquarePdf(io.n('x'), io.n('p'))) } ] },
    { id: 'discrete', title: 'Discrete Dists', blurb: 'binomial, Poisson', inputs: [{ k: 'k', label: 'k', def: '3' }, { k: 'n', label: 'n', def: '10' }, { k: 'p', label: 'p / λ', def: '0.5' }], ops: [
      { name: 'binomial pmf', run: (io) => io.fmt(io.M.Stats.binomialPmf(io.n('k'), io.n('n'), io.n('p'))) },
      { name: 'binomial cdf', run: (io) => io.fmt(io.M.Stats.binomialCdf(io.n('k'), io.n('n'), io.n('p'))) },
      { name: 'Poisson pmf (λ=p)', run: (io) => io.fmt(io.M.Stats.poissonPmf(io.n('k'), io.n('p'))) },
      { name: 'Poisson cdf (λ=p)', run: (io) => io.fmt(io.M.Stats.poissonCdf(io.n('k'), io.n('p'))) },
      { name: 'exponential cdf (λ=p)', run: (io) => io.fmt(io.M.Stats.exponentialCdf(io.n('k'), io.n('p'))) } ] },
    { id: 'htest', title: 'Hypothesis Tests', blurb: 't / ANOVA / χ²', inputs: [{ k: 'a', label: 'sample A', def: '5,6,7,8,9' }, { k: 'b', label: 'sample B / μ₀ / exp', def: '7,8,9,10,11' }], ops: [
      { name: 'two‑sample t (Welch)', run: (io) => { const r = io.M.Stats.tTestTwoSample(parseNums(io.s('a')), parseNums(io.s('b'))); return `t = ${io.fmt(r.statistic)}  df = ${io.fmt(r.df)}  p = ${io.fmt(r.pValue)}`; } },
      { name: 'one‑sample t (μ₀=b)', run: (io) => { const r = io.M.Stats.tTestOneSample(parseNums(io.s('a')), io.n('b')); return `t = ${io.fmt(r.statistic)}  p = ${io.fmt(r.pValue)}`; } },
      { name: '95% CI of mean(A)', run: (io) => { const r = io.M.Stats.confidenceIntervalMean(parseNums(io.s('a'))); return `[${io.fmt(r.lower)}, ${io.fmt(r.upper)}]`; } },
      { name: 'one‑way ANOVA (A,B)', run: (io) => { const r = io.M.Stats.anovaOneWay([parseNums(io.s('a')), parseNums(io.s('b'))]); return `F = ${io.fmt(r.statistic)}  p = ${io.fmt(r.pValue)}`; } },
      { name: 'χ² GoF (obs=A, exp=B)', run: (io) => { const r = io.M.Stats.chiSquareGoF(parseNums(io.s('a')), parseNums(io.s('b'))); return `χ² = ${io.fmt(r.statistic)}  p = ${io.fmt(r.pValue)}`; } } ] },
    { id: 'regress', title: 'Regression', blurb: 'least squares', inputs: [{ k: 'x', label: 'xs', def: '1,2,3,4,5' }, { k: 'y', label: 'ys', def: '2,4,5,4,5' }], ops: [
      { name: 'linear y=mx+b', run: (io) => { const r = io.M.Stats.linearRegression(parseNums(io.s('x')), parseNums(io.s('y'))); return `slope = ${io.fmt(r.slope)}  intercept = ${io.fmt(r.intercept)}  r² = ${io.fmt(r.r2 ?? r.rSquared ?? 0)}`; } },
      { name: 'correlation r', run: (io) => io.fmt(io.M.Stats.correlation(parseNums(io.s('x')), parseNums(io.s('y')))) },
      { name: 'covariance', run: (io) => io.fmt(io.M.Stats.covariance(parseNums(io.s('x')), parseNums(io.s('y')), true)) } ] },
    { id: 'comboProb', title: 'Combinatorial Prob.', blurb: 'odds & counts', inputs: [{ k: 'n', label: 'n', def: '52' }, { k: 'k', label: 'k', def: '5' }], ops: [
      { name: 'nCr ways', run: (io) => io.R(`nCr(${io.s('n')}, ${io.s('k')})`) },
      { name: 'nPr ways', run: (io) => io.R(`nPr(${io.s('n')}, ${io.s('k')})`) },
      { name: 'P(no repeat) birthday', run: (io) => { const n = io.n('n'); let p = 1; for (let i = 0; i < io.n('k'); i++) p *= (n - i) / n; return io.fmt(p); } },
      { name: 'P(≥1 collision)', run: (io) => { const n = io.n('n'); let p = 1; for (let i = 0; i < io.n('k'); i++) p *= (n - i) / n; return io.fmt(1 - p); } } ] },
    { id: 'tvm', title: 'Time Value of Money', blurb: 'PV / FV / annuity', inputs: [{ k: 'amt', label: 'PV or PMT', def: '1000' }, { k: 'r', label: 'rate /period', def: '0.05' }, { k: 'n', label: 'periods', def: '10' }], ops: [
      { name: 'FV of PV', run: (io) => io.fmt(io.M.Finance.futureValue(io.n('amt'), io.n('r'), io.n('n'))) },
      { name: 'PV of FV', run: (io) => io.fmt(io.M.Finance.presentValue(io.n('amt'), io.n('r'), io.n('n'))) },
      { name: 'annuity PV (PMT)', run: (io) => io.fmt(io.M.Finance.annuityPV(io.n('amt'), io.n('r'), io.n('n'))) },
      { name: 'annuity FV (PMT)', run: (io) => io.fmt(io.M.Finance.annuityFV(io.n('amt'), io.n('r'), io.n('n'))) },
      { name: 'loan payment', run: (io) => io.fmt(io.M.Finance.payment(io.n('amt'), io.n('r'), io.n('n'))) } ] },
    { id: 'cashflow', title: 'NPV / IRR', blurb: 'project finance', inputs: [{ k: 'r', label: 'discount rate', def: '0.1' }, { k: 'cf', label: 'cashflows (t0..)', def: '-1000,300,400,500,600' }], ops: [
      { name: 'NPV', run: (io) => io.fmt(io.M.Finance.npv(io.n('r'), parseNums(io.s('cf')))) },
      { name: 'IRR', run: (io) => io.fmt(io.M.Finance.irr(parseNums(io.s('cf')))) },
      { name: 'profitability index', run: (io) => { const cf = parseNums(io.s('cf')); const npv = io.M.Finance.npv(io.n('r'), cf); const c0 = Math.abs(cf[0]); return io.fmt((npv + c0) / c0); } } ] },
    { id: 'bs', title: 'Black–Scholes', blurb: 'option pricing', inputs: [{ k: 'S', label: 'spot', def: '100' }, { k: 'K', label: 'strike', def: '100' }, { k: 'r', label: 'rate', def: '0.05' }, { k: 'v', label: 'vol σ', def: '0.2' }, { k: 'T', label: 'years', def: '1' }], ops: [
      { name: 'price call/put', run: (io) => { const b = io.M.Finance.blackScholes(io.n('S'), io.n('K'), io.n('r'), io.n('v'), io.n('T')); return `call ${io.fmt(b.call)}  put ${io.fmt(b.put)}`; } },
      { name: 'Greeks (call)', run: (io) => greekStr(io, 'call') },
      { name: 'Greeks (put)', run: (io) => greekStr(io, 'put') },
      { name: 'binomial price (100 steps)', run: (io) => { const c = io.M.Finance.binomialOption(io.n('S'), io.n('K'), io.n('r'), io.n('v'), io.n('T'), 100, 'call'); return `call ${io.fmt(c)}`; } } ] },
    { id: 'rates', title: 'Rates & Compounding', blurb: 'CAGR, APY, doubling', inputs: [{ k: 'a', label: 'begin', def: '1000' }, { k: 'b', label: 'end', def: '2000' }, { k: 'n', label: 'periods', def: '7' }, { k: 'm', label: 'compounds/yr', def: '12' }], ops: [
      { name: 'CAGR (a→b over n)', run: (io) => io.fmt(io.M.Finance.cagr(io.n('a'), io.n('b'), io.n('n'))) },
      { name: 'total return %', run: (io) => io.fmt(((io.n('b') - io.n('a')) / io.n('a')) * 100) + ' %' },
      { name: 'effective APY (nom=CAGR, m)', run: (io) => io.fmt(io.M.Finance.effectiveRate(io.M.Finance.cagr(io.n('a'), io.n('b'), io.n('n')), io.n('m'))) },
      { name: 'continuous APY (nom=CAGR)', run: (io) => io.fmt(io.M.Finance.continuousRate(io.M.Finance.cagr(io.n('a'), io.n('b'), io.n('n')))) },
      { name: 'exact doubling time (yrs)', run: (io) => io.fmt(Math.log(2) / Math.log(1 + io.M.Finance.cagr(io.n('a'), io.n('b'), io.n('n')))) },
      { name: 'rule of 72 (yrs)', run: (io) => io.fmt(72 / (io.M.Finance.cagr(io.n('a'), io.n('b'), io.n('n')) * 100)) } ] },
    { id: 'bases', title: 'Bases & Bitwise', blurb: 'bin/oct/hex', inputs: [{ k: 'n', label: 'integer', def: '255' }, { k: 'm', label: 'integer 2', def: '170' }, { k: 'b', label: 'base (2-36)', def: '16' }], ops: [
      { name: 'to base b', run: (io) => io.M.Bits.toBase(Math.round(io.n('n')), Math.round(io.n('b'))) },
      { name: 'binary', run: (io) => io.M.Bits.toBinary(Math.round(io.n('n'))) },
      { name: 'octal', run: (io) => io.M.Bits.toOctal(Math.round(io.n('n'))) },
      { name: 'hex', run: (io) => io.M.Bits.toHex(Math.round(io.n('n'))) },
      { name: 'popcount', run: (io) => io.fmt(io.M.Bits.popcount(Math.round(io.n('n')))) },
      { name: 'bit length', run: (io) => io.fmt(io.M.Bits.bitLength(Math.round(io.n('n')))) },
      { name: 'Gray code', run: (io) => io.M.Bits.toBinary(io.M.Bits.grayEncode(Math.round(io.n('n')))) },
      { name: 'Hamming dist(n,m)', run: (io) => io.fmt(io.M.Bits.hammingDistance(Math.round(io.n('n')), Math.round(io.n('m')))) } ] },
    { id: 'sets', title: 'Sets & Logic', blurb: '∪ ∩ ∖ ⊆', inputs: [{ k: 'a', label: 'A', def: '1,2,3,4' }, { k: 'b', label: 'B', def: '3,4,5,6' }], ops: [
      { name: 'union', run: (io) => '{' + io.M.Sets.union(parseNums(io.s('a')), parseNums(io.s('b'))).join(', ') + '}' },
      { name: 'intersection', run: (io) => '{' + io.M.Sets.intersection(parseNums(io.s('a')), parseNums(io.s('b'))).join(', ') + '}' },
      { name: 'difference A∖B', run: (io) => '{' + io.M.Sets.difference(parseNums(io.s('a')), parseNums(io.s('b'))).join(', ') + '}' },
      { name: 'symmetric diff', run: (io) => '{' + io.M.Sets.symmetricDifference(parseNums(io.s('a')), parseNums(io.s('b'))).join(', ') + '}' },
      { name: 'Jaccard', run: (io) => io.fmt(io.M.Sets.jaccard(parseNums(io.s('a')), parseNums(io.s('b')))) },
      { name: 'A ⊆ B?', run: (io) => io.M.Sets.isSubset(parseNums(io.s('a')), parseNums(io.s('b'))) ? 'yes' : 'no' },
      { name: 'A ⊇ B?', run: (io) => io.M.Sets.isSuperset(parseNums(io.s('a')), parseNums(io.s('b'))) ? 'yes' : 'no' },
      { name: 'disjoint?', run: (io) => io.M.Sets.isDisjoint(parseNums(io.s('a')), parseNums(io.s('b'))) ? 'yes' : 'no' },
      { name: '|powerset A|', run: (io) => io.fmt(io.M.Sets.powerSet(io.M.Sets.unique(parseNums(io.s('a')))).length) } ] },
  ] },

  { name: 'IV · Applied · Engineering · Quantum', tiles: [
    { id: 'units', title: 'Unit Conversion', blurb: 'SI dimensional', inputs: [{ k: 'v', label: 'value', def: '100' }, { k: 'from', label: 'from', def: 'km' }, { k: 'to', label: 'to', def: 'mile' }], ops: [
      { name: 'convert', run: (io) => io.fmt(io.M.Units.convert(io.n('v'), io.s('from'), io.s('to'))) + ' ' + io.s('to') } ] },
    { id: 'coords', title: 'Coordinates', blurb: 'polar/spherical', inputs: [{ k: 'a', label: 'x / r', def: '3' }, { k: 'b', label: 'y / θ', def: '4' }, { k: 'c', label: 'z', def: '5' }], ops: [
      { name: 'cart→polar', run: (io) => { const p = io.M.Coordinates.cartesianToPolar(io.n('a'), io.n('b')); return `r = ${io.fmt(p.r)}  θ = ${io.fmt(p.theta)} rad`; } },
      { name: 'polar→cart', run: (io) => { const p = io.M.Coordinates.polarToCartesian(io.n('a'), io.n('b')); return `x = ${io.fmt(p[0])}  y = ${io.fmt(p[1])}`; } },
      { name: 'cart→spherical', run: (io) => { const p = io.M.Coordinates.cartesianToSpherical(io.n('a'), io.n('b'), io.n('c')); return `r = ${io.fmt(p.r)}  θ = ${io.fmt(p.theta)}  φ = ${io.fmt(p.phi)}`; } },
      { name: 'cart→cylindrical', run: (io) => { const p = io.M.Coordinates.cartesianToCylindrical(io.n('a'), io.n('b'), io.n('c')); return `ρ = ${io.fmt(p.rho)}  φ = ${io.fmt(p.phi)}  z = ${io.fmt(p.z)}`; } },
      { name: 'deg→rad', run: (io) => io.fmt(io.M.Coordinates.degToRad(io.n('a'))) },
      { name: 'rad→deg', run: (io) => io.fmt(io.M.Coordinates.radToDeg(io.n('a'))) } ] },
    { id: 'kinematics', title: 'Physics · Mechanics', blurb: 'gravity & orbits', inputs: [{ k: 'a', label: 'M (kg)', def: '5.972e24' }, { k: 'b', label: 'r (m)', def: '6.371e6' }], ops: [
      { name: 'escape velocity (M,r)', run: (io) => io.fmt(io.M.Physics.escapeVelocity(io.n('a'), io.n('b'))) + ' m/s' },
      { name: 'Schwarzschild r (M)', run: (io) => io.fmt(io.M.Physics.schwarzschildRadius(io.n('a'))) + ' m' },
      { name: 'grav. force (M,M,r)', run: (io) => io.fmt(io.M.Physics.gravitationalForce(io.n('a'), io.n('a'), io.n('b'))) + ' N' },
      { name: 'orbital period (a=r, M)', run: (io) => io.fmt(io.M.Physics.orbitalPeriod(io.n('b'), io.n('a'))) + ' s' },
      { name: 'surface gravity g (M,r)', run: (io) => io.fmt((6.674e-11 * io.n('a')) / (io.n('b') * io.n('b'))) + ' m/s²' } ] },
    { id: 'relativity', title: 'Physics · Relativity', blurb: 'γ, E=mc²', inputs: [{ k: 'v', label: 'velocity (m/s)', def: '2.5e8' }, { k: 'm', label: 'mass (kg)', def: '1' }, { k: 't', label: 'proper t₀ / L₀', def: '1' }], ops: [
      { name: 'Lorentz γ', run: (io) => io.fmt(io.M.Physics.lorentzFactor(io.n('v'))) },
      { name: 'rest energy E=mc²', run: (io) => io.fmt(io.M.Physics.restEnergy(io.n('m'))) + ' J' },
      { name: 'relativistic E', run: (io) => io.fmt(io.M.Physics.relativisticEnergy(io.n('m'), io.n('v'))) + ' J' },
      { name: 'time dilation Δt (t₀,v)', run: (io) => io.fmt(io.M.Physics.timeDilation(io.n('t'), io.n('v'))) + ' s' },
      { name: 'length contraction (L₀,v)', run: (io) => io.fmt(io.M.Physics.lengthContraction(io.n('t'), io.n('v'))) + ' m' } ] },
    { id: 'quantumph', title: 'Physics · Quantum', blurb: 'photon, H atom', inputs: [{ k: 'n', label: 'n / freq / p', def: '2' }, { k: 'b', label: 'λ(m) / θ(rad) / Δx(m)', def: '1.5708' }], ops: [
      { name: 'H energy level n', run: (io) => io.fmt(io.M.Physics.hydrogenEnergyLevel(io.n('n'))) + ' eV' },
      { name: 'photon E (freq Hz)', run: (io) => io.fmt(io.M.Physics.photonEnergy(io.n('n'))) + ' J' },
      { name: 'de Broglie λ (p)', run: (io) => io.fmt(io.M.Physics.deBroglieWavelength(io.n('n'))) + ' m' },
      { name: 'photon E from λ', run: (io) => io.fmt(io.M.Physics.photonEnergyFromWavelength(io.n('b'))) + ' J' },
      { name: 'Compton shift Δλ (θ)', run: (io) => io.fmt(io.M.Physics.comptonShift(io.n('b'))) + ' m' },
      { name: 'Heisenberg Δp (Δx)', run: (io) => io.fmt(io.M.Physics.heisenbergMomentum(io.n('b'))) + ' kg·m/s' } ] },
    { id: 'qcircuit', title: 'Quantum Lab', blurb: 'gate‑model sim', inputs: [{ k: 'n', label: 'qubits (GHZ)', def: '3' }], ops: [
      { name: 'Bell state', run: (io) => io.M.Circuit.bell().toKet() },
      { name: 'GHZ(n) ket', run: (io) => io.M.Circuit.ghz(Math.max(2, Math.round(io.n('n')))).toKet() },
      { name: 'GHZ(n) probs', run: (io) => io.M.Circuit.ghz(Math.max(2, Math.round(io.n('n')))).probabilities().map(io.fmt).join(', ') } ] },
    { id: 'fft', title: 'Signal · FFT', blurb: 'magnitude spectrum', inputs: [{ k: 'x', label: 'samples', def: '1,0,-1,0,1,0,-1,0' }], ops: [
      { name: 'FFT magnitude', run: (io) => io.M.Signal.magnitude(io.M.Signal.fft(parseNums(io.s('x')))).map(io.fmt).join(', ') },
      { name: 'phase spectrum', run: (io) => io.M.Signal.phase(io.M.Signal.fft(parseNums(io.s('x')))).map(io.fmt).join(', ') },
      { name: 'autocorrelation', run: (io) => io.M.Signal.autocorrelate(parseNums(io.s('x'))).map(io.fmt).join(', ') },
      { name: 'cross‑corr (x,x)', run: (io) => io.M.Signal.crossCorrelate(parseNums(io.s('x')), parseNums(io.s('x'))).map(io.fmt).join(', ') },
      { name: 'next pow2 of length', run: (io) => io.fmt(io.M.Signal.nextPow2(parseNums(io.s('x')).length)) } ] },
    { id: 'ode', title: 'ODE Lab', blurb: "y′=f(t,y)", inputs: [{ k: 'f', label: 'f(t,y)', def: 'cos(t) - y' }, { k: 'y0', label: 'y(0)', def: '0' }, { k: 't1', label: 't₁', def: '6' }], ops: [
      { name: 'y(t₁) via RK4', run: (io) => { const sol = io.M.Calculus.rk4(odeFn(io), 0, io.n('t1'), [io.n('y0')], 120); return `y(${io.fmt(io.n('t1'))}) = ${io.fmt(sol.y[sol.y.length - 1][0])}`; } },
      { name: 'y(t₁) via RKF45 (adaptive)', run: (io) => { const sol = io.M.Calculus.rkf45(odeFn(io), 0, io.n('t1'), [io.n('y0')]); return `y(${io.fmt(io.n('t1'))}) = ${io.fmt(sol.y[sol.y.length - 1][0])}  (${sol.t.length} steps)`; } } ] },
    { id: 'graph', title: 'Graphs', blurb: 'MST / paths', inputs: [{ k: 'n', label: 'vertices', def: '5' }, { k: 'e', label: 'edges u-v-w;…', def: '0-1-2;1-2-1;0-3-4;3-4-3;2-4-5' }], ops: [
      { name: 'MST weight (Kruskal)', run: (io) => mstWeight(io) },
      { name: 'connected components', run: (io) => io.fmt(io.M.Graph.connectedComponents(Math.round(io.n('n')), edgesOf(io)).length) },
      { name: 'Dijkstra dist 0→last', run: (io) => { const r = io.M.Graph.dijkstra(wadjOf(io), 0); const d = r.dist[r.dist.length - 1]; return `dist = ${Number.isFinite(d) ? io.fmt(d) : '∞ (unreachable)'}`; } },
      { name: 'BFS order from 0', run: (io) => io.M.Graph.bfs(adjOf(io), 0).order.join(' → ') } ] },
    { id: 'mensuration', title: 'Geometry · Mensuration', blurb: 'area & volume', inputs: [{ k: 'a', label: 'radius / a', def: '5' }, { k: 'b', label: 'height / b', def: '10' }], ops: [
      { name: 'circle area', run: (io) => io.R(`pi*(${io.s('a')})^2`) },
      { name: 'circle circumference', run: (io) => io.R(`2*pi*(${io.s('a')})`) },
      { name: 'sphere volume', run: (io) => io.R(`4/3*pi*(${io.s('a')})^3`) },
      { name: 'sphere surface', run: (io) => io.R(`4*pi*(${io.s('a')})^2`) },
      { name: 'cylinder volume', run: (io) => io.R(`pi*(${io.s('a')})^2*(${io.s('b')})`) },
      { name: 'cone volume', run: (io) => io.R(`1/3*pi*(${io.s('a')})^2*(${io.s('b')})`) },
      { name: 'triangle area ½·a·b', run: (io) => io.R(`1/2*(${io.s('a')})*(${io.s('b')})`) },
      { name: 'rect area a·b', run: (io) => io.R(`(${io.s('a')})*(${io.s('b')})`) } ] },
    { id: 'eecalc', title: 'Electrical Eng.', blurb: 'Ohm, power, RC', inputs: [{ k: 'V', label: 'V (volts)', def: '12' }, { k: 'R', label: 'R (ohms)', def: '100' }, { k: 'C', label: 'C (farads)', def: '1e-6' }], ops: [
      { name: 'current I = V/R', run: (io) => io.R(`(${io.s('V')})/(${io.s('R')})`) + ' A' },
      { name: 'power P = V²/R', run: (io) => io.R(`(${io.s('V')})^2/(${io.s('R')})`) + ' W' },
      { name: 'energy ½CV² (J)', run: (io) => io.R(`1/2*(${io.s('C')})*(${io.s('V')})^2`) + ' J' },
      { name: 'RC time const τ=RC (s)', run: (io) => io.R(`(${io.s('R')})*(${io.s('C')})`) + ' s' },
      { name: 'cutoff f=1/2πRC (Hz)', run: (io) => io.R(`1/(2*pi*(${io.s('R')})*(${io.s('C')}))`) + ' Hz' } ] },
    { id: 'everyday', title: 'Everyday & Health', blurb: 'BMI, tip, temp', inputs: [{ k: 'a', label: 'mass kg / bill / P / °', def: '70' }, { k: 'b', label: 'height m / % / r', def: '1.75' }, { k: 'c', label: '— / — / years', def: '10' }], ops: [
      { name: 'BMI (kg, m)', run: (io) => io.R(`(${io.s('a')})/(${io.s('b')})^2`) },
      { name: 'tip (bill, %)', run: (io) => io.fmt((io.n('a') * io.n('b')) / 100) },
      { name: 'compound (P, r, yrs)', run: (io) => io.fmt(io.n('a') * Math.pow(1 + io.n('b'), io.n('c'))) },
      { name: 'simple interest (P, r, yrs)', run: (io) => io.fmt(io.n('a') * io.n('b') * io.n('c')) },
      { name: '°C→°F (a)', run: (io) => io.fmt((io.n('a') * 9) / 5 + 32) + ' °F' },
      { name: '°F→°C (a)', run: (io) => io.fmt(((io.n('a') - 32) * 5) / 9) + ' °C' } ] },
  ] },
];

/* ============================================================= *
 *  Helpers used by ops (kept out of closures for clarity)
 * ============================================================= */

/** @param {IO} io @param {string} op */
function rat(io, op) {
    // Evaluate "a op b" through the parser (handles exact-rational display).
    return io.R(`(${io.s('a')}) ${op} (${io.s('b')})`);
}

/** @param {IO} io */
function quad(io) {
    const a = io.n('a'), b = io.n('b'), c = io.n('c');
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
        const s = Math.sqrt(disc);
        return `x₁ = ${io.fmt((-b + s) / (2 * a))}   x₂ = ${io.fmt((-b - s) / (2 * a))}`;
    }
    const re = -b / (2 * a), im = Math.sqrt(-disc) / (2 * a);
    return `x = ${io.fmt(re)} ± ${io.fmt(im)}i`;
}

/** Black–Scholes greeks formatted for a side. @param {IO} io @param {'call'|'put'} side */
function greekStr(io, side) {
    const g = io.M.Finance.greeks(io.n('S'), io.n('K'), io.n('r'), io.n('v'), io.n('T'), side);
    return `Δ ${io.fmt(g.delta)}  Γ ${io.fmt(g.gamma)}  ν ${io.fmt(g.vega)}  Θ ${io.fmt(g.theta)}  ρ ${io.fmt(g.rho)}`;
}

/** Wrap a single-var expression input as a JS function f(x). @param {IO} io @param {string} key @returns {(x:number)=>number} */
function fx(io, key) {
    const src = io.s(key);
    return (x) => {
        const r = io.M.compute(src, { x });
        return r.isMatrix ? NaN : r.value.re;
    };
}

/** Build the RK4/RKF45 system function from the f(t,y) input. @param {IO} io @returns {(t:number,y:number[])=>number[]} */
function odeFn(io) {
    const src = io.s('f');
    return (/** @type {number} */ t, /** @type {number[]} */ y) => [io.M.compute(src, { t, y: y[0] }).value.re];
}

/** Parse a matrix literal input. @param {IO} io @param {string} key @returns {number[][]} */
function matOf(io, key) {
    const r = io.M.compute(io.s(key));
    if (!r.isMatrix) throw new Error('enter a matrix literal, e.g. [[1,2],[3,4]]');
    return r.value;
}

/** Render a matrix (or scalar) value to a compact string. @param {any} v @returns {string} */
function matStr(v) {
    if (Array.isArray(v)) return '[' + v.map((row) => '[' + row.map(fnum).join(', ') + ']').join(', ') + ']';
    if (v && typeof v === 'object' && 're' in v) return cpx(v);
    return fnum(v);
}

/** Format a complex {re,im}. @param {{re:number,im:number}} z @returns {string} */
function cpx(z) {
    if (Math.abs(z.im) < 1e-12) return fnum(z.re);
    return `${fnum(z.re)} ${z.im < 0 ? '−' : '+'} ${fnum(Math.abs(z.im))}i`;
}

/** Parse "u-v-w;…" into [u,v,w] triples (for connectedComponents). @param {IO} io @returns {[number,number,number][]} */
function edgesOf(io) {
    return io.s('e').split(';').map((p) => p.split('-').map(Number)).filter((t) => t.length === 3).map((t) => /** @type {[number,number,number]} */([t[0], t[1], t[2]]));
}

/** Parse edges into {u,v,w} objects (the shape Graph.mst expects). @param {IO} io @returns {{u:number,v:number,w:number}[]} */
function edgeObjs(io) {
    return edgesOf(io).map(([u, v, w]) => ({ u, v, w }));
}

/** Build a weighted adjacency list {to,w}[][] for Dijkstra. @param {IO} io @returns {{to:number,w:number}[][]} */
function wadjOf(io) {
    const n = Math.round(io.n('n'));
    /** @type {{to:number,w:number}[][]} */
    const adj = Array.from({ length: n }, () => []);
    for (const [u, v, w] of edgesOf(io)) { adj[u].push({ to: v, w }); adj[v].push({ to: u, w }); }
    return adj;
}

/** Build a plain adjacency list number[][] for BFS. @param {IO} io @returns {number[][]} */
function adjOf(io) {
    const n = Math.round(io.n('n'));
    /** @type {number[][]} */
    const adj = Array.from({ length: n }, () => []);
    for (const [u, v] of edgesOf(io)) { adj[u].push(v); adj[v].push(u); }
    return adj;
}

/** @param {IO} io */
function mstWeight(io) {
    const r = io.M.Graph.mst(Math.round(io.n('n')), edgeObjs(io));
    return `weight = ${io.fmt(r.weight)} over ${r.edges.length} edges`;
}

/* ============================================================= *
 *  Renderer
 * ============================================================= */

/**
 * Mount the calculator suite into a container.
 * @param {any} math  the math/index namespace bundle
 * @param {HTMLElement} tabsHost  element to hold page tab buttons
 * @param {HTMLElement} gridHost  element to hold the 12‑tile grid
 */
export function initSuite(math, tabsHost, gridHost) {
    if (!tabsHost || !gridHost) return;
    let active = 0;

    /** @param {HTMLElement} resultEl @param {Tile} tile @param {HTMLSelectElement|null} sel @param {Record<string,HTMLInputElement>} fields */
    const runTile = (resultEl, tile, sel, fields) => {
        const op = tile.ops[sel ? sel.selectedIndex : 0];
        /** @type {IO} */
        const io = {
            M: math,
            n: (k) => parseFloat(fields[k]?.value ?? ''),
            nums: (k) => parseNums(fields[k]?.value ?? ''),
            s: (k) => fields[k]?.value ?? '',
            R: (expr) => math.compute(expr).display,
            fmt: fnum,
        };
        try {
            resultEl.textContent = '= ' + op.run(io);
            resultEl.classList.remove('stile-err');
        } catch (e) {
            resultEl.textContent = '⚠ ' + (e instanceof Error ? e.message : String(e));
            resultEl.classList.add('stile-err');
        }
    };

    const renderPage = () => {
        gridHost.replaceChildren();
        const page = PAGES[active];
        for (const tile of page.tiles) {
            const card = document.createElement('div');
            card.className = 'stile';
            const h = document.createElement('h3'); h.className = 'stile-title'; h.textContent = tile.title;
            const blurb = document.createElement('span'); blurb.className = 'stile-blurb'; blurb.textContent = tile.blurb;
            card.append(h, blurb);

            /** @type {HTMLSelectElement|null} */
            let sel = null;
            if (tile.ops.length > 1) {
                sel = document.createElement('select');
                sel.className = 'stile-op';
                sel.setAttribute('aria-label', `${tile.title} operation`);
                for (const op of tile.ops) { const o = document.createElement('option'); o.textContent = op.name; sel.appendChild(o); }
                card.appendChild(sel);
            }

            /** @type {Record<string,HTMLInputElement>} */
            const fields = {};
            for (const f of tile.inputs) {
                const wrap = document.createElement('label'); wrap.className = 'stile-field';
                wrap.textContent = f.label;
                const inp = document.createElement('input');
                inp.type = 'text'; inp.value = f.def; inp.spellcheck = false;
                inp.setAttribute('aria-label', `${tile.title} ${f.label}`);
                wrap.appendChild(inp); card.appendChild(wrap); fields[f.k] = inp;
            }

            const result = document.createElement('output'); result.className = 'stile-result'; result.setAttribute('aria-live', 'polite');
            const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'stile-run'; btn.textContent = 'Run';
            const fieldSel = sel;
            btn.addEventListener('click', () => runTile(result, tile, fieldSel, fields));
            if (sel) sel.addEventListener('change', () => runTile(result, tile, fieldSel, fields));
            for (const k in fields) fields[k].addEventListener('keydown', (ev) => { if (ev.key === 'Enter') runTile(result, tile, fieldSel, fields); });

            card.append(btn, result);
            gridHost.appendChild(card);
        }
    };

    PAGES.forEach((page, i) => {
        const t = document.createElement('button');
        t.type = 'button'; t.className = 'suite-tab'; t.textContent = page.name;
        t.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
        t.addEventListener('click', () => {
            active = i;
            [...tabsHost.children].forEach((c, j) => c.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
            renderPage();
        });
        tabsHost.appendChild(t);
    });

    renderPage();
}

/** Total operation count across the registry (for stats/docs). @returns {number} */
export function suiteOpCount() {
    return PAGES.reduce((n, p) => n + p.tiles.reduce((m, t) => m + t.ops.length, 0), 0);
}
/** Total tile count. @returns {number} */
export function suiteTileCount() {
    return PAGES.reduce((n, p) => n + p.tiles.length, 0);
}
/** Page count. @returns {number} */
export function suitePageCount() {
    return PAGES.length;
}
/**
 * Introspection: the full page → tile → operation tree (no DOM). Used by the
 * docs generator and the suite test to assert the registry shape.
 * @returns {{ page:string, tiles:{ id:string, title:string, blurb:string, inputs:string[], ops:string[] }[] }[]}
 */
export function suiteManifest() {
    return PAGES.map((p) => ({
        page: p.name,
        tiles: p.tiles.map((t) => ({
            id: t.id, title: t.title, blurb: t.blurb,
            inputs: t.inputs.map((f) => f.label),
            ops: t.ops.map((o) => o.name),
        })),
    }));
}
