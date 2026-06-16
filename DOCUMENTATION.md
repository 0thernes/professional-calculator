<div align="center">

# DOCUMENTATION — How to use the Professional Calculator

**The instruction manual.** Start here if you just want to *use* the calculator.

`Engine v3.25.0` · `Suite: 4 pages · 48 mini‑calculators · 257 operations`

</div>

> **Sub‑domain page set.** Reference pages ship with the app and cross‑link:
> [ARCHITECTURE](docs/ARCHITECTURE.md) (how it's built) ·
> [SPECS](SPECS.md) (the full operation catalog + benchmark) ·
> **DOCUMENTATION** (how to use it — *this page*) ·
> [STUDY ATLAS](docs/MATH_STUDY_ATLAS.md) (617 courses/topics to learn, UG→PhD).

---

## Table of contents

1. [The 30‑second tour](#1-the-30-second-tour)
2. [The Calculator Suite — using a tile](#2-the-calculator-suite)
3. [Input formats (read this once)](#3-input-formats)
4. [Page‑by‑page walkthrough](#4-page-by-page-walkthrough)
5. [Worked examples](#5-worked-examples)
6. [The live engine labs](#6-the-live-engine-labs)
7. [Keyboard & accessibility](#7-keyboard--accessibility)
8. [Troubleshooting](#8-troubleshooting)
9. [FAQ](#9-faq)
10. [Extending the suite](#10-extending-the-suite)

---

## 1. The 30‑second tour

Open `index.html` (or run the dev server — see [README](README.md)). The page is
organized top‑to‑bottom:

1. **Calculator Suite** — a grid of 48 mini‑calculators across 4 tabbed pages.
   This is where most work happens.
2. **Expression Engine** — a full scientific REPL for free‑form expressions.
3. **Live labs** — Linear Algebra, STEM visualizer, Quantum, Signal/FFT, Finance,
   Plot Studio, ODE Lab.
4. **Quick Pad** — a simple 4‑function keypad for fast arithmetic.

Nothing to install, no account, no network. Everything runs locally.

---

## 2. The Calculator Suite

Each **tile** is a self‑contained calculator. The anatomy:

```
┌─────────────────────────────────┐
│ Root Finder        solve f(x)=0 │  ← title + blurb (what it does)
│ ┌─────────────────────────────┐ │
│ │ Newton (x₀=a)            ▾  │ │  ← operation dropdown (pick the calculation)
│ └─────────────────────────────┘ │
│ f(x)   [ x*x - 2            ]    │  ← input fields (labeled)
│ a / x₀ [ 1                 ]    │
│ b / x₁ [ 2                 ]    │
│ [ Run ]                         │  ← run button
│ = 1.4142136                     │  ← result (green) or ⚠ reason (red)
└─────────────────────────────────┘
```

**To use any tile:**

1. **Pick a page** — click a tab (`I · Core & Algebra`, `II · Calculus & Linear
   Algebra`, `III · Probability, Stats & Finance`, `IV · Applied · Engineering ·
   Quantum`).
2. **Pick the operation** from the tile's dropdown (tiles with one operation have
   no dropdown).
3. **Edit the inputs** — they come pre‑filled with sensible defaults so you can
   see a working result immediately.
4. **Run it** — click **Run**, or press **Enter** in any field. Changing the
   dropdown also re‑runs.
5. **Read the result** — a green `= …` line, or a red `⚠ …` line explaining what
   went wrong (e.g. a bad input).

The grid reflows automatically: many columns on a wide screen, a single column on
a phone. No setting to change.

---

## 3. Input formats

Most mistakes come from input format. There are exactly five kinds:

| Kind | Looks like | Used by | Notes |
|---|---|---|---|
| **Number** | `3.14`, `-2`, `5.972e24`, `1e-6` | most fields | Scientific `e` notation is fine. |
| **Expression** | `2+3*4^2`, `sin(pi/4)`, `3+4i` | Scientific, Powers, Trig, Complex, Mensuration, EE | Goes through the parser — use `pi`, `e`, `^`, function calls. |
| **List** | `4,8,15,16,23,42` | stats, vectors, signals, polynomials | Comma **or** space separated. |
| **Matrix** | `[[2,1],[1,3]]` | Matrix, Eigen, Linear Solve | Rows in brackets; a column vector is `[[1],[2]]`. |
| **Edge list** | `0-1-2;1-2-1;0-3-4` | Graphs | `u-v-w` (from‑to‑weight), separated by `;`. |

**Function‑of‑x fields** (Derivative, Integral, Root Finder, Optimization, ODE)
take an **expression in `x`** (or `t,y` for the ODE): e.g. `x*x - 2`, `sin(x)`,
`4/(1+x*x)`, `cos(t) - y`.

**Parser cheat‑sheet** (anything you can type in the Expression Engine works in
expression fields):

```
operators   + - * / ^   ! (factorial)   |z| (abs)
constants   pi  e  i (imaginary unit)
powers      sqrt cbrt exp ln log10 log2 log(x,b)
trig        sin cos tan asin acos atan  sinh cosh tanh asinh acosh atanh
rounding    floor ceil round sign abs hypot atan2 mod
combinator. nCr(n,k)  nPr(n,k)  gamma erf erfc
complex     re im arg conj      (e.g. conj(3+4i))
```

> `sec`, `csc`, `cot` are not parser built‑ins — the Trigonometry tile computes
> them as `1/cos`, `1/sin`, `1/tan` for you.

---

## 4. Page‑by‑page walkthrough

For the exhaustive list of every operation see [SPECS § 3](SPECS.md#3-operation-catalog).
Quick orientation:

- **Page I · Core & Algebra** — the everyday scientific calculator plus exact
  rationals, a quadratic solver, a symbolic differentiator/integrator, series
  sums, and percentages.
- **Page II · Calculus & Linear Algebra** — numeric derivatives/integrals, four
  root‑finders, optimization, the full matrix toolkit (det → SVD → pseudo‑inverse),
  linear solving, vector geometry, number theory, combinatorics, interpolation,
  and special functions.
- **Page III · Probability, Stats & Finance** — descriptive stats, continuous and
  discrete distributions, hypothesis tests (t / ANOVA / χ²) and regression,
  combinatorial probability, the full finance stack (TVM, NPV/IRR,
  Black–Scholes + Greeks, CAGR/APY), bases & bitwise, and set theory.
- **Page IV · Applied · Engineering · Quantum** — unit conversion, coordinate
  systems, three physics tiles (mechanics, relativity, quantum), a quantum‑circuit
  simulator, FFT, ODE integration, graph algorithms, mensuration, electrical
  engineering, and everyday/health math.

---

## 5. Worked examples

**Solve x² = 2 (Page II → Root Finder).** Defaults already do it: `f(x)=x*x-2`,
`a=1`, `b=2`, operation *Brent* → `= 1.4142136`. Try *Newton* and *secant* — same
root, different method.

**Price a call option (Page III → Black–Scholes).** `spot=100, strike=100,
rate=0.05, σ=0.2, T=1`, operation *price call/put* → `call 10.45  put 5.57`. Switch
to *Greeks (call)* for Δ Γ ν Θ ρ.

**Two‑sample t‑test (Page III → Hypothesis Tests).** `A = 5,6,7,8,9` and
`B = 7,8,9,10,11`, operation *two‑sample t (Welch)* → `t = -2  df = 8  p = 0.0805`.

**Shortest path in a graph (Page IV → Graphs).** Defaults
`vertices=5`, `edges=0-1-2;1-2-1;0-3-4;3-4-3;2-4-5`, operation *Dijkstra dist
0→last* → `dist = 7`. *MST weight (Kruskal)* → `weight = 10 over 4 edges`.

**A Bell state (Page IV → Quantum Lab).** Operation *Bell state* →
`(|00⟩ + |11⟩)/√2`. *GHZ(n) ket* with `qubits=3` → the 3‑qubit GHZ state.

**Convert 100 km to miles (Page IV → Unit Conversion).** `value=100, from=km,
to=mile` → `≈ 62.137 mile`. (Use full unit names like `mile`, `km`, `m`, `s`.)

---

## 6. The live engine labs

Below the suite are panels that run the engine *continuously*:

- **Expression Engine** — type any expression and press Enter; click palette chips
  to insert examples. Handles ℂ, matrices, CAS, and number theory.
- **Linear Algebra Lab** — edit a matrix literal and click det/eigenvalues/SVD/…
- **STEM Visualizer** — animated plots; **←/→** arrow keys page through them.
- **Quantum Lab** — apply gates, watch the Bloch sphere and probability bars.
- **Signal · FFT** — paste samples, get the magnitude spectrum; load presets.
- **Quant Finance** — Black–Scholes price + Greeks.
- **Plot Studio / ODE Lab** — plot `f(x)` or integrate `y′=f(t,y)`.

---

## 7. Keyboard & accessibility

- **Enter** in any suite field runs that tile.
- **←/→** page the STEM visualizer (when focus isn't in a text field).
- Every result is an `aria-live="polite"` region — screen readers announce it.
- Every input and dropdown has an `aria-label`; tabs expose `aria-pressed`.
- The UI passes an automated **axe‑core** accessibility audit in the test suite.
- Color is never the only signal: errors are prefixed `⚠` as well as colored.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `⚠ enter a matrix literal, e.g. [[1,2],[3,4]]` | Matrix field got a scalar/list | Use double brackets: `[[2,1],[1,3]]`. |
| `⚠ Unknown unit '…'` | Abbreviation not recognized | Use full names: `mile` not `mi`, `km`, `m`, `s`, `kg`. |
| `⚠ newton: zero derivative` | Newton started where f′=0 | Change the start point `a` to a nearby value. |
| `⚠ Unknown function 'sec'` | Typed a non‑built‑in in an expression | Use `1/cos(x)`; see the parser cheat‑sheet. |
| Result is `∞` | Genuine overflow (e.g. `10^1000`) | Expected — the value exceeds double precision. |
| A list op ignores some entries | Non‑numeric tokens are dropped | Check separators are commas/spaces, not letters. |
| The suite area is empty | Engine modules failed to load | Check the browser console; the 4‑function Quick Pad still works. |

---

## 9. FAQ

**Is my data sent anywhere?** No. Zero network calls, zero runtime dependencies.
Everything computes locally in your browser.

**Why no `eval`?** Security. Expressions are parsed by a hand‑written Pratt parser
and walked — there is no JavaScript injection surface.

**How accurate is it?** Every routine is anchored to closed‑form values in a
1,123‑test suite. See [SPECS § 7](SPECS.md#7-numerical-accuracy-contract).

**Can it replace my TI‑89 / Casio for exams?** For *computation*, it matches or
exceeds them across most domains (see [SPECS § 5](SPECS.md#5-competitive-benchmark)).
For *proctored exams* you still need the sanctioned hardware — a web app isn't an
exam‑legal device, and full symbolic CAS / interactive graphing remain the
handhelds' strengths.

**Where's the full feature list?** [SPECS.md](SPECS.md) — all 257 operations.

---

## 10. Extending the suite

Adding a calculator means adding a data row to `PAGES` in `suite.js` — no renderer
changes. A tile is:

```js
{ id: 'mytile', title: 'My Calculator', blurb: 'short description',
  inputs: [{ k: 'x', label: 'x', def: '1' }, { k: 'y', label: 'y', def: '2' }],
  ops: [
    { name: 'x + y', run: (io) => io.fmt(io.n('x') + io.n('y')) },
    { name: 'as expression', run: (io) => io.R(`(${io.s('x')}) + (${io.s('y')})`) },
  ] }
```

The `io` helper passed to every `run`:

| `io.…` | Returns |
|---|---|
| `io.n('k')` | input `k` as a number |
| `io.nums('k')` | input `k` parsed as a number list |
| `io.s('k')` | input `k` as a raw string |
| `io.R(expr)` | evaluate `expr` through the engine, formatted for display |
| `io.fmt(x)` | format a number compactly |
| `io.M` | the whole `math/` engine namespace (`io.M.Stats.mean(...)`, etc.) |

**Verify after editing:**

```bash
npx tsc --noEmit          # types
npx eslint suite.js       # lint
npm test                  # 1,123-test suite incl. the suite registry checks
```

**Regenerate the operation catalog** (the tables in SPECS § 3 come from here):

```bash
node -e "import('./suite.js').then(s=>{const m=s.suiteManifest();\
console.log('pages',m.length,'tiles',s.suiteTileCount(),'ops',s.suiteOpCount());\
for(const p of m){console.log('\n## '+p.page);for(const t of p.tiles)\
console.log('- '+t.title+': '+t.ops.join(' · '))}})"
```

---

<div align="center">

*Questions about how it's built? → [ARCHITECTURE](docs/ARCHITECTURE.md). *
*Want the full capability list? → [SPECS](SPECS.md).*

</div>
