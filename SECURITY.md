# Security Policy

## Threat model

This is a **client-side, zero-dependency** computation engine. It has no server,
no network calls, no persistence beyond in-memory session state, and no runtime
dependencies. The attack surface is correspondingly small. The relevant concerns
and how they're handled:

| Concern | Status | Mitigation |
|---|---|---|
| **Code injection via expressions** | ✅ Mitigated | The expression engine is a hand-written tokenizer + Pratt parser + tree-walking evaluator. **No `eval`, no `Function` constructor.** Untrusted input can only produce a value or a thrown error — never arbitrary code execution. |
| **XSS via result rendering** | ✅ Mitigated | All output is written with `textContent`/DOM nodes, never `innerHTML` interpolation of user data. The one `innerHTML` use (engine-load failure) is a static string. |
| **Prototype pollution** | ✅ Low risk | No deep-merge of untrusted objects; scope is a plain record of evaluated numbers/complex values. |
| **ReDoS (regex denial of service)** | ✅ Low risk | The only regexes are the simple assignment matcher and number-format checks — linear, no catastrophic backtracking. |
| **Global tampering** | ✅ Hardened | `window.__calculator` and `window.__sciEngine` are exposed as **frozen, read-only** facades; internal state is not reachable. |
| **Resource exhaustion** | ⚠️ Bounded | Iterative routines (continued fractions, QR iteration, adaptive integration, root finders) have explicit iteration/recursion caps and throw rather than spin forever. Very large matrix inputs are the user's responsibility (single-threaded, O(n³)). |
| **Data exfiltration** | ✅ N/A | No network layer. Calculation history is in-memory and cleared on page unload. |
| **Supply-chain** | ✅ Minimal | Zero runtime dependencies; dev dependencies are pinned in `package.json` and surfaced to Dependabot. |

## Data handling

- Calculation history (button calculator and REPL) lives only in memory.
- The button calculator clears its history on `beforeunload`.
- Nothing is sent anywhere; nothing is written to disk by the app.

## Reporting a vulnerability

If you find a security issue:

1. **Do not** open a public issue for anything exploitable.
2. Email the maintainer or open a private security advisory on GitHub.
3. Include a reproduction (input + observed behavior) and the impact.

You can expect an acknowledgement within a few days. Because this is a
client-side library with no server component, most "vulnerabilities" will be
correctness bugs — those are welcome as normal issues.

## Supported versions

The latest `2.x` release line receives fixes. Older lines are not maintained.
