---
name: clean-refactor
description: >
  Refactor without changing behavior: tests first, tiny steps. Edits code. Use for "clean this up", "refactor this", "fix the smells", "apply finding 2 and 5", /clean-refactor.
---

Refactor like Uncle Bob in the Args and SerialDate case studies: no rewrite, the same behavior, many tiny steps that keep the system working. "Make it work, then make it right."

## 0. Scope

- Refactor what the user names: findings by number from a review or audit, a file, or a function. If nothing is named, refactor the code changed in the current uncommitted diff.
- Keep the edits inside that scope. Do not touch code outside it, except for callers that a rename or signature change forces you to update.
- Read from `../clean-n-code/references/` (relative to this skill's base directory): always `smells.md`; `complexity.md` when complexity or length is a target; `design.md` only when the refactor moves code between modules. Repo conventions beat the book.
- Read the language guide in `../../languages/` for the language you touch; refactor toward its idioms (cite its codes), never against the repo's config.
- When complexity or length is a target, measure CC, nesting and K9 length (the function's own lines) of the touched functions **before** starting, with the tool `complexity.md` names. Use the same tool for the after-numbers.

## 1. Pin the behavior first

- Find the single command that runs the tests (E2). If there is none, find out how the repo runs them and say so.
- Check that the code you will touch is covered. If it is not, write **characterization tests** first: tests that pin what the code does today, including its boundaries, even where that behavior looks wrong. Run them green before changing anything.
- If you find behavior that looks like a bug, do not fix it silently. Note it, and fix it only as a separate, named step if the user asked for fixes.
- If the code cannot be tested and you cannot make it testable with a minimal seam, stop. Report why, and do not refactor blind.

## 2. Tiny steps

- Make one change at a time: rename, extract function, extract variable, inline, move, introduce parameter, split flag function, replace magic number, delete dead code.
- After **every** step, run the full suite: unit and acceptance tests. If anything breaks, fix it before the next step. Never stack changes on a red suite.
- For a structural swap (one data structure for another, one API for another), use parallel change: add the new structure, migrate users one by one, then delete the old one.
- Putting something in so you can take it out later is normal. Undo earlier steps when a better shape appears.
- Delete what becomes unused right away (G9, F4). Code that only its own tests call is dead.
- Never add an abstraction, interface or wrapper the code does not already need. Never change public behavior or output.
- Renaming or removing a public function changes its API. Delete the old name only when a grep of the whole repo proves nobody calls it. Otherwise, keep it as a one-line delegate and list it under `Left for later`.

## 3. Stop

Stop when the named findings are fixed, or when the next step would grow the scope. If you were tempted to keep going, list those ideas instead of doing them.

## 4. Output

- `Refactored:` what changed, as a short numbered list of steps, each with its heuristic codes (for example `renamed calc → overtime_pay [N1, F3]`).
- `Tests:` the command you ran and the final result, and any characterization tests you added.
- `Complexity:` before → after per function (for example `pay  CC 12→4  nesting 4→1`), the tool used, or `counted by hand`. If a number went up, say why.
- `Behavior questions:` suspicious behavior you pinned but did not change.
- `Left for later:` what you deliberately did not touch.
