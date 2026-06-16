<div align="center">

# Mathematics Study Atlas — Undergrad → PhD

**A deduplicated catalog of 617 courses, topics, and research areas across all of mathematics**, organized by domain → subdomain, leveled from undergraduate to doctoral, and grounded in the curricula of the world's top-100 research mathematics departments.

`617 unique entries · 21 domains · 190 subdomains · no repeats`

</div>

> **Sub-domain page set.** Part of the documentation that ships with the app:
> [ARCHITECTURE](ARCHITECTURE.md) · [SPECS](../SPECS.md) (the 257-operation suite catalog) · [DOCUMENTATION](../DOCUMENTATION.md) (how to use the suite) · **Study Atlas** (what to learn — *this page*).

---

## What this is

The [Calculator Suite](../SPECS.md) operationalizes mathematics; this atlas *maps* it. Every domain below corresponds to a region of the suite and the `math/` engine — and, per the project knowledge blueprint (`super_math_calculator_rag_blueprint.xml`), each is meant to get its own learn/help surface. The list answers a single question: **"what are all the areas of math one can study, from a first proof course to a doctoral topics seminar, without repeating anything?"**

- **Scope.** Undergraduate core → advanced undergraduate → graduate core → PhD/research topics.
- **Source.** The 21-domain / 190-subdomain taxonomy of the project knowledge blueprint, cross-referenced against the published course catalogs of leading research departments (Harvard, MIT, Princeton, Stanford, Berkeley, Chicago, Columbia, Cambridge, Oxford, ETH Zürich, Bonn, Paris/IHÉS, Tokyo, and peers).
- **No repeats.** Every entry is globally unique (case/punctuation-insensitive); a two-course sequence (e.g. *Real Analysis I* / *II*) is kept only where departments genuinely split it.

**Level legend** — `UG` undergraduate · `UG/Grad` advanced-UG / early-grad · `Grad` graduate core · `PhD` doctoral topics & research.

---

## Domain index

