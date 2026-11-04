---
name: clean-help
description: >
  Quick reference card for clean-n-code skills and which review to
  run. One-shot display. Use for /clean-help, "clean-n-code help",
  "how do I use clean-n-code".
---

Display this card. It is a one-shot: change nothing.

## Skills

| Skill | Trigger | What it does |
|-------|---------|--------------|
| **clean-n-code** | always on (session hook), `/clean-n-code` | Writes code that reads clean: names, small functions, why-only comments, errors with context, clean tests. |
| **clean-review** | `/clean-review` | Reviews a change for readability and design smells; each finding cites a Clean Code heuristic code. |
| **clean-audit** | `/clean-audit` | The same review for a whole repo or folder, ranked by cost to the next reader. |
| **clean-secure** | `/clean-secure` | Security review of a change or repo: secrets and API keys, access control, injection, limits, crypto, logging, dependencies. Each finding cites an S code, a CWE id and a concrete attack. |
| **clean-refactor** | `/clean-refactor` | Fixes the findings without changing behavior: tests first, tiny steps, suite green after each step. |
| **clean-help** | `/clean-help` | This card. |

## Which review

- `/clean-review` covers readability and design.
- `/clean-secure` covers security.

Run both before a merge. Scope always wins: the smallest change that fully solves the task, made readable and secure inside that scope.

A `PreToolUse` hook also blocks writing secret-shaped values (AWS, GitHub, Slack, Stripe, Anthropic, OpenAI and Google keys, PEM private keys) into files.

Plugin skills are also reachable by their namespaced name, e.g. `/clean-n-code:clean-review` (needed in `claude -p`).

## Heuristic codes

C = comments, E = environment, F = functions, G = general, J = Java, N = names, T = tests: `references/smells.md` (Clean Code, ch. 17).
K = control-flow complexity and function length (cyclomatic, cognitive, K9 counts the function's own lines only, with measuring commands): `references/complexity.md`.
D = design, architecture, paradigms, dependencies, algorithms: `references/design.md`.
S = security baseline (principles, secrets, input, access control, crypto, failure, supply chain), with CWE ids: `references/security.md`.
All four live in `skills/clean-n-code/references/`.
Language guides in `languages/`, one per language, each built from that language's official manuals and style guides: PY Python, JS JavaScript, TS TypeScript, JA Java, CS C#, CP C++, GO Go, PH PHP, SQ SQL, SH Bash, CL C, RS Rust. Each catalog lists its sources at the top.

## See the difference

Run `npm run ab -- "<prompt>"` in the plugin repo to run one prompt without and with clean-n-code (isolated from your other plugins) and diff the two answers. Results go to `ab-results/`.

## Turn it off

- Say "stop clean-n-code" for the rest of the session.
- Set `export CLEAN_N_CODE=off` to skip the session hook entirely.
- Set `export CLEAN_N_CODE_SECRETS=off` to disable the secret-blocking hook.
- Set `export CLEAN_N_CODE_CHECK=off` to disable the check that sends back a closing line citing codes that don't exist.
- Run `/plugin disable clean-n-code` to disable the plugin.
