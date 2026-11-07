---
name: clean-n-code
description: >
  Clean code mode: readable names, small functions, errors with context, security baseline. Use on any coding task and for "clean code", "clean-n-code", "make it readable", "uncle bob".
license: MIT
---

# Clean-n-code

You write code the next reader understands at a glance. The task sets the scope: do exactly what it asks, no more, no less. Never add features, options or checks to look clean. Security is never cut to keep a diff small.

Active until the user says "stop clean-n-code".

## Proportion (overrides the rest)
- Priority: the task, the repo's conventions, these rules. A rule that makes this code harder to read doesn't apply here.
- Behavior the task leaves undefined isn't yours to invent: no extra checks, trimming, coercions, formats or limits. Take the plain reading and name the assumption in the closing line.
- A spec value used only in its own check and that check's message stays a literal, with no constant. Name any other number (G25) that repeats, isn't obvious where it's used, or changes on its own schedule.
- Don't re-declare code the task gave you.
- Clean only code your change touches (Boy Scout), and name those improvements. Abstract only duplication that already exists (G5), never "for later".
- To refactor: tests first, then tiny steps, suite green after each.

## Before you hand back code
1. **Names.** Say why it exists and what it does; if it needs a comment, rename it (N1). Length follows scope (N5). Functions are verbs naming every effect (N7, G20). One word per concept, the repo's words (G11, N3). No `Data`, `Info`, `Manager`, no type prefixes (N6).
2. **Functions.** One thing, one level of abstraction (G30, G34), callers above callees (G10), about 20 lines of its own (K9). Within K1, K2 and K9 it stays whole: extract only a step the reader would look for, never to shrink a number (K8).
3. **Flow.** Cyclomatic complexity ≤ 10 (K1), nesting ≤ 2 (K2). Guard clauses (K3), named positive conditions (K4, G28, G29), explanatory variables (G19), lookup tables over if-ladders (K5).
4. **Arguments.** 0 to 2 (F1). No boolean or selector flags: two functions (F3, G15). No output arguments (F2). Change state or answer a question, not both; if order matters, pass each step's result on (G31).
5. **Errors.** The language's idiomatic mechanism, saying what failed and why, apart from the happy path. Never swallow one; no null where an empty value, optional or error fits.
6. **Docs.** Every public API gets its language's doc comment (PEP 257, godoc, TSDoc, Javadoc). Other comments: only the why the code can't show (C3). No commented-out code (C5) or change logs (C1).
7. **Tests.** Fast, independent, repeatable: no network, clock or locale (T9). One concept per test, every boundary value (T5).
8. **Design.** Plain data for data, objects for behavior (D6). Pure logic, I/O and time at the edges (D10).

## Security baseline
- No secret in code, config, logs, URLs or errors; read it at runtime (S7, S8). Revoke and rotate a leaked key (S10).
- Validate untrusted input where it enters the process, not in every function (S12). Parameterize queries and commands (S13). Deny by default, authorize per object (S2, S18). Bound what untrusted input can grow (S19).
- Slow salted hash for passwords (S11), CSPRNG and vetted crypto (S20). Fail closed: generic error to clients, detail without secrets in logs (S21). Locked, audited dependencies (S23).

## Language idioms
A language card in this context wins; cite its codes (`GO9`). Otherwise, for code only shown in the reply, use the line below. A file you write gets its card on the first write.
  - Python: annotate public APIs, `raise … from err`, `with` for resources (PY12, PY9, PY13).
  - TypeScript: `unknown` not `any`, no `as`/`!` without a check, no floating promises (TS2, TS3, TS13).
  - JavaScript: `const`, `===`, await or return every promise, `Error` with `{ cause }` (JS3, JS4, JS10, JS9).
  - Go: handle every error, wrap with context and `%w`, error path first, `defer` right after acquire (GO8, GO9, GO10, GO12).
  - Java: immutable by default, try-with-resources, `Optional` only for return values (JA4, JA12, JA11).
  - C#: nullable on, `using` declarations, no `async void` or `.Result` (CS7, CS10, CS11, CS12).
  - Rust: `Result` and `?` with context, `expect` not `unwrap`, borrow in parameters (RS8, RS9, RS5).

Repo and linter config beat the guide; the guide beats these rules. Full guides: `../../languages/`. Catalogs, only when a decision needs them: `references/smells.md`, `references/complexity.md`, `references/design.md`, `references/security.md`.

Never cut: validation at trust boundaries, error handling that prevents data loss, security, accessibility, error context.

End your reply with one line: `Applied:` followed by the codes of the rules you used, then anything left unclean on purpose. Cite only codes printed in this context, and never invent one.
