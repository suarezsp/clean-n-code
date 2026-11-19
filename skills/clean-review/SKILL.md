---
name: clean-review
description: >
  Readability and design review of a change, citing rule codes. Report only. Use for "clean review", "readability review", "is this clean code", "code smells in this diff", /clean-review.
---

Review a change like a careful senior reader who must change this code next month. The question is: how much does this code cost the next person to read and change? Bugs, security holes and load problems are out of scope; `/clean-secure` covers security. If you see one, mention it in a single line under `Also noticed:` and move on.

## 1. Understand first

- Review what the user names: uncommitted or staged changes, a branch, a PR, files. If nothing is named, review the uncommitted changes, or the last commit if there are none.
- Read the diff, then the code around it: callers of changed functions, the functions it calls, and its tests.
- Find the repo's conventions: linter and formatter config, the style of neighbouring files, naming habits. These conventions beat the book. A finding never asks for something the repo deliberately does differently.
- Read from `../clean-n-code/references/` (relative to this skill's base directory): always `smells.md`; `complexity.md` when a touched function branches, nests or runs long; `design.md` only when the change adds or moves modules, dependencies or data structures.
- For each language the change touches, use the card already in your context and cite its codes; read the full guide in `../../languages/` (`python.md`, `go.md`…) only for a code the card lacks or when no card is in context. Its idioms beat the general catalogs, and the repo's config beats both.
- Measure control-flow complexity and length of the touched functions as `complexity.md` → "Measure; don't guess" says (repo linter rule first, then a run-once tool, else count by hand and say so). Length is K9's count: the function's own lines only, never the imports, types or code around it.

## 2. Look for (in this order)

1. **Misleading code:** a name that lies or hides a side effect (N4, N7, G20), a comment that is wrong (C2), surprising behavior (G2), a hidden temporal coupling (G31).
2. **Hard to read:** a function doing several things or mixing abstraction levels (G30, G34), flag or selector arguments (F3, G15), too many arguments (F1), obscured intent (G16, G19, G25, G28, G29), a train wreck (G36).
3. **Hard to change:** true duplication (G5), code in the wrong place (G6, G13, G14, G17), a repeated switch on a type (G23), data/object hybrids, config buried low (G35).
4. **Error handling style:** errors without context, null returned or passed where a better option exists, error handling tangled with the happy path, a silently swallowed exception.
5. **Tests:** a changed boundary without a test (T5), tests that are not repeatable or independent (F.I.R.S.T.), several concepts in one test, test code dirtier than production code.
6. **Complexity:** functions over the limits with their measured numbers (K1, K2, and K9 length over 40), arrow code (K3), tangled conditions (K4), type ladders and scattered special cases (K5, K6), flag-driven flow (K7). A flat dispatch is not a finding.
7. **Design:** a decision likely to change leaking into many places (D1, D4), domain code importing the framework or I/O mixed into logic (D5, D9, D10), a new dependency added without the D12 checks, an O(n²) loop over large input or a needlessly clever algorithm (D15, D16). Only inside the change; never ask for a new architecture.
8. **Non-idiomatic code** for the language: rules from its guide (PY, JS, TS, JA, CS, CP, GO, PH, SQ, SH, CL, RS codes), for example a bare `except:` (PY9) or a discarded Go error (GO8).
9. **Clutter:** dead code (G9, F4), commented-out code (C5), redundant or noise comments (C3, C1), unused variables (G12).

## 3. Check before you report

- Every finding needs a concrete cost: "a reader will think X but the code does Y", or "adding a new Z means editing these N places". No cost, no finding.
- Re-read the lines and confirm the claim. Before calling code unused, grep for it.
- A `shortcut:` comment that names its limit is a decision, not a finding.
- Propose the smallest fix: rename, extract, inline, delete. Prefer deleting. Never propose an abstraction, interface or wrapper for a single use. Clean-code fixes stay inside the change's scope.
- No pure taste, no "consider", no rule applied against the repo's convention.

## 4. Output

Use short sentences and everyday words. Start with `What this change does:` in two sentences.

Then list findings under **Must fix** (misleading code), **Should fix** (hard to read or change, missing boundary test) and **Nice to have** (clutter, small renames). Skip empty groups. Number findings across all groups. Each finding:

3. **`calc(true)` hides two calculations** (`pay/weekly.py:L12-30`) `[F3, G15]`
   - **What this is:** Weekly pay, with or without overtime, chosen by a boolean.
   - **Problem:** `calc(true)` at the call site does not say what `true` means; readers must open the function.
   - **Fix:** Split into `straight_pay()` and `overtime_pay()`; the two callers each pick one.
   - **If we skip it:** Every new reader opens `calc` to learn what the flag does, and the next variant adds a second flag.

End with:
- `Verdict: Clean.` or `Verdict: fix 1 and 3 first.`
- `Also noticed:` one line per bug, or security issue for `/clean-secure`, if any.
- `Not checked:` one line, if something mattered and you could not check it.

If nothing is found: `What this change does:`, then `Reads clean. Ship.` and one line on what you checked.

Lists findings, changes no code. To apply fixes, the user runs `/clean-refactor`.
