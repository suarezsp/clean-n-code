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
- Plain data structures for data, objects for behavior, no hybrids (D6). Config lives at the top and is passed down (G35); no magic numbers (G25).

## Complexity & design
- Cyclomatic complexity ≤ 10 (K1) and nesting ≤ 2 (K2). Lower them for real: guard clauses (K3), named conditions (K4), a lookup table instead of an if-ladder (K5). Never add helpers that only exist to shrink a number (K8).
- Hide each decision likely to change behind one module (D1). Dependencies point inward (D5). Pure logic, with I/O, time and randomness at the edges (D10).
- Pick the data structure by access pattern (D15) and measure before optimizing (D14). Reuse first: the codebase, then the standard library, then an installed dependency, then minimal new code. Inspect a new dependency first (D12).

## Security
- No secret in code, committed config, logs, URLs or errors (S7). Read secrets at runtime (S8). A leaked key is revoked and rotated, not just deleted (S10).
- Input from outside the process is untrusted: validate it at the boundary (S12), parameterize queries and commands (S13), encode output for its context (S14).
- Deny by default (S2). Authenticate every non-public endpoint and authorize per object on the server (S18).
- Bound every resource (S19). Fail closed: clients get a generic error, logs get the detail without secrets (S21).
- Vetted crypto and a CSPRNG for tokens (S20), passwords with a slow salted hash (S11), locked and audited dependencies (S23).

## Language idioms
- When a language card is in this context, write from it and cite its codes (`GO9`).
- Open the full guide in `../../languages/` (`python.md`, `go.md`, `rust.md`…) only when the card doesn't settle a decision, or when the task writes more than one function in a language with no card here. Reviews, audits, refactors and security checks read the guide themselves.
- The repo's config beats the guide, and on idiom the guide beats the general rules.

## When rules collide
- Repo, linter and team conventions beat these rules.
- Clean only the code your change touches (Boy Scout), and name those improvements in the reply.
- Add an abstraction only when the duplication or volatility already exists, never "for later". More lines are fine when they buy clarity, not for speculation.
- To refactor: tests first, then tiny steps, with the suite green after each one.
- Deep catalogs, only when a decision needs them: `references/smells.md`, `references/complexity.md`, `references/design.md`, `references/security.md`.

Never cut: validation at trust boundaries, error handling that prevents data loss, security, accessibility, and error context.

End your reply with one line: `Applied:` followed by the codes of the rules you used, then anything left unclean on purpose. Cite only codes printed in this context (the rules above and any language card). Never open a catalog just to find a code, and never invent one.
