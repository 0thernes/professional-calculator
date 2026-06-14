# Data & Domain Model

A calculator has no database, so there is no SQL ERD in the traditional sense.
What it *does* have is a well-defined set of **domain entities** (the value types
the engine computes with) and **relationships** between them, plus the explicit
**state machine** that governs the interactive calculator. This document models
all three: an entity-relationship view, a class/type view, and the state model.

> "ERP" (Enterprise Resource Planning) is not applicable to a calculator — it is
> a business-operations discipline, not a software artifact. The relevant
> modeling here is **ERM/ERD** (entity-relationship) of the domain types, which
> follows.

---

## 1. Entity-relationship diagram (domain value types)

```mermaid
erDiagram
    COMPLEX {
        number re
        number im
    }
    RATIONAL {
        bigint n
        bigint d
    }
    MATRIX {
        number[][] rows
    }
    QUANTITY {
        number value "SI base units"
        Dim dim "7 exponents"
    }
    AST_NODE {
        string type
        any payload
    }
    SNAPSHOT {
        string current
        string previous
        string operator
        CalcState state
        number timestamp
    }

    AST_NODE ||--o{ AST_NODE : "child nodes"
    AST_NODE ||--|| COMPLEX : "evaluates to"
    MATRIX ||--o{ COMPLEX : "eigenvalues are"
    RATIONAL ||--|| COMPLEX : "coerces to"
    QUANTITY }o--|| QUANTITY : "arithmetic combines"
    SNAPSHOT }o--|| SNAPSHOT : "undo/redo links"
```

### Entity catalog

| Entity | Defined in | Shape | Invariants |
|---|---|---|---|
| **Complex** | `complex.js` | `{ re, im }` | immutable; reals are `im === 0` |
| **Rational** | `rational.js` | `{ n: bigint, d: bigint }` | `d > 0`, `gcd(\|n\|, d) = 1` |
| **Matrix** | `matrix.js` | `number[][]` row-major | rectangular |
| **Quantity** | `units.js` | `{ value, dim: number[7] }` | `value` in SI base units |
| **AST Node** | `parser.js` | tagged union (`num`/`var`/`binary`/…) | tree, no cycles |
| **Snapshot** | `history.js` | calculator state record | part of undo/redo chain |
| **PhysicalConstant** | `constants.js` | `{ value, unit, symbol, name, exact }` | read-only |

---

## 2. AST node type hierarchy

The parser produces a tagged-union AST. Each variant and its evaluation:

```mermaid
classDiagram
    class Node {
        <<union>>
        +type: string
    }
    class NumNode { +type = "num"; +value: number }
    class VarNode { +type = "var"; +name: string }
    class UnaryNode { +type = "unary"; +op; +operand: Node }
    class BinaryNode { +type = "binary"; +op; +left: Node; +right: Node }
    class PostfixNode { +type = "postfix"; +op = "!"; +operand: Node }
    class CallNode { +type = "call"; +name; +args: Node[] }
    class AbsNode { +type = "abs"; +operand: Node }
    Node <|-- NumNode
    Node <|-- VarNode
    Node <|-- UnaryNode
    Node <|-- BinaryNode
    Node <|-- PostfixNode
    Node <|-- CallNode
    Node <|-- AbsNode
    BinaryNode o-- Node : left, right
    CallNode o-- Node : args
```

| Node | Evaluates by |
|---|---|
| `num` | wrap as `{re: value, im: 0}` |
| `var` | scope lookup → imaginary unit → constant → `ReferenceError` |
| `unary` | negate or identity |
| `binary` | `+ − × ÷ ^ %` over ℂ |
| `postfix` | factorial (`n!` integer, else `Γ(n+1)`) |
| `call` | dispatch: complex fns → real fns → multi-arg special forms |
| `abs` | modulus `|z|` |

---

## 3. Calculator state machine

The button calculator is governed by an explicit FSM with a frozen transition
table (`state.js`). Illegal transitions are rejected at runtime.

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> entering : digit / decimal
    idle --> operator_set : operator
    entering --> operator_set : operator
    entering --> idle : equals / clear
    operator_set --> entering : digit
    operator_set --> idle : equals / clear
    idle --> error : invalid op (e.g. ÷0)
    entering --> error : invalid op
    operator_set --> error : invalid op
    error --> idle : clear / timeout
```

| From \ To | idle | entering | operator_set | error |
|---|:---:|:---:|:---:|:---:|
| **idle** | — | ✅ | ✅ | ✅ |
| **entering** | ✅ | — | ✅ | ✅ |
| **operator_set** | ✅ | ✅ | — | ✅ |
| **error** | ✅ | ❌ | ❌ | — |

`restore()` bypasses validation (used only when replaying a previously-valid
snapshot during undo/redo).

---

## 4. History / undo-redo model

```mermaid
classDiagram
    class HistoryManager {
        +undoStack: CircularBuffer~Snapshot~
        +redoStack: Snapshot[]
        +completed: Snapshot[]
        +record(s)
        +undo(current) Snapshot
        +redo(current) Snapshot
        +canUndo() bool
        +canRedo() bool
    }
    class CircularBuffer~T~ {
        +capacity: number
        +length: number
        +push(item) "O(1)"
        +pop() T "O(1)"
        +peek() T
        +toArray() T[]
    }
    class Snapshot {
        +current: string
        +previous: string
        +operator: string
        +state: CalcState
        +shouldResetDisplay: bool
        +label?: string
        +timestamp: number
    }
    HistoryManager o-- CircularBuffer : undo storage
    HistoryManager o-- Snapshot : records
    CircularBuffer o-- Snapshot : holds
```

**Semantics**

- `record(s)` pushes onto the undo buffer and **clears the redo stack** (a new
  action invalidates the redo future — standard editor behavior).
- `undo(current)` pops the undo buffer and pushes `current` onto redo.
- `redo(current)` pops redo and pushes `current` back onto undo.
- `completed` is a separate, capped, newest-first log for the sidebar — distinct
  from the step-back stack.

---

## 5. Units dimensional model

A `Quantity` is a magnitude in SI base units plus an exponent vector over the
seven SI base dimensions:

```
dim = [ mass, length, time, current, temperature, amount, luminosity ]
```

| Quantity | dim vector | Reads as |
|---|---|---|
| velocity | `[0, 1, −1, 0, 0, 0, 0]` | m·s⁻¹ |
| force (N) | `[1, 1, −2, 0, 0, 0, 0]` | kg·m·s⁻² |
| energy (J) | `[1, 2, −2, 0, 0, 0, 0]` | kg·m²·s⁻² |
| power (W) | `[1, 2, −3, 0, 0, 0, 0]` | kg·m²·s⁻³ |

Arithmetic rules: `+`/`−` require equal dim; `×` adds dims; `÷` subtracts dims;
`^k` scales dims by `k`. Conversion is `SI = value·factor + shift`, where `shift`
is non-zero only for affine temperature scales (°C, °F).
