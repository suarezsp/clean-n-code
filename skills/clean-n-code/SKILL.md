---
name: clean-n-code
description: >
  Clean code mode from Robert C. Martin's Clean Code: names that reveal intent,
  small functions that do one thing, comments only for the why, errors with
  context, clean tests. Reinforces ponytail: ponytail decides what code to
  write, clean-n-code decides how it reads. Use on any coding task and when the
  user says "clean code", "clean-n-code", "make it readable", "uncle bob".
license: MIT
---

# Clean-n-code

You write code the next reader understands at a glance. You work alongside ponytail. Ponytail decides **what** gets written: scope, YAGNI, the smallest diff. You decide **how** it reads. When the two seem to conflict, ponytail's scope wins. Readability is achieved inside that scope, never by adding scope.

Active for the whole session until the user says "stop clean-n-code".

## Names
- Reveal intent: why it exists, what it does, how it is used. If a name needs a comment, rename it.
- Make name length follow scope: `i` for a three-line loop, precise words for anything wider.
- Use one word per concept across the codebase. No puns, no encodings (`m_`, type prefixes), no noise words (`Data`, `Info`, `Manager`).
- Functions are verbs and say every effect: whether they mutate or return new, and what they create. Classes are nouns.
- Use the repo's domain language. Use pattern names when you implement a pattern.

## Functions
- Do one thing, at one level of abstraction below the name. Order code so callers sit above callees and it reads top-down.
- Aim for few arguments, ideally 0 to 2. No boolean flags or selector arguments: write two functions. No output arguments.
- Either change state or answer a question, never both.
- No hidden side effects. If order matters, make each step take the previous step's result.
- Name complex conditions (`shouldBeDeleted(timer)`), prefer positive conditions, and use explanatory variables for intermediate values.

## Comments
- Explain the why the code cannot show: intent, a warning, a non-obvious constraint. Everything else becomes a better name or function.
- Never leave commented-out code, change logs, bylines or comments that just restate the code.
- A deferral uses the existing marker: `shortcut: <limit>, <when to upgrade>`.

## Errors
- Use the language's idiomatic error mechanism, not magic return codes. Every error says what operation failed and why.
- Keep error handling apart from the happy path. In a function that handles errors, `try` comes first and nothing follows the `catch`.
- Don't return or pass null when an empty collection, a special-case object, an optional or an error fits.
- Never swallow an exception silently. If ignoring it is intended, the name says so (`closeIgnoringException`).

## Tests
- Hold test code to the same standard as production code. Tests must be Fast, Independent, Repeatable (no network, locale or clock dependence), Self-validating and Timely.
- One concept per test. Follow build-operate-check. Test boundary values.

## Structure
- A class has one reason to change. Split it when it really has two, not before.
- Talk to direct collaborators only: no `a.getB().getC()`. Tell objects what to do instead of asking for their internals.
- Use plain data structures for data and objects for behavior. Don't build hybrids.
- Defaults and config live at the top level and are passed down. No magic numbers or strings.

## Complexity & design
- Keep each function at cyclomatic complexity 10 or under, and nesting at 2 or under. Lower them for real: use guard clauses, named conditions, a lookup table instead of an if-ladder, and polymorphism only for a type switch that repeats. Never add helpers that only exist to shrink a number.
- Hide each decision likely to change (a format, a protocol, a rule) behind one module. Dependencies point inward: domain logic never imports the framework.
- Keep logic pure and push I/O, time and randomness to the edges. Use the paradigm the language and repo are idiomatic in.
- Pick the data structure by how it is accessed. Choose the simple algorithm, and measure before optimizing. A new dependency is inspected first (only after ponytail's order says one is needed).
- Details and codes: `references/complexity.md` (K1–K8) and `references/design.md` (D1–D16). They apply to code the task touches, never as a reason to add scope.

## When rules collide
- Repo, linter and team conventions beat these rules.
- Clean only the code your change already touches (Boy Scout), with small local improvements, and name them in the reply.
- Add an abstraction, wrapper or interface only when the duplication or volatility already exists, never "for later".
- More lines are fine when they buy clarity. More lines for speculation are not.
- To refactor existing code: tests first, then tiny steps, with the full suite green after each step.

Never cut: anything ponytail never cuts (validation at trust boundaries, error handling that prevents data loss, security, accessibility), and error context.

End your reply with one line naming the clean-code rules you applied, using the codes from `references/smells.md`, `references/complexity.md` and `references/design.md` (for example `N7, G28, K3`), plus anything you left unclean on purpose.
