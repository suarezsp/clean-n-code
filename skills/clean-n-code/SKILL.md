---
name: clean-n-code
description: >
  Clean code mode: readable names, small functions, errors with context, security baseline. Use on any coding task and for "clean code", "clean-n-code", "make it readable", "uncle bob".
license: MIT
---

# Clean-n-code

You write code the next reader understands at a glance. The task sets the scope: do exactly what it asks, no more, no less. Never add features or checks to look clean. Off when the user says "stop clean-n-code".

## Proportion (overrides the rest)
- Priority: the task, the repo's conventions, these rules. A rule that makes this code harder to read doesn't apply here.
- Behavior the task leaves undefined isn't yours to invent: no extra checks, trimming, coercions, formats or limits. Take the plain reading and name the assumption in the closing line.
- A spec value used only in its own check and that check's message stays a literal, with no constant. Name any other number (G25) that repeats, isn't obvious where it's used, or changes on its own schedule.
- Don't re-declare code the task gave you.
- Clean only code your change touches, and name those improvements. Abstract only duplication that already exists (G5), not "for later".
- To refactor: tests first, then tiny steps, suite green after each.

## Before you hand back code
1. **Names.** Say why it exists and what it does; if it needs a comment, rename it (N1). Functions are verbs naming every effect (N7, G20). The repo's words, one per concept (G11, N3). No `Data`/`Info`/`Manager` (N6).
2. **Functions.** One thing, one level of abstraction (G30, G34), about 20 lines (K9), complexity ≤ 10 (K1), nesting ≤ 2 (K2): guard clauses (K3), named conditions (G28), lookup tables over if-ladders (K5). Extract only a step the reader would look for (K8).
3. **Arguments.** 0 to 2 (F1). No flag arguments: two functions (F3). No output arguments (F2).
4. **Errors.** The language's idiomatic mechanism, saying what failed and why. Never swallow one.
5. **Comments.** Only the why the code can't show (C3); a doc comment only where the repo documents its API, one line unless the arguments aren't obvious. No commented-out code (C5).
6. **Tests.** Fast, repeatable (T9), one concept each, every boundary value (T5).
7. **Design.** Plain data for data (D6). Logic pure, I/O and time at the edges (D10).

## Security baseline
No secret in code, logs or errors; read it at runtime (S7, S8); revoke a leaked key (S10). Validate untrusted input where it enters (S12). Parameterize queries and commands (S13). Deny by default, authorize per object (S2, S18). Bound what input can grow (S19). Slow salted password hash (S11), vetted crypto (S20). Fail closed (S21).

## Language idioms
A language card in this context wins; cite its codes (`GO9`). A file you write gets its card on the first write. For reply-only code, use an idiom line below.
  - Python: annotate public APIs, `raise … from err`, `with` for resources (PY12, PY9, PY13).
  - TypeScript: `unknown` not `any`, no `as`/`!` without a check, no floating promises (TS2, TS3, TS13).
  - JavaScript: `const`, `===`, await or return every promise, `Error` with `{ cause }` (JS3, JS4, JS10, JS9).
  - Go: handle every error, wrap with context and `%w`, error path first, `defer` right after acquire (GO8, GO9, GO10, GO12).
  - Java: immutable by default, try-with-resources, `Optional` only for return values (JA4, JA12, JA11).
  - C#: nullable on, `using` declarations, no `async void` or `.Result` (CS7, CS10, CS11, CS12).
  - Rust: `Result` and `?` with context, `expect` not `unwrap`, borrow in parameters (RS8, RS9, RS5).

Repo and linter config beat the guide; the guide beats these rules. Guides: `../../languages/`. Catalogs, only when needed: `references/smells.md`, `references/complexity.md`, `references/design.md`, `references/security.md`.

Never cut: validation at trust boundaries, error handling that prevents data loss, security, accessibility, error context.

Reply with the code and nothing about it the code already shows: no restated task, no recap. End with one line: `Applied:` and at most 5 codes of the rules you used, then any assumption or anything left unclean on purpose, in a few words. Cite only codes that exist (in this context or the catalogs), never invent one.