| # | Domain | Tier | Entries |
|---|---|---|---:|
| I | [Foundations, Logic, and Proof Systems](#i-foundations-logic-and-proof-systems) | `foundational` | 23 |
| II | [Number Systems and Arithmetic Substrates](#ii-number-systems-and-arithmetic-substrates) | `foundational` | 18 |
| III | [Number Theory and Arithmetic Geometry](#iii-number-theory-and-arithmetic-geometry) | `pure-applied-bridge` | 22 |
| IV | [Algebra: Structures, Symmetries, and Representations](#iv-algebra-structures-symmetries-and-representations) | `core-pure` | 34 |
| V | [Geometry: Shape, Space, Curvature, and Measurement](#v-geometry-shape-space-curvature-and-measurement) | `core-pure-applied` | 41 |
| VI | [Topology: Continuity, Holes, Manifolds, and Invariants](#vi-topology-continuity-holes-manifolds-and-invariants) | `core-pure-applied` | 31 |
| VII | [Analysis, Calculus, and Function Spaces](#vii-analysis-calculus-and-function-spaces) | `core-pure-applied` | 33 |
| VIII | [Differential Equations, Dynamical Systems, and Chaos](#viii-differential-equations-dynamical-systems-and-chaos) | `core-applied-research` | 27 |
| IX | [Probability, Statistics, and Inference](#ix-probability-statistics-and-inference) | `core-applied-research` | 34 |
| X | [Optimization, Control, Operations Research, and Game Theory](#x-optimization-control-operations-research-and-game-theory) | `core-applied-research` | 25 |
| XI | [Discrete Mathematics, Combinatorics, and Graph Theory](#xi-discrete-mathematics-combinatorics-and-graph-theory) | `core-pure-applied` | 26 |
| XII | [Numerical and Computational Mathematics](#xii-numerical-and-computational-mathematics) | `core-computational` | 27 |
| XIII | [Symbolic Computation and Automated Reasoning](#xiii-symbolic-computation-and-automated-reasoning) | `core-computational` | 24 |
| XIV | [Mathematical Physics, Cosmology, and Astronomy](#xiv-mathematical-physics-cosmology-and-astronomy) | `applied-research` | 30 |
| XV | [Engineering Mathematics, Signals, Systems, and Control](#xv-engineering-mathematics-signals-systems-and-control) | `applied-engineering` | 21 |
| XVI | [Quantitative Finance, Economics, and Risk Engineering](#xvi-quantitative-finance-economics-and-risk-engineering) | `applied-financial` | 24 |
| XVII | [Cryptography, Security Mathematics, and Coding Theory](#xvii-cryptography-security-mathematics-and-coding-theory) | `applied-computational-security` | 31 |
| XVIII | [AI, Machine Learning, Data Science, and Learning Theory](#xviii-ai-machine-learning-data-science-and-learning-theory) | `applied-computational-research` | 47 |
| XIX | [Computer Science, Algorithms, and Complexity](#xix-computer-science-algorithms-and-complexity) | `applied-computational-foundational` | 35 |
| XX | [Applied Sciences, Biology, Networks, and Social Systems](#xx-applied-sciences-biology-networks-and-social-systems) | `applied-science` | 31 |
| XXI | [Meta-Mathematics, Modeling, Pedagogy, and Knowledge Systems](#xxi-meta-mathematics-modeling-pedagogy-and-knowledge-systems) | `meta` | 33 |
| | **Total** | | **617** |

---

## I · Foundations, Logic, and Proof Systems

*Tier: `foundational` · 23 entries*

### Symbolic Logic

- **Introduction to Logic and Set Theory** — `UG` · course
- **Mathematical Logic** — `UG` · course
- **Gödel's Incompleteness Theorems** — `UG/Grad` · topic
- **Symbolic Logic** — `UG` · course

### Modal, Temporal, and Deontic Logic

- **Modal Logic** — `UG/Grad` · course
- **Provability Logic** — `Grad` · topic
- **Temporal Logic and Reactive Systems** — `Grad` · topic

### Proof Theory

- **Proof Theory** — `Grad` · course
- **Reverse Mathematics** — `Grad` · course
- **Ordinal Analysis and Cut Elimination** — `PhD` · topic

### Model Theory

- **Model Theory** — `Grad` · course
- **O-minimality and Tame Geometry** — `PhD` · area
- **Stability Theory** — `PhD` · topic

### Set Theory

- **Axiomatic Set Theory** — `Grad` · course
- **Descriptive Set Theory** — `PhD` · area
- **Forcing and Independence Proofs** — `PhD` · topic
- **Large Cardinals and Determinacy** — `PhD` · area

### Type Theory

- **Type Theory and Lambda Calculus** — `UG/Grad` · course
- **Homotopy Type Theory** — `Grad` · course

### Computability and Recursion

- **Computability Theory** — `UG/Grad` · course
- **Degrees of Unsolvability and the Turing Degrees** — `PhD` · topic

### Formal Verification

- **Curry-Howard Correspondence and Proof Assistants** — `Grad` · topic
- **Interactive Theorem Proving and Formalized Mathematics** — `Grad` · course

---

## II · Number Systems and Arithmetic Substrates

*Tier: `foundational` · 18 entries*

### Classical Number Systems

- **Construction of the Real Numbers via Dedekind Cuts and Cauchy Sequences** — `UG` · topic
- **Elementary Number Theory** — `UG` · course
- **Analytic Number Theory** — `UG/Grad` · course

### Algebraic Numbers

- **Algebraic Number Theory** — `Grad` · course
- **Class Field Theory** — `Grad` · course
- **Iwasawa Theory** — `PhD` · topic

### Finite Fields

- **Galois Theory** — `UG` · course
- **Coding Theory** — `UG/Grad` · course
- **Finite Fields and Their Applications** — `UG/Grad` · course

### p-adic Numbers

- **Local Fields** — `Grad` · course
- **p-adic Numbers and p-adic Analysis** — `Grad` · course
- **p-adic Hodge Theory** — `PhD` · topic

### Hyperreal, Surreal, and Infinitesimal Systems

- **Surreal Numbers and Combinatorial Game Theory** — `UG/Grad` · topic
- **Nonstandard Analysis** — `Grad` · course

### Quaternionic and Clifford Arithmetic

- **Quaternions and Rotations** — `UG` · topic
- **Clifford Algebras and Spinors** — `Grad` · course

### Interval and Ball Arithmetic

- **Interval Arithmetic and Rigorous Numerics** — `UG/Grad` · topic
- **Validated Numerics and Computer-Assisted Proofs** — `Grad` · course

---

## III · Number Theory and Arithmetic Geometry

*Tier: `pure-applied-bridge` · 22 entries*

### Elementary Number Theory

- **Quadratic Reciprocity and Gaussian Sums** — `UG` · topic

### Analytic Number Theory

- **Sieve Methods** — `Grad` · topic
- **The Prime Number Theorem via the Riemann Zeta Function** — `Grad` · topic
- **Sieve Theory** — `Grad` · course

### Algebraic Number Theory

- **Local Fields and Ramification Theory** — `Grad` · topic
- **Motivic Cohomology** — `PhD` · topic

### Diophantine Geometry

- **Diophantine Geometry** — `Grad` · course
- **Heights and the Mordell-Weil Theorem** — `Grad` · topic
- **Faltings' Theorem and the Mordell Conjecture** — `PhD` · area
- **Arakelov Geometry and Heights** — `PhD` · topic
- **Arithmetic Dynamics** — `PhD` · area

### Modular and Automorphic Forms

- **Modular Forms** — `Grad` · course
- **The Eichler-Shimura Relation and Hecke Operators** — `Grad` · topic
- **Automorphic Forms and the Langlands Program** — `PhD` · area
- **The Langlands Program** — `PhD` · area

### Elliptic Curves

- **Elliptic Curves** — `UG/Grad` · course
- **Arithmetic of Elliptic Curves and the Birch-Swinnerton-Dyer Conjecture** — `PhD` · area
- **Galois Representations** — `PhD` · topic

### Computational Number Theory

- **Computational Number Theory** — `UG/Grad` · course
- **Primality Testing and Integer Factorization Algorithms** — `UG/Grad` · topic

### Additive and Combinatorial Number Theory

- **Additive Combinatorics** — `Grad` · course
- **The Hardy-Littlewood Circle Method** — `Grad` · topic

---

## IV · Algebra: Structures, Symmetries, and Representations

*Tier: `core-pure` · 34 entries*

### Linear Algebra

- **Jordan Canonical Form and Spectral Theory** — `UG` · topic
- **Linear Algebra** — `UG` · course
- **Linear Algebra and Applications (Honors)** — `UG` · course

### Multilinear Algebra and Tensors

- **Exterior Algebra and Determinants** — `UG/Grad` · topic
- **Multilinear Algebra and Tensor Products** — `UG/Grad` · topic

### Group Theory

- **Abstract Algebra I: Groups** — `UG` · course
- **Group Theory and Sylow Theorems** — `UG` · topic
- **Finite Group Theory** — `Grad` · course
- **Geometric Group Theory** — `PhD` · area

### Ring Theory

- **Abstract Algebra II: Rings and Modules** — `UG` · course
- **Modules over Principal Ideal Domains** — `UG/Grad` · topic

### Field Theory and Galois Theory

- **Field Theory and Galois Theory** — `UG/Grad` · course
- **Inverse Galois Problem** — `PhD` · area

### Commutative Algebra

- **Commutative Algebra** — `Grad` · course
- **Homological Methods in Commutative Algebra** — `PhD` · topic
- **Cluster Algebras** — `PhD` · topic

### Noncommutative Algebra

- **Noncommutative Rings and Algebras** — `Grad` · course
- **Hopf Algebras and Quantum Groups** — `PhD` · area
- **Vertex Operator Algebras** — `PhD` · topic

### Representation Theory

- **Representation Theory of Finite Groups** — `UG/Grad` · course
- **Representation Theory** — `Grad` · course
- **Geometric Representation Theory** — `PhD` · area

### Lie Theory

- **Lie Groups and Lie Algebras** — `Grad` · course
- **Representations of Semisimple Lie Algebras** — `Grad` · topic
- **Kac-Moody Algebras** — `PhD` · area

### Homological Algebra

- **Homological Algebra** — `Grad` · course
- **Derived Categories and Triangulated Categories** — `PhD` · topic
- **Higher Category Theory and Infinity-Categories** — `PhD` · area
- **Spectral Sequences** — `PhD` · topic

### Universal Algebra

- **Universal Algebra and Lattice Theory** — `UG/Grad` · course
- **Category Theory** — `Grad` · course
- **Varieties and Equational Logic** — `Grad` · topic
- **Topos Theory** — `PhD` · topic
- **Operads and Higher Algebra** — `PhD` · topic

---

## V · Geometry: Shape, Space, Curvature, and Measurement

*Tier: `core-pure-applied` · 41 entries*

### Euclidean, Plane, and Solid Geometry

- **Axiomatic Foundations of Geometry (Hilbert's Axioms)** — `UG` · topic
- **College Geometry (Euclidean Geometry)** — `UG` · course
- **Polytopes and Solid Geometry** — `UG` · topic

### Plane and Spherical Trigonometry

- **Plane and Spherical Trigonometry** — `UG` · course
- **Spherical Law of Cosines and Geodesy** — `UG` · topic

### Affine and Projective Geometry

- **Affine and Euclidean Transformation Groups** — `UG` · topic
- **Conics and the Cross-Ratio** — `UG` · topic
- **Projective Geometry** — `UG/Grad` · course

### Analytic and Coordinate Geometry

- **Analytic Geometry (Coordinate Geometry)** — `UG` · course
- **Quadric Surfaces and Conic Sections** — `UG` · topic

### Differential Geometry

- **Differential Geometry of Curves and Surfaces** — `UG/Grad` · course
- **Riemannian Geometry** — `Grad` · course
- **Smooth Manifolds and de Rham Cohomology** — `Grad` · course
- **Comparison Geometry and Ricci Curvature** — `PhD` · topic
- **Geometric Analysis** — `PhD` · area
- **Ricci Flow and Geometric Analysis** — `PhD` · course
- **Minimal Surfaces** — `PhD` · topic

### Curvature for Curves and Surfaces

- **Geodesics, Frenet Frames, and the Gauss-Bonnet Theorem** — `UG/Grad` · topic
- **Theorema Egregium and Gaussian Curvature** — `UG/Grad` · topic
- **Ricci Flow and Geometric Evolution Equations** — `PhD` · area

### Symplectic and Contact Geometry

- **Symplectic Geometry and Topology** — `Grad` · course
- **Contact Geometry and Legendrian Submanifolds** — `PhD` · topic
- **Floer Homology and Pseudoholomorphic Curves** — `PhD` · area
- **Floer Homology and Symplectic Topology** — `PhD` · topic

### Algebraic Geometry

- **Introduction to Algebraic Geometry (Varieties)** — `UG/Grad` · course
- **Algebraic Geometry II: Schemes and Cohomology** — `Grad` · course
- **Riemann Surfaces and Algebraic Curves** — `Grad` · course
- **Schemes and Sheaf Cohomology** — `Grad` · course
- **Etale Cohomology** — `PhD` · topic
- **Hodge Theory** — `PhD` · topic
- **Motivic Cohomology and Motives** — `PhD` · area
- **Tropical Geometry** — `PhD` · area
- **Intersection Theory** — `PhD` · course
- **Moduli Spaces and Deformation Theory** — `PhD` · course
- **Geometric Invariant Theory** — `PhD` · topic
- **Mirror Symmetry** — `PhD` · area

### Convex Geometry

- **Convex Polytopes and Linear Programming Duality** — `UG/Grad` · topic
- **Convex Bodies and the Brunn-Minkowski Inequality** — `Grad` · course

### Computational Geometry

- **Computational Geometry (Algorithms and Data Structures)** — `UG/Grad` · course
- **Voronoi Diagrams and Delaunay Triangulations** — `UG/Grad` · topic

### Non-Euclidean Geometry

- **Hyperbolic Geometry and the Poincare Disk Model** — `UG/Grad` · course

---

## VI · Topology: Continuity, Holes, Manifolds, and Invariants

*Tier: `core-pure-applied` · 30 entries*

### Basic Topology

- **Introduction to Topology** — `UG` · course
- **The Fundamental Group and Covering Spaces** — `UG/Grad` · topic

### Point-Set Topology

- **Point-Set Topology** — `UG` · course
- **Metrization Theorems and Paracompactness** — `UG/Grad` · topic

### Algebraic Topology

- **Algebraic Topology I** — `Grad` · course
- **Algebraic Topology II** — `Grad` · course
- **Singular Homology and Cohomology** — `Grad` · topic
- **Spectral Sequences and the Serre Spectral Sequence** — `PhD` · topic
- **Stable Homotopy Theory** — `PhD` · area
- **Combinatorial Topology** — `Grad` · topic
- **Algebraic K-Theory** — `PhD` · area

### Differential Topology

- **Differential Topology** — `Grad` · course
- **Morse Theory** — `Grad` · course
- **Cobordism and the Pontryagin-Thom Construction** — `PhD` · topic
- **Surgery Theory and h-Cobordism** — `PhD` · topic

### Piecewise Linear Topology

- **Piecewise Linear Topology** — `Grad` · course
- **Simplicial Complexes and the Hauptvermutung** — `PhD` · topic

### Low-Dimensional Topology

- **Three-Manifolds and Geometric Structures** — `Grad` · course
- **Four-Manifolds and Gauge Theory** — `PhD` · topic
- **Heegaard Floer Homology** — `PhD` · area
- **Teichmuller Theory** — `PhD` · topic

### Knot Theory

- **Knot Theory** — `UG/Grad` · course
- **Khovanov Homology** — `PhD` · topic

### Fiber Bundles and Characteristic Classes

- **Characteristic Classes** — `Grad` · course
- **Vector Bundles and K-Theory** — `Grad` · course
- **Index Theory and the Atiyah-Singer Theorem** — `PhD` · topic
- **K-Theory** — `PhD` · course

### Topological Data Analysis

- **Topological Data Analysis** — `UG/Grad` · course
- **Persistent Homology** — `Grad` · topic

### Sheaf and Cosheaf Methods

- **Sheaf Cohomology** — `Grad` · course
- **Constructible Sheaves and Cellular Cosheaves** — `PhD` · topic

---

## VII · Analysis, Calculus, and Function Spaces

*Tier: `core-pure-applied` · 33 entries*

### Single and Multivariable Calculus

- **Honors Calculus (Spivak)** — `UG` · course
- **Multivariable Calculus** — `UG` · course
- **Single Variable Calculus** — `UG` · course

### Vector-Valued and Multivariable Functions

- **The Inverse and Implicit Function Theorems** — `UG` · topic
- **Vector Calculus** — `UG` · course
- **Analysis on Manifolds** — `UG/Grad` · course

### Real Analysis

- **Metric Spaces and Topology** — `UG` · topic
- **Real Analysis I** — `UG` · course
- **Real Analysis II** — `UG/Grad` · course

### Principles of Mathematical Analysis

- **Principles of Mathematical Analysis (Rudin)** — `UG` · course
- **Sequences and Series of Functions** — `UG` · topic

### Complex Analysis and Complex Variables

- **Complex Analysis** — `UG/Grad` · course
- **Riemann Surfaces** — `Grad` · course
- **Several Complex Variables** — `PhD` · course

### Measure Theory and Lebesgue Integration

- **Measure Theory and Lebesgue Integration** — `Grad` · course
- **Radon-Nikodym Theorem and Differentiation** — `Grad` · topic
- **Real Analysis: Measure and Integration (Royden/Folland)** — `Grad` · course
- **Geometric Measure Theory** — `PhD` · area

### Functional Analysis

- **Banach and Hilbert Spaces** — `Grad` · topic
- **Functional Analysis** — `Grad` · course
- **Operator Algebras and C*-Algebras** — `PhD` · area
- **Spectral Theory of Operators** — `PhD` · course
- **Von Neumann Algebras** — `PhD` · topic

### Harmonic and Fourier Analysis

- **Fourier Analysis** — `UG/Grad` · course
- **Calderon-Zygmund Theory of Singular Integrals** — `PhD` · topic
- **Harmonic Analysis** — `PhD` · course

### Distribution Theory and Sobolev Spaces

- **Distribution Theory and Fourier Transforms** — `Grad` · course
- **Sobolev Spaces and Elliptic PDE** — `PhD` · course
- **Pseudodifferential Operators** — `PhD` · topic

### Differential Forms and Stokes Theorems

- **Differential Forms and Stokes' Theorem** — `UG/Grad` · topic
- **De Rham Cohomology** — `Grad` · topic

### Calculus of Variations

- **Calculus of Variations** — `Grad` · course
- **Optimal Transport** — `PhD` · area

---

## VIII · Differential Equations, Dynamical Systems, and Chaos

*Tier: `core-applied-research` · 27 entries*

### Ordinary Differential Equations

- **Elementary Differential Equations and Boundary Value Problems** — `UG` · course
- **Qualitative Theory of ODEs and Existence-Uniqueness** — `UG/Grad` · course
- **Sturm-Liouville Theory and Special Functions** — `UG/Grad` · topic

### Partial Differential Equations

- **Introduction to Partial Differential Equations** — `UG/Grad` · course
- **Sobolev Spaces and Elliptic Boundary Value Problems** — `Grad` · course
- **Microlocal Analysis** — `PhD` · topic
- **Nonlinear Hyperbolic Conservation Laws** — `PhD` · topic

### Numerical Differential Equations

- **Numerical Methods for Ordinary Differential Equations** — `UG/Grad` · course
- **Finite Element Methods for Partial Differential Equations** — `Grad` · course
- **Spectral Methods and Discontinuous Galerkin Schemes** — `PhD` · topic

### Nonlinear Dynamics

- **Introduction to Nonlinear Dynamics and Bifurcation Theory** — `UG/Grad` · course
- **Center Manifold Theory and Normal Forms** — `Grad` · topic
- **Dynamical Systems and Ergodic Theory** — `PhD` · course
- **Ergodic Theory** — `PhD` · course
- **Bifurcation Theory** — `Grad` · topic

### Chaos Mathematics

- **Chaos, Strange Attractors, and Fractal Dimension** — `UG/Grad` · course
- **Symbolic Dynamics and Smale Horseshoes** — `Grad` · topic

### Hamiltonian and Lagrangian Systems

- **Classical Mechanics and Lagrangian Dynamics** — `UG/Grad` · course
- **Symplectic Geometry and Hamiltonian Mechanics** — `Grad` · course
- **KAM Theory and Integrable Systems** — `PhD` · topic
- **KAM Theory** — `PhD` · topic
- **Integrable Systems** — `PhD` · course

### Stochastic Differential Equations

- **Stochastic Calculus and Ito Diffusions** — `Grad` · course
- **Rough Path Theory** — `PhD` · topic
- **Stochastic Partial Differential Equations** — `PhD` · course

### Inverse Problems

- **Inverse Problems and Regularization Methods** — `Grad` · course
- **Inverse Scattering and the Calderon Problem** — `PhD` · topic

---

## IX · Probability, Statistics, and Inference

*Tier: `core-applied-research` · 33 entries*

### Probability Theory

- **Probability (Measure-Theoretic Probability)** — `UG/Grad` · course
- **Theory of Probability I** — `Grad` · course
- **Theory of Probability II** — `Grad` · course
- **Concentration of Measure Inequalities** — `PhD` · topic
- **Free Probability** — `PhD` · topic
- **Large Deviations Theory** — `PhD` · topic

### Stochastic Processes

- **Stochastic Processes** — `UG/Grad` · course
- **Brownian Motion and Stochastic Calculus** — `Grad` · course
- **Markov Chains and Mixing Times** — `Grad` · course
- **Stochastic Differential Equations** — `PhD` · topic
- **Schramm-Loewner Evolution** — `PhD` · topic
- **Malliavin Calculus** — `PhD` · topic
- **Interacting Particle Systems** — `PhD` · topic
- **Rough Paths and Regularity Structures** — `PhD` · topic

### Mathematical Statistics

- **Mathematical Statistics** — `UG/Grad` · course
- **Statistical Decision Theory** — `Grad` · topic
- **Theory of Statistics (Estimation and Hypothesis Testing)** — `Grad` · course
- **Asymptotic Statistics** — `PhD` · topic

### Bayesian Statistics

- **Bayesian Data Analysis** — `UG/Grad` · course
- **Bayesian Nonparametrics** — `PhD` · topic

### Causal Inference

- **Causal Inference** — `Grad` · course
- **Potential Outcomes and Counterfactuals** — `Grad` · topic

### Information Theory

- **Information Theory (Entropy, Channel Capacity)** — `UG/Grad` · course
- **Information-Theoretic Lower Bounds in Statistics** — `PhD` · topic

### Time Series

- **Time Series Analysis** — `UG/Grad` · course
- **Spectral Analysis of Time Series** — `Grad` · topic

### High-Dimensional Statistics

- **High-Dimensional Statistics** — `PhD` · course
- **Random Matrix Theory** — `PhD` · area

### Nonparametric and Semiparametric Statistics

- **Nonparametric Statistics** — `Grad` · course
- **Semiparametric Theory and Efficient Estimation** — `PhD` · topic

### Experimental Design and A/B Testing

- **Design of Experiments** — `UG/Grad` · course
- **Sequential Analysis and Multi-Armed Bandits** — `Grad` · topic

### Extreme Value and Risk Statistics

- **Extreme Value Theory** — `Grad` · course
- **Quantitative Risk Management** — `Grad` · topic

---

## X · Optimization, Control, Operations Research, and Game Theory

*Tier: `core-applied-research` · 25 entries*

### Convex Optimization

- **Convex Optimization** — `UG/Grad` · course
- **Convex Analysis** — `Grad` · topic
- **Interior-Point Methods for Conic Programming** — `Grad` · topic
- **Semidefinite Programming and Sum-of-Squares Optimization** — `PhD` · topic
- **Semidefinite Programming** — `Grad` · course

### Nonlinear Optimization

- **Karush-Kuhn-Tucker Conditions and Lagrangian Duality** — `UG/Grad` · topic
- **Nonlinear Programming** — `UG/Grad` · course
- **Numerical Optimization** — `Grad` · course
- **First-Order Methods for Large-Scale Optimization** — `PhD` · topic

### Combinatorial and Integer Optimization

- **Linear Programming** — `UG` · course
- **Combinatorial Optimization** — `UG/Grad` · course
- **Integer Programming** — `Grad` · course
- **Approximation Algorithms** — `PhD` · topic
- **Submodular Optimization** — `Grad` · topic

### Dynamic Programming

- **Dynamic Programming and Stochastic Control** — `Grad` · course
- **Markov Decision Processes** — `Grad` · topic

### Optimal Control

- **Pontryagin Maximum Principle** — `Grad` · topic
- **Hamilton-Jacobi-Bellman Equation and Viscosity Solutions** — `PhD` · topic
- **Mean-Field Games** — `PhD` · topic

### Robust and Stochastic Optimization

- **Robust Optimization** — `Grad` · course
- **Stochastic Programming** — `Grad` · course

### Game Theory

- **Combinatorial Game Theory** — `UG` · topic
- **Game Theory** — `UG/Grad` · course
- **Mechanism Design and Algorithmic Game Theory** — `PhD` · topic

### Operations Research

- **Queueing Theory** — `Grad` · course

---

## XI · Discrete Mathematics, Combinatorics, and Graph Theory

*Tier: `core-pure-applied` · 26 entries*

### Discrete Mathematics

- **Discrete Mathematics** — `UG` · course
- **Mathematics for Computer Science** — `UG` · course

### Applied Combinatorics

- **Introduction to Combinatorics** — `UG` · course
- **Enumerative Combinatorics** — `UG/Grad` · course
- **Generating Functions and Analytic Combinatorics** — `Grad` · topic

### Combinatorial Theory

- **Algebraic Combinatorics** — `Grad` · course
- **Analytic Combinatorics** — `Grad` · topic
- **Extremal Combinatorics** — `Grad` · course
- **Probabilistic Combinatorics** — `Grad` · course
- **Ramsey Theory** — `Grad` · topic
- **Symmetric Functions and Representation Theory** — `Grad` · topic
- **The Probabilistic Method** — `Grad` · course

### Graph Theory

- **Graph Theory** — `UG/Grad` · course
- **Algebraic Graph Theory** — `Grad` · course
- **Random Graphs** — `Grad` · course
- **Spectral Graph Theory** — `Grad` · course
- **Graph Minors and Structural Graph Theory** — `PhD` · topic
- **Expander Graphs** — `PhD` · topic

### Hypergraphs and Simplicial Structures

- **Extremal Set Theory** — `Grad` · topic
- **Topological Combinatorics** — `Grad` · course
- **Hypergraph Regularity and Removal Lemmas** — `PhD` · topic

### Matroids

- **Matroid Theory** — `Grad` · course
- **Combinatorics of Polytopes and Oriented Matroids** — `PhD` · topic

### Lattices and Posets

- **Lattice Theory and Ordered Sets** — `UG/Grad` · course
- **Partially Ordered Sets and Mobius Functions** — `Grad` · topic

### Coding Theory

- **Introduction to Coding Theory** — `UG/Grad` · course

---

## XII · Numerical and Computational Mathematics

*Tier: `core-computational` · 27 entries*

### Numerical Analysis

- **Introduction to Numerical Analysis** — `UG` · course
- **Numerical Methods for Differential Equations** — `UG/Grad` · course
- **Convergence and Stability Analysis of Finite Difference Schemes** — `Grad` · topic

### Floating-Point and Precision Engineering

- **IEEE 754 Floating-Point Arithmetic and Rounding-Error Analysis** — `UG/Grad` · topic
- **Conditioning, Stability, and Backward Error Analysis** — `Grad` · topic

### Numerical Linear Algebra

- **Matrix Computations** — `UG/Grad` · course
- **Iterative Methods for Large Sparse Linear Systems** — `Grad` · course
- **Numerical Linear Algebra** — `Grad` · course
- **Randomized Numerical Linear Algebra** — `PhD` · area

### Approximation and Interpolation

- **Spline Interpolation and B-Splines** — `UG/Grad` · topic
- **Approximation Theory** — `Grad` · course
- **Chebyshev and Orthogonal Polynomial Approximation** — `Grad` · topic

### Numerical Integration and Quadrature

- **Adaptive Quadrature and Numerical Integration** — `UG/Grad` · topic
- **Gaussian Quadrature and Orthogonal Polynomials** — `UG/Grad` · topic
- **Monte Carlo and Quasi-Monte Carlo Methods** — `Grad` · course

### Root Finding and Nonlinear Solvers

- **Newton and Quasi-Newton Methods for Nonlinear Systems** — `UG/Grad` · topic
- **Numerical Continuation and Homotopy Methods** — `Grad` · topic

### Scientific Computing Methods

- **Scientific Computing** — `UG/Grad` · course
- **Computational Methods in Science and Engineering** — `Grad` · course
- **Spectral Methods for Partial Differential Equations** — `PhD` · course
- **Multigrid Methods** — `Grad` · course
- **Spectral Methods** — `Grad` · course

### High-Performance and GPU Computing

- **Parallel Computing** — `UG/Grad` · course
- **GPU Programming for Numerical Algorithms** — `Grad` · course

### Uncertainty Quantification

- **Bayesian Inverse Problems and Uncertainty Quantification** — `Grad` · course
- **Polynomial Chaos and Stochastic Galerkin Methods** — `PhD` · topic

### Automatic Differentiation

- **Automatic Differentiation: Forward and Reverse Modes** — `Grad` · topic

---

## XIII · Symbolic Computation and Automated Reasoning

*Tier: `core-computational` · 24 entries*

### Computer Algebra Systems

- **Computer Algebra** — `UG/Grad` · course
- **Algorithms for Computer Algebra** — `Grad` · course
- **Modular and p-adic Methods for Polynomial Arithmetic** — `Grad` · topic
- **Symbolic Computation** — `Grad` · course

### Term Rewriting

- **Confluence and Termination of Rewriting** — `Grad` · topic
- **Knuth-Bendix Completion** — `Grad` · topic
- **Term Rewriting Systems** — `Grad` · course

### Polynomial System Solving

- **Grobner Bases and Buchberger's Algorithm** — `UG/Grad` · course
- **Computational Algebraic Geometry** — `Grad` · course
- **Resultants and Elimination Theory** — `Grad` · topic
- **Numerical Algebraic Geometry and Homotopy Continuation** — `PhD` · topic

### SAT and SMT Solving

- **Satisfiability and the DPLL Algorithm** — `UG/Grad` · course
- **CDCL and Modern SAT Solving** — `Grad` · topic
- **Satisfiability Modulo Theories** — `Grad` · course

### Automated Theorem Proving

- **Decision Procedures for Logical Theories** — `Grad` · course
- **Resolution and First-Order Theorem Proving** — `Grad` · course
- **Unification Theory** — `Grad` · topic

### Proof Assistant Integration

- **Interactive Theorem Proving with Lean** — `UG/Grad` · course
- **Formalization of Mathematics in Coq** — `Grad` · course
- **Type Theory and the Curry-Howard Correspondence** — `Grad` · topic

### Equation and Inequality Solving

- **Cylindrical Algebraic Decomposition** — `PhD` · topic
- **Quantifier Elimination over Real Closed Fields** — `PhD` · topic

### Dimensional Analysis and Units

- **Dimensional Analysis and the Buckingham Pi Theorem** — `UG` · topic

### Code Generation

- **Generative Programming and Symbolic Code Generation** — `Grad` · course

---

## XIV · Mathematical Physics, Cosmology, and Astronomy

*Tier: `applied-research` · 30 entries*

### Classical Mechanics

- **Classical Mechanics** — `UG` · course
- **Lagrangian and Hamiltonian Mechanics** — `UG/Grad` · course
- **Mathematical Methods of Classical Mechanics** — `Grad` · course
- **Symplectic Geometry and Hamiltonian Dynamics** — `PhD` · topic

### Electromagnetism

- **Electricity and Magnetism** — `UG` · course
- **Classical Electrodynamics** — `Grad` · course
- **Maxwell's Equations and Gauge Theory** — `Grad` · topic

### Thermodynamics and Statistical Mechanics

- **Thermodynamics and Kinetic Theory** — `UG` · course
- **Statistical Mechanics** — `UG/Grad` · course
- **Phase Transitions and the Renormalization Group** — `PhD` · topic

### Quantum Mechanics

- **Introduction to Quantum Mechanics** — `UG` · course
- **Mathematical Foundations of Quantum Mechanics** — `Grad` · course
- **Spectral Theory of Schrodinger Operators** — `PhD` · topic

### Quantum Field Theory

- **Quantum Field Theory I** — `Grad` · course
- **Quantum Field Theory II** — `Grad` · course
- **Conformal Field Theory** — `PhD` · topic
- **String Theory Mathematics** — `PhD` · area
- **Renormalization Group** — `Grad` · topic
- **String Theory and Mathematical Physics** — `PhD` · area

### General Relativity

- **Introduction to General Relativity** — `UG/Grad` · course
- **Black Hole Geometry and Causal Structure** — `PhD` · topic
- **Mathematical General Relativity and the Einstein Equations** — `PhD` · course

### Cosmology

- **Physical Cosmology** — `UG/Grad` · course
- **Friedmann-Lemaitre-Robertson-Walker Models and Inflation** — `Grad` · topic

### Astronomy and Orbital Mechanics

- **Celestial Mechanics and the N-Body Problem** — `UG/Grad` · course
- **Orbital Dynamics and Perturbation Theory** — `Grad` · topic

### Quantum Information

- **Quantum Computation and Quantum Information** — `UG/Grad` · course
- **Quantum Algorithms and Quantum Computing** — `Grad` · course
- **Quantum Error Correction and Fault Tolerance** — `PhD` · topic

### Tensor Calculus

- **Tensor Calculus and Riemannian Geometry** — `Grad` · course

---

## XV · Engineering Mathematics, Signals, Systems, and Control

*Tier: `applied-engineering` · 21 entries*

### Engineering Mathematics

- **Advanced Engineering Mathematics** — `UG` · course
- **Partial Differential Equations for Engineers** — `UG` · course
- **Methods of Applied Mathematics (Asymptotics and Perturbation Theory)** — `UG/Grad` · course

### Electrical Engineering Mathematics

- **Signals and Systems** — `UG` · course
- **Linear Systems Theory** — `Grad` · course

### Signal Processing

- **Discrete-Time Signal Processing** — `UG/Grad` · course
- **Adaptive Filtering and Kalman Filtering** — `Grad` · course
- **Wavelets and Multiresolution Analysis** — `Grad` · course

### Control Systems

- **Feedback Control Systems** — `UG` · course
- **Nonlinear Control Systems and Lyapunov Stability** — `Grad` · course
- **Optimal Control and the Linear Quadratic Regulator** — `Grad` · course
- **Robust and H-infinity Control** — `PhD` · course

### Communications Theory

- **Digital Communications** — `UG/Grad` · course
- **Detection and Estimation Theory** — `Grad` · course
- **Information Theory and Coding** — `Grad` · course

### Robotics and Kinematics

- **Introduction to Robotics: Manipulator Kinematics and Dynamics** — `UG/Grad` · course
- **Screw Theory and Geometric Mechanics of Robots** — `PhD` · topic

### Imaging and Inverse Imaging

- **Inverse Problems and Computational Imaging** — `Grad` · course
- **Tomographic Reconstruction and the Radon Transform** — `Grad` · topic

### Reliability and Safety Mathematics

- **Reliability Engineering and Probabilistic Risk Assessment** — `UG/Grad` · course
- **Stochastic Models of Failure and Renewal Theory** — `Grad` · topic

---

## XVI · Quantitative Finance, Economics, and Risk Engineering

*Tier: `applied-financial` · 24 entries*

### Quantitative Analysis

- **Mathematical Methods for Quantitative Finance** — `UG` · course
- **Numerical Methods for Finance: Finite Differences and Monte Carlo** — `UG/Grad` · course
- **Quantitative Analysis** — `Grad` · course

### Stochastic Calculus for Finance

- **Girsanov's Theorem and Change of Measure** — `Grad` · topic
- **Ito Calculus and the Stochastic Integral** — `Grad` · topic
- **Stochastic Differential Equations and the Feynman-Kac Formula** — `Grad` · topic

### Derivatives Pricing

- **Black-Scholes-Merton Option Pricing Theory** — `UG/Grad` · course
- **Interest Rate Models: Heath-Jarrow-Morton and LIBOR Market Models** — `Grad` · course
- **Martingale Methods in Financial Modeling** — `PhD` · area
- **Stochastic Volatility and the Heston Model** — `PhD` · topic

### Portfolio Theory

- **Capital Asset Pricing Model and Arbitrage Pricing Theory** — `UG/Grad` · topic
- **Mean-Variance Portfolio Optimization and the Markowitz Model** — `UG/Grad` · course
- **Continuous-Time Portfolio Choice and Merton's Problem** — `PhD` · topic

### Risk Management

- **Value at Risk and Expected Shortfall** — `UG/Grad` · course
- **Credit Risk Modeling: Structural and Reduced-Form Models** — `Grad` · course
- **Extreme Value Theory and Copula Methods for Dependence** — `Grad` · topic

### Econometrics

- **Time Series Analysis and ARIMA Models** — `UG/Grad` · course
- **Cointegration and Vector Error Correction Models** — `Grad` · topic
- **Financial Econometrics: GARCH and Volatility Modeling** — `Grad` · course

### Market Microstructure

- **Market Microstructure and Limit Order Book Dynamics** — `Grad` · course
- **Optimal Execution and Algorithmic Trading** — `PhD` · topic

### Actuarial Mathematics

- **Life Contingencies and Actuarial Survival Models** — `UG` · course
- **Ruin Theory and the Collective Risk Model** — `Grad` · topic

### Crypto and DeFi Mathematics

- **Automated Market Makers and Constant Function Market Mechanisms** — `Grad` · topic

---

## XVII · Cryptography, Security Mathematics, and Coding Theory

*Tier: `applied-computational-security` · 21 entries*

### Classical and Symmetric Cryptography

- **Introduction to Cryptography** — `UG/Grad` · course
- **Block Ciphers and the AES** — `Grad` · topic
- **Stream Ciphers and Pseudorandom Generators** — `Grad` · topic
- **Stream Ciphers and Pseudorandomness** — `Grad` · topic
- **Cryptographic Hash Functions and MACs** — `Grad` · topic

### Public-Key Cryptography

- **Public-Key Cryptography and RSA** — `UG/Grad` · course
- **Elliptic-Curve Cryptography** — `Grad` · course
- **Pairing-Based Cryptography** — `Grad` · topic
- **Public-Key Cryptography** — `Grad` · course
- **RSA and Integer-Factorization Cryptosystems** — `Grad` · topic
- **Discrete-Log and Diffie-Hellman Key Exchange** — `Grad` · topic
- **Digital Signature Schemes** — `Grad` · topic

### Lattice and Post-Quantum Cryptography

- **Lattice-Based Cryptography** — `Grad` · course
- **Post-Quantum Cryptography** — `Grad` · course
- **Learning With Errors and Ring-LWE** — `PhD` · topic

### Zero-Knowledge Proofs

- **Zero-Knowledge Proof Systems** — `Grad` · course
- **zk-SNARKs and zk-STARKs** — `Grad` · topic
- **Probabilistically Checkable Proofs** — `PhD` · topic

### Coding Theory

- **Algebraic Coding Theory** — `Grad` · course
- **LDPC and Turbo Codes** — `Grad` · topic
- **Reed-Solomon and BCH Codes** — `Grad` · topic
- **List Decoding** — `PhD` · topic
- **Error-Correcting Codes** — `UG/Grad` · topic
- **LDPC and Polar Codes** — `Grad` · topic

### Cryptanalysis

- **Differential and Linear Cryptanalysis** — `Grad` · topic
- **Side-Channel Analysis** — `Grad` · topic

### Secure Multiparty and Homomorphic Computation

- **Secure Multiparty Computation** — `Grad` · course
- **Fully Homomorphic Encryption** — `PhD` · topic

### Information-Theoretic Security

- **Information-Theoretic Security and the One-Time Pad** — `Grad` · topic
- **Shannon Secrecy and the One-Time Pad** — `Grad` · topic
- **Secret Sharing Schemes** — `Grad` · topic

---

## XVIII · AI, Machine Learning, Data Science, and Learning Theory

*Tier: `applied-computational-research` · 27 entries*

### Supervised Learning

- **Linear and Logistic Regression Models** — `UG` · topic
- **Decision Trees and Ensemble Methods** — `UG/Grad` · topic
- **Introduction to Machine Learning** — `UG/Grad` · course
- **Support Vector Machines** — `Grad` · topic
- **Statistical Learning Theory** — `UG/Grad` · course
- **Regression and Classification Methods** — `UG/Grad` · course
- **Ensemble Methods and Gradient Boosting** — `Grad` · topic

### Unsupervised Learning

- **Principal Component Analysis** — `UG/Grad` · topic
- **Clustering and Mixture Models** — `Grad` · topic
- **Dimensionality Reduction and Manifold Learning** — `Grad` · topic
- **Density Estimation** — `Grad` · topic

### Self-Supervised Learning

- **Representation Learning** — `Grad` · area
- **Self-Supervised and Contrastive Learning** — `Grad` · topic
- **Contrastive Learning** — `Grad` · topic
- **Masked Prediction and Pretraining Objectives** — `Grad` · topic

### Reinforcement Learning

- **Reinforcement Learning** — `Grad` · course
- **Deep Reinforcement Learning** — `PhD` · topic
- **Policy Gradient Methods** — `Grad` · topic

### Deep Learning Mathematics

- **Backpropagation and Computational Graphs** — `UG/Grad` · topic
- **Convolutional Neural Networks** — `Grad` · topic
- **Deep Learning** — `Grad` · course
- **Generative Models and Variational Autoencoders** — `Grad` · topic
- **Transformers and Attention Mechanisms** — `Grad` · topic
- **Diffusion Models** — `PhD` · topic
- **Neural Network Approximation Theory** — `PhD` · topic
- **Convolutional and Recurrent Architectures** — `Grad` · topic
- **Generative Models and Diffusion Processes** — `Grad` · topic

### Probabilistic Machine Learning

- **Gaussian Processes** — `Grad` · topic
- **Probabilistic Graphical Models** — `Grad` · course
- **Variational Inference** — `Grad` · topic
- **Bayesian Deep Learning** — `PhD` · topic

### Kernel Methods

- **Kernel Methods and Reproducing Kernel Hilbert Spaces** — `Grad` · course
- **Reproducing Kernel Hilbert Spaces** — `Grad` · topic

### Geometric and Graph Machine Learning

- **Graph Neural Networks** — `Grad` · topic
- **Geometric Deep Learning** — `PhD` · area

### Optimization for ML

- **Stochastic Gradient Methods** — `Grad` · topic
- **Stochastic Gradient Descent and Adaptive Methods** — `Grad` · topic
- **Nonconvex Optimization Landscapes in Deep Learning** — `PhD` · topic

### Learning Theory

- **Generalization and PAC Learning** — `Grad` · topic
- **VC Dimension and Rademacher Complexity** — `Grad` · topic
- **PAC Learning and VC Dimension** — `Grad` · course
- **Rademacher Complexity and Generalization Bounds** — `Grad` · topic
- **Online Learning and Regret Minimization** — `PhD` · topic
- **Neural Tangent Kernel Theory** — `PhD` · topic

### Evaluation and Benchmarking

- **Model Evaluation, Cross-Validation, and Calibration** — `UG/Grad` · topic
- **Calibration and Uncertainty Estimation** — `Grad` · topic
- **Benchmark Design and Data Leakage Detection** — `Grad` · topic

---

## XIX · Computer Science, Algorithms, and Complexity

*Tier: `applied-computational-foundational` · 20 entries*

### Algorithms

- **Design and Analysis of Algorithms** — `UG` · course
- **Online Algorithms and Competitive Analysis** — `Grad` · topic
- **Randomized Algorithms** — `Grad` · course
- **Streaming and Sketching Algorithms** — `Grad` · topic

### Data Structures

- **Hashing and Bloom Filters** — `UG/Grad` · topic
- **Advanced Data Structures** — `Grad` · course
- **Amortized Analysis** — `UG/Grad` · topic
- **Succinct and Persistent Data Structures** — `Grad` · topic

### Computational Complexity

- **NP-Completeness and Reductions** — `UG/Grad` · topic
- **Complexity Theory** — `Grad` · course
- **Hardness of Approximation** — `PhD` · topic
- **Computational Complexity Theory** — `Grad` · course
- **Circuit Complexity and Lower Bounds** — `PhD` · topic
- **Probabilistically Checkable Proofs and Hardness of Approximation** — `PhD` · topic
- **Parameterized Complexity** — `Grad` · topic

### Theory of Computation

- **Automata Theory and Formal Languages** — `UG` · course
- **Turing Machines and the Church-Turing Thesis** — `UG` · topic
- **Computability and the Halting Problem** — `UG/Grad` · topic
- **Automata, Languages, and Computation** — `UG` · course
- **Decidability and the Halting Problem** — `UG/Grad` · topic

### Programming Language Theory

- **Lambda Calculus and Functional Programming** — `UG/Grad` · topic
- **Programming Language Semantics** — `Grad` · course
- **Type Systems and Polymorphism** — `Grad` · topic
- **Operational and Denotational Semantics** — `Grad` · topic

### Compilers and Symbolic IR

- **Compiler Construction** — `UG/Grad` · course
- **Program Analysis and Abstract Interpretation** — `Grad` · topic
- **Static Single Assignment and Intermediate Representations** — `Grad` · topic

### Databases and Query Systems

- **Database Systems and Relational Algebra** — `UG/Grad` · course
- **Query Optimization** — `Grad` · topic
- **Relational Algebra and Query Optimization** — `UG/Grad` · topic
- **Database Theory and Functional Dependencies** — `Grad` · topic

### Distributed Systems Mathematics

- **Concurrency Theory and Process Calculi** — `Grad` · topic
- **Distributed Algorithms and Consensus** — `Grad` · course
- **Consensus Algorithms and Fault Tolerance** — `Grad` · topic
- **Consistency Models and the CAP Theorem** — `Grad` · topic

---

## XX · Applied Sciences, Biology, Networks, and Social Systems

*Tier: `applied-science` · 18 entries*

### Mathematical Biology

- **Mathematical Models in Biology** — `UG/Grad` · course
- **Mathematical Ecology** — `Grad` · topic
- **Population Dynamics and Lotka-Volterra Models** — `Grad` · topic
- **Reaction-Diffusion Systems and Pattern Formation** — `PhD` · topic
- **Mathematical Biology** — `UG/Grad` · course
- **Reaction-Diffusion and Pattern Formation** — `Grad` · topic
- **Systems Biology and Biochemical Networks** — `Grad` · area

### Epidemiology

- **Compartmental Models (SIR/SEIR)** — `Grad` · topic
- **Mathematical Epidemiology** — `Grad` · course
- **Compartmental Epidemic Models (SIR/SEIR)** — `UG/Grad` · topic
- **Stochastic Epidemic Models** — `Grad` · topic

### Neuroscience Mathematics

- **Computational Neuroscience** — `Grad` · course
- **Neural Field and Hodgkin-Huxley Models** — `PhD` · topic
- **Hodgkin-Huxley and Neuronal Dynamics** — `Grad` · topic

### Geoscience and Climate Mathematics

- **Climate Modeling and Data Assimilation** — `Grad` · topic
- **Geophysical Fluid Dynamics** — `Grad` · course

### Network Science

- **Network Science** — `UG/Grad` · course
- **Epidemic Spreading on Networks** — `Grad` · topic
- **Random Graph Models and Scale-Free Networks** — `Grad` · topic
- **Random Graph Models and Community Detection** — `Grad` · topic
- **Spreading Processes on Networks** — `Grad` · topic

### Social Choice and Voting Theory

- **Voting Systems and Arrow's Impossibility Theorem** — `UG/Grad` · topic
- **Fair Division and Mechanism Design** — `Grad` · topic
- **Social Choice Theory** — `Grad` · course
- **Arrow's Impossibility Theorem and Social Choice** — `UG/Grad` · topic
- **Voting Systems and Fair Division** — `Grad` · topic

### Complex Adaptive Systems

- **Agent-Based Modeling and Simulation** — `Grad` · topic
- **Self-Organization and Emergence** — `Grad` · topic
- **Agent-Based Modeling** — `Grad` · area
- **Cellular Automata and Self-Organization** — `Grad` · topic
- **Complex Adaptive Systems** — `PhD` · area

---

## XXI · Meta-Mathematics, Modeling, Pedagogy, and Knowledge Systems

*Tier: `meta` · 18 entries*

### Mathematical Modeling

- **Dimensional Analysis and Scaling** — `UG/Grad` · topic
- **Mathematical Modeling and Simulation** — `UG/Grad` · course
- **Perturbation Methods and Asymptotics** — `Grad` · topic
- **Mathematical Modeling** — `UG/Grad` · course
- **Perturbation Methods and Multiple Scales** — `Grad` · topic
- **Scaling Laws and Nondimensionalization** — `Grad` · topic
- **Inverse Modeling and Parameter Estimation** — `Grad` · topic

### Problem-Solving Heuristics

- **Mathematical Problem-Solving** — `UG` · course
- **Polya's Heuristics and Proof Strategies** — `UG` · topic
- **Putnam and Olympiad Problem Seminar** — `UG` · course
- **Olympiad Problem-Solving Techniques** — `UG` · topic
- **Conjecture Formation and Experimental Mathematics** — `Grad` · topic

### Mathematical Pedagogy

- **Mathematics Education and Pedagogy** — `Grad` · course
- **Teaching of College Mathematics** — `Grad` · topic
- **Mathematics Education Theory** — `Grad` · course
- **Concept Inventories and Misconceptions** — `Grad` · topic

### Notation and Typesetting

- **LaTeX and Mathematical Typesetting** — `UG` · topic
- **Mathematical Writing and Communication** — `UG/Grad` · course
- **LaTeX and Technical Typesetting** — `UG` · topic
- **Formal Mathematical Language Design** — `Grad` · topic

### Knowledge Graphs for Math

- **Formal Mathematical Libraries and Databases** — `Grad` · topic
- **Knowledge Graphs and Ontologies for Mathematics** — `Grad` · topic
- **Mathematical Knowledge Management** — `Grad` · area
- **Ontologies and Formalized Mathematics Libraries** — `PhD` · topic

### Benchmarking and Evaluation

- **Benchmarking of Mathematical Reasoning Systems** — `Grad` · topic
- **Reproducibility in Computational Mathematics** — `Grad` · topic
- **Mathematical Benchmark Design** — `Grad` · topic

### Mathematical History and Context

- **Great Theorems and Their Historical Context** — `UG` · topic
- **History of Mathematics** — `UG` · course
- **Ethnomathematics and Cross-Cultural Mathematics** — `UG/Grad` · topic
- **Foundations Crisis and the Philosophy of Mathematics** — `UG/Grad` · topic
- **Philosophy of Mathematics** — `UG/Grad` · topic
- **Foundational Crises and Their Resolution** — `Grad` · topic

---

## Methodology & provenance

This atlas was assembled by a multi-agent workflow: one enumerator per domain produced real, leveled course/topic lists grounded in top-100 department curricula; results were merged under a deterministic global de-duplication pass; a completeness critic then added canonical graduate/PhD areas that were under-represented (ergodic theory, operator algebras, K-theory, étale & motivic cohomology, geometric measure theory, optimal transport, random matrix theory, the Langlands program, Teichmüller theory, and more). The five domains and the critic pass that were interrupted by transient API rate-limiting were completed directly against the same de-duplication contract. Final count: **617 unique entries**.

> Regenerate or extend: the domain/subdomain scaffold lives in the project knowledge blueprint `super_math_calculator_rag_blueprint.xml` (`<math_taxonomy>`), which carries the full **1,094-topic** machine-readable taxonomy this human-readable atlas distills.
