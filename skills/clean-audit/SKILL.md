---
name: clean-audit
description: >
  Clean-code audit of a repo or folder, ranked by cost to read and change. Report only. Use for "clean code audit", "code smells in this repo", "how readable is this codebase", /clean-audit.
---

Audit the code like the developer who just inherited it and must change it every week. Rank by cost to the next reader. Bugs, security and load are out of scope (`/clean-secure` covers security); mention any you see in one line under `Also noticed:`.

## 1. Map first

- Audit what the user names: a folder, a package, or the whole repo. If nothing is named, audit the whole repo.
- Read the README, the entry points and the tests. Find the repo's conventions (linter and formatter config, style of the core modules). These conventions beat the book.
- Find the hot spots: the files changed most often (`git log --format= --name-only | sort | uniq -c | sort -rn | head`), the largest files, the core domain. Go deep there instead of reading file by file. Say which parts you did not read.
- Read from `../clean-n-code/references/` (relative to this skill's base directory): always `smells.md`; `complexity.md` when a hot-spot function branches, nests or runs long; `design.md` only when a finding involves module boundaries, dependencies or data structures.
- For each language the repo touches, use the card already in your context and cite its codes; read the full guide in `../../languages/` (`python.md`, `go.md`…) only for a code the card lacks or when no card is in context. Its idioms beat the general catalogs, and the repo's config beats both.
- Measure control-flow complexity and length of the hot-spot and core functions as `complexity.md` → "Measure; don't guess" says (repo linter rule first, then a run-once tool, else count by hand and say so). Length is K9's count: the function's own lines only, never the imports, types or code around it.

## 2. Look for

- The same list as `/clean-review`: misleading code, code that is hard to read, hard to change, error-handling style, tests, clutter.
- Plus repo-wide patterns:
  - the same switch or if chain repeated across modules (G5, G23);
  - God classes with many reasons to change (SRP);
  - inconsistent vocabulary for one concept (G11, "one word per concept");
  - a build or test run that needs more than one command (E1, E2);
  - tests that depend on the network, locale or clock (F.I.R.S.T.);
  - ignored or disabled tests (G4, T4);
  - the most complex functions, ranked by measured CC, nesting and own length times how often the file changes (K1, K2, K9);
  - decisions leaking across modules, dependencies pointing outward, framework code inside the domain (D1, D5, D6);
  - code that fights the language's idioms across many files (codes from its guide in `../../languages/`);
  - dependencies that fail the D12 checks (abandoned, a known vulnerability, used for a few lines).

## 3. Check before you report

- Every finding needs a concrete cost, and a repeated pattern needs real examples with paths.
- Before calling code unused, grep the whole tree, including tests, config and dynamic references.
- A `shortcut:` comment that names its limit is a decision, not a finding.
- The smallest fix wins. Prefer deleting. No new layers. Repo conventions win.

## 4. Output

Use short sentences and everyday words. Start with `What this repo does:` in two sentences, plus which parts you read deeply.

Then list findings under **Must fix**, **Should fix** and **Nice to have**, most costly first, numbered across groups. List at most 20; if you left smaller ones out, say how many. Each finding has a bold title with `path:lines` and the heuristic codes, followed by **What this is**, **Problem**, **Fix** and **If we skip it** (one or two short sentences each, in the same format as `/clean-review`).

End with:
- `Verdict:` one line: what to clean first, or `Clean. Nothing to fix.`
- `Also noticed:` any bug, or security issue for `/clean-secure`.
- `Not checked:` the parts you did not read.

One-shot report, changes no code.
