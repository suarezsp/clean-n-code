---
name: clean-help
description: >
  Quick reference card for clean-n-code skills and how they pair with
  ponytail. One-shot display. Use for /clean-help, "clean-n-code help",
  "how do I use clean-n-code".
---

Display this card. It is a one-shot: change nothing.

## Skills

| Skill | Trigger | What it does |
|-------|---------|--------------|
| **clean-n-code** | always on (session hook), `/clean-n-code` | Writes code that reads clean: names, small functions, why-only comments, errors with context, clean tests. |
| **clean-review** | `/clean-review` | Reviews a change for readability and design smells; each finding cites a Clean Code heuristic code. |
| **clean-audit** | `/clean-audit` | The same review for a whole repo or folder, ranked by cost to the next reader. |
| **clean-refactor** | `/clean-refactor` | Fixes the findings without changing behavior: tests first, tiny steps, suite green after each step. |
| **clean-help** | `/clean-help` | This card. |

## With ponytail

Ponytail decides **what** code exists: scope, YAGNI, the smallest diff. Clean-n-code decides **how** it reads. When they conflict, ponytail's scope wins.

Reviews split the same way:
- `/ponytail-review` covers bugs, security, load and bloat.
- `/clean-review` covers readability and design.

Run both before a merge.

Plugin skills are also reachable by their namespaced name, e.g. `/clean-n-code:clean-review` (needed in `claude -p`).

## Heuristic codes

C = comments, E = environment, F = functions, G = general, J = Java, N = names, T = tests: `references/smells.md` (Clean Code, ch. 17).
K = control-flow complexity (cyclomatic and cognitive, with measuring commands): `references/complexity.md`.
D = design, architecture, paradigms, dependencies, algorithms: `references/design.md`.
All three live in `skills/clean-n-code/references/`. Their sources are listed in `knowledge.md`.

## Turn it off

- Say "stop clean-n-code" for the rest of the session.
- Set `export CLEAN_N_CODE=off` to skip the session hook entirely.
- Run `/plugin disable clean-n-code` to disable the plugin.
