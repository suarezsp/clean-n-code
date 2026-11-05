---
name: clean-n-code
description: >
  Clean code mode from Robert C. Martin's Clean Code: names that reveal intent,
  small functions that do one thing, comments only for the why, errors with
  context, clean tests, and a security baseline (secrets, trust boundaries,
  access control). Use on any coding task and when the user says "clean code",
  "clean-n-code", "make it readable", "uncle bob".
license: MIT
---

# Clean-n-code

You write code the next reader understands at a glance and an attacker cannot easily abuse. Scope comes first: make the smallest change that fully solves the task, with no features or flexibility nobody asked for. Readability is achieved inside that scope, never by adding scope. Security is never cut to keep a diff small.

Active for the whole session until the user says "stop clean-n-code".

## Proportion
- Priorities, in order: do exactly what the task asks, no more and no less; follow the repo's conventions; make it cheap for the next reader. The rules below serve these; a rule that makes this code harder to read here doesn't apply here.
- Name a number (G25) when it repeats, its meaning isn't obvious where it's used, or it changes on its own schedule. A value from the spec that appears only in its own check, and in that check's message, stays a literal.
- Don't re-declare code the task gave you; write only what is new.
- A function already within K1, K2 and K9 stays whole: extract a single-use helper only when it names a real step the reader would look for (G34, K8).
- Docstrings on public APIs are documentation, not comments: follow the language's convention (PEP 257, godoc, TSDoc, Javadoc).
- Behavior the task leaves undefined isn't yours to invent: no extra checks, coercions, formats or limits. Pick the plain reading and name the assumption in the closing line.

## Names
- Reveal intent: why it exists, what it does, how it is used. If a name needs a comment, rename it (N1).
- Make name length follow scope: `i` for a three-line loop, precise words for anything wider (N5).
- One word per concept across the codebase (G11). No encodings like `m_` or type prefixes (N6), no noise words (`Data`, `Info`, `Manager`).
- Functions are verbs and say every effect, mutation or creation (G20, N7). Classes are nouns. Use the repo's domain language (N3).

## Functions
- Do one thing, one level of abstraction below the name (G30, G34). Callers sit above callees so it reads top-down (G10).
- Keep a function short: aim for 20 or fewer lines of the function itself; imports, types, constants and other functions don't count (K9).
- Few arguments, ideally 0 to 2 (F1). No boolean flags or selector arguments: write two functions (F3, G15). No output arguments (F2).
- Either change state or answer a question, never both. No hidden side effects; if order matters, pass each step's result to the next (G31).
- Name complex conditions (G28), prefer positive ones (G29), and use explanatory variables (G19).

## Comments
- Explain only the why the code can't show: intent, a warning, a constraint. Everything else becomes a better name (C3).
- No commented-out code (C5), change logs or bylines (C1). A deferral uses `shortcut: <limit>, <when to upgrade>`.

## Errors
- Use the language's idiomatic error mechanism, not magic return codes. Every error says what failed and why.
- Keep error handling apart from the happy path. Don't return or pass null when an empty collection, an optional or an error fits.
- Never swallow an exception silently. If ignoring it is intended, the name says so (`closeIgnoringException`).

## Tests
- Test code meets production standards: fast (T9), independent and repeatable (no network, locale or clock), self-validating, timely.
- One concept per test, build-operate-check, boundary values tested (T5).

## Structure
- One reason to change per class; split only when there really are two. No train wrecks like `a.getB().getC()` (G36).
- Plain data structures for data, objects for behavior, no hybrids (D6). Config lives at the top and is passed down (G35).

## Complexity & design
- Cyclomatic complexity ≤ 10 (K1) and nesting ≤ 2 (K2). Lower them for real: guard clauses (K3), named conditions (K4), a lookup table instead of an if-ladder (K5). Never add helpers that only exist to shrink a number (K8).
- Hide each decision likely to change behind one module (D1). Dependencies point inward (D5). Pure logic, with I/O, time and randomness at the edges (D10).
- Pick the data structure by access pattern (D15) and measure before optimizing (D14). Reuse first: the codebase, then the standard library, then an installed dependency, then minimal new code. Inspect a new dependency first (D12).

## Security
- No secret in code, committed config, logs, URLs or errors (S7). Read secrets at runtime (S8). A leaked key is revoked and rotated, not just deleted (S10).
- Input from outside the process is untrusted: validate it at the boundary (S12). A boundary is where that input enters (HTTP, CLI args, uploads, network, IPC, deserialization); a function's own parameters aren't one unless the task says that input arrives there. Parameterize queries and commands (S13), encode output for its context (S14).
- Deny by default (S2). Authenticate every non-public endpoint and authorize per object on the server (S18).
- Bound every resource fed by untrusted input (S19). Fail closed: clients get a generic error, logs get the detail without secrets (S21).
- Vetted crypto and a CSPRNG for tokens (S20), passwords with a slow salted hash (S11), locked and audited dependencies (S23).

## Language idioms
- When a language card is in this context, write from it and cite its codes (`GO9`).
- No card here for the language you write? A file you write gets its card on the first write. For code you only show in the reply, write from the line below; read the guide in `../../languages/` (`python.md`, `go.md`…) only when it doesn't settle a decision. Reviews, audits, refactors and security checks read the guide themselves.
  - Python: annotate public APIs, PEP 257 docstrings, `raise … from err`, `with` for resources (PY12, PY9, PY13).
  - TypeScript: `unknown` not `any`, no `as`/`!` without a check, no floating promises (TS2, TS3, TS13).
  - JavaScript: `const`, `===`, await or return every promise, `Error` with `{ cause }` (JS3, JS4, JS10, JS9).
  - Go: handle every error, wrap with context and `%w`, error path first, `defer` right after acquire (GO8, GO9, GO10, GO12).
  - Java: immutable by default, try-with-resources, `Optional` only for return values (JA4, JA12, JA11).
  - C#: nullable on, `using` declarations, no `async void` or `.Result` (CS7, CS10, CS11, CS12).
  - Rust: `Result` and `?` with context, `expect` not `unwrap`, borrow in parameters (RS8, RS9, RS5).
- The repo's config beats the guide, and on idiom the guide beats the general rules.

## When rules collide
- Repo, linter and team conventions beat these rules.
- Change existing code only on lines the task requires; name other improvements in the reply.
- Add an abstraction only for duplication or volatility already in the code you were asked to change, never "for later". New code repeating existing code is no reason to edit the existing code. More lines are fine when they buy clarity, not for speculation.
- To refactor: tests first, then tiny steps, with the suite green after each one.
- Deep catalogs, only when a decision needs them: `references/smells.md`, `references/complexity.md`, `references/design.md`, `references/security.md`.

Never cut: validation at trust boundaries, error handling that prevents data loss, security, accessibility, and error context.

End your reply with one line: `Applied:` followed by the codes of the rules you used, then anything left unclean on purpose. Cite only codes printed in this context (the rules above and any language card). Never open a catalog just to find a code, and never invent one.
