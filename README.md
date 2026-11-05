<div align="center">

<img src="docs/readme_banner.png" alt="The only valid measurement of code quality: WTFs/minute — good code vs AI code" width="300" />

# clean-n-code

### Actual Clean code skills for Claude Code.

**Based on actual literature about clean code, written by engineers and for engineers.**

clean-n-code decides **how code reads**: intent-revealing names, flat functions, and reviews that cite the heuristic behind each finding and tries to make the best decisions when it comes to the logic behind the idea.

[Quick Start](#quick-start) | [Skills](#what-you-can-do) | [How It Works](#how-it-works) | [Testing](#testing)

[![Claude Code](https://img.shields.io/badge/Claude_Code-plugin-D97757?style=for-the-badge&logo=anthropic&logoColor=white)](https://docs.claude.com/en/docs/claude-code)
[![Node](https://img.shields.io/badge/Node-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/tests-179_unit_+_11_evals-2EA44F?style=for-the-badge)](#testing)
[![Clean Code](https://img.shields.io/badge/based_on-Clean_Code_(2009)-555555?style=for-the-badge)](skills/clean-n-code/references/)

**MIT** | Claude Code plugin | Skills + SessionStart, secret-blocking and after-write hooks

</div>

---

> **clean-n-code** turns Robert C. Martin's *Clean Code* into skills an agent follows while it works. It is backed by primary sources on cyclomatic and cognitive complexity (NIST/McCabe, SonarSource), module design (Parnas), architecture, dependencies and algorithms. It also carries a security baseline every piece of software should meet, from Saltzer & Schroeder's design principles, the OWASP Secrets Management Cheat Sheet, NIST SP 800-63B-4, the 2025 CWE Top 25, the OWASP Top 10:2025 and the OWASP API Security Top 10. Every rule carries a short code (`G5`, `N7`, `K3`, `D12`, `S13`), so reviews cite the heuristic behind each finding, the way the book does.

> We believe that actual literature can help agents improve their reasoning, specially when inside their context and rules.
---

## What is clean-n-code?

clean-n-code is a **Claude Code plugin**: one always-on mode, a hook that blocks writing secrets, and four slash-command skills.

- **Always-on mode** writes readable code while the agent works: intent-revealing names, functions at one level of abstraction, cyclomatic complexity of 10 or less, nesting of 2 or less, errors with context, F.I.R.S.T. tests, and a security baseline: no secrets in code, untrusted input validated at the boundary, deny by default, bounded resources, fail closed.
- **Language guides** in `languages/` cover the 10 most used languages (Stack Overflow Developer Survey 2025) plus C and Rust: Python, JavaScript, TypeScript, Java, C#, C++, Go, PHP, SQL, Bash, C and Rust. Each one is built from the language's own manuals and the engineering literature (PEPs, Effective Go, C++ Core Guidelines, SEI CERT C, Rust API Guidelines, Microsoft Learn, PER Coding Style…), with citable codes (`PY4`, `GO9`, `RS11`). The mode gets each guide's short card for the project's languages at session start, and for any other language the first time it writes a file in it. For code it only shows in the reply, the always-on rules carry one idiom line per common language.
- **Secret-blocking hook** rejects any Write or Edit that would put a known key format (AWS, GitHub, Slack, Stripe, Anthropic, OpenAI, Google, PEM private keys) into a file.
- **Review, audit, and refactor skills** measure complexity, cite rule codes, and keep fixes inside the existing task scope. Readability is achieved inside the scope, never by adding scope.

```text
/clean-review          # readability/design review of your current change
/clean-secure          # security review: secrets, access control, injection, limits
/clean-audit           # the same for a whole repo, ranked
/clean-refactor        # fix findings without changing behavior
```

---

## Preview

The output below is a real `/clean-review` finding from the eval suite.

```text
3. Arrow code: 6 levels of nesting (orders.py:L3-12) [K2, K3, G30]
   - What this is: ship CC=8 (flake8 mccabe), nesting=6 (counted by hand), cognitive ≈ 31.
   - Problem: the real action, shipped.append(item), sits six levels deep in two places.
   - Fix: guard clauses for paid/cancelled, then one append with a named condition.
   - If we skip it: each new rule adds another level and the two appends drift apart.

I left `label` alone on purpose. It's a flat dispatch (CC=6, nesting 1), so it isn't a finding.
Also noticed: express items with qty <= 0 are added to the list; probably a bug, out of scope for this review.
```

---

## What You Can Do

| Skill | Trigger | Edits code | Description |
|-------|---------|:----------:|-------------|
| **clean-n-code** | always on (session hook) | as part of your task | Writes code that reads clean; ends each reply with the rule codes it applied. |
| **clean-review** | `/clean-review` | NO | Reviews a change for naming, function design, complexity, design and tests. Each finding has a code, a concrete cost and the smallest fix. |
| **clean-secure** | `/clean-secure` | NO | Security review of a change or repo. Maps trust boundaries, then checks secrets, access control (BOLA), injection, limits, crypto, logging and dependencies. Each finding has an S code, a CWE id and a concrete attack. |
| **clean-audit** | `/clean-audit` | NO | Reviews the whole repo, ranked by cost to the next reader and by measured complexity × churn. |
| **clean-refactor** | `/clean-refactor` | YES | Characterization tests first, then tiny steps with the suite green after each one. Reports complexity before → after. |

*In `claude -p` (headless), use the namespaced names, for example `/clean-n-code:clean-review`.*

---

## Problem It Solves

- **Agents write code that works but reads badly.** It comes out with vague names, nested arrow code, flag arguments and comments that restate the code. The always-on mode prevents this while the code is being written.
- **Human reviewers catch complexity that tools miss.** clean-n-code measures cyclomatic complexity, then reasons like a reader would: cognitive complexity, nesting, guard clauses, and not flagging a flat dispatch.
- **Bug reviews and readability reviews get mixed up.** `/clean-review` covers readability and design; security findings go to `/clean-secure`, which owns them.
- **Agents paste API keys into code.** The hook blocks the write before it happens, and the always-on rules say where secrets live instead and what to do when one leaks (revoke, rotate, then clean up).

> `As AI improves, reviewing code is more and more difficult, specially in big projects. This tool improves that, so not only you can understand what is going on and make better decisions, but AI can make less mistakes when updating, upgrading, refactoring...`

---

## How It Works

```
.claude-plugin/
  plugin.json            plugin manifest (hooks → hooks/hooks.json)
  marketplace.json       local marketplace for /plugin install
hooks/
  hooks.json             SessionStart + SubagentStart → activate.js; PreToolUse (Write|Edit|MultiEdit) → block-secrets.js;
                         PostToolUse (Write|Edit|MultiEdit) → after-write.js; Stop → check-codes.js
  activate.js            injects skills/clean-n-code/SKILL.md as session context, with catalog and languages/ paths made absolute (CLEAN_N_CODE=off skips it)
  block-secrets.js       exits 2 on secret-shaped values, so Claude Code rejects the write (CLEAN_N_CODE_SECRETS=off skips it)
  after-write.js         after a write: sends the language card the first time a session writes a language whose card isn't
                         in context yet (once per language per session)
  check-codes.js         sends the turn back once if the closing line cites a code that doesn't exist (CLEAN_N_CODE_CHECK=off skips it)
lib/                     codes.js (rule codes, languages, cards), session.js (cards already in context), lizard.js (A/B metrics)
skills/
  clean-n-code/          always-on ruleset (≤ 8000 characters as injected, enforced by a test)
    references/
      smells.md          C/E/F/G/J/N/T: Clean Code ch. 17 heuristics, with book page numbers
      complexity.md      K1-K9: cyclomatic and cognitive complexity, limits, refactorings, measuring commands
      design.md          D1-D16: modules, architecture, state and paradigms, dependencies, algorithms
      security.md        S1-S25: Saltzer & Schroeder principles, secrets and API keys, input, access control, crypto, failure, supply chain, memory
  clean-review/  clean-secure/  clean-audit/  clean-refactor/
languages/               one guide per language, ≤ 80 lines, citable codes: python.md (PY) javascript.md (JS)
                         typescript.md (TS) java.md (JA) csharp.md (CS) cpp.md (CP) go.md (GO) php.md (PH)
                         sql.md (SQ) bash.md (SH) c.md (CL) rust.md (RS)
scripts/ab.js            A/B runner: same prompt without/with the plugin (or two skill versions), isolated, diffed, blind-judged (npm run ab)
tests/                   node --test: hooks, catalogs, languages, skills, manifest, A/B script
evals/                   behavior cases with LLM graders; `fixture/` holds a starting repo for cases that edit one
```

- **One source of truth:** the hook reads the same `SKILL.md` that the skill uses, so the rules exist in one file only.
- **Progressive disclosure:** the always-on context stays small. The catalogs and language guides are loaded only by the review, audit, security and refactor skills, or when a task needs them (the guide for the language being written).
- **Measure, don't guess:** complexity is measured with the repo's own linter rule first (ruff `C901`, eslint `complexity`, gocyclo…), then a run-once tool (`uvx lizard`), and only then counted by hand. Results counted by hand are labeled as such. No dependency is ever added to the project just to measure.
- **Sources:** *Clean Code* (Martin, 2009); NIST SP 500-235 (McCabe's limit of 10); SonarSource's *Cognitive Complexity*; Parnas (1972); Martin's *Clean Architecture* post; Cox, *Our Software Dependency Problem*; Pike's rules; Fowler's refactoring catalog. Security: Saltzer & Schroeder (1975); OWASP Secrets Management Cheat Sheet; NIST SP 800-63B-4; MITRE/CISA 2025 CWE Top 25; OWASP Top 10:2025; OWASP API Security Top 10:2023; NIST SP 800-218 (SSDF). Languages: PEP 8/20/257 and the Google Python, JavaScript, TypeScript, Java, Shell and C++ style guides; MDN; Node.js security best practices; TypeScript TSConfig reference; Effective Go and Go Code Review Comments; Microsoft Learn C# conventions and Cleary's async best practices; C++ Core Guidelines; SEI CERT C and the Linux kernel coding style; The Rust Book, Rust API Guidelines and the Rustonomicon; PER Coding Style and PHP The Right Way; sqlstyle.guide, Use The Index Luke and the PostgreSQL manual; Wooledge's Bash Pitfalls and ShellCheck. Each catalog and guide lists its sources at the top, and `[secondary]` marks those checked only through summaries.

---

## A/B: See the Difference

Run the same prompt without and with the plugin and get a diff of the two answers:

```bash
npm run ab -- "Write a Go function LoadConfig(path) that reads a JSON config"
npm run ab -- --case mode-writes-idiomatic-go     # reuse an eval prompt
npm run ab -- --prompt-file my-prompt.md --model opus --max-turns 10
npm run ab -- --suite                             # every code-writing case (evals/mode-*, evals/refactor-*), one report
npm run ab -- --cases mode-writes-ts-file,refactor-nested-function
npm run ab -- --suite --runs 5 --judge            # 5 runs per case, medians, plus a blind judge per run
npm run ab -- --suite --runs 5 --judge --variant ../clean-n-code-old   # skill version A (that dir) vs B (this repo)
npm run ab -- --rejudge ab-results/<timestamp> --judge-model opus      # judge a finished suite's pairs again
```

Arms run on **Sonnet** unless you pass `--model`. The 7 code-writing cases cost about $0.50 per run of the suite. `--judge` adds two short Sonnet calls per run (`--judge-model` changes the model):
- **Blind:** the judge sees both versions as A and B, never which one had the plugin.
- **Both orders:** each pair is judged once in each order. A verdict counts only when both orders agree; otherwise it is `inconsistent`.
- **Rubric:** which version costs the next reader less to understand and change while doing exactly what the task asks, no more and no less, and whether either breaks the task.

If an arm fails (a crash), the run is reported as `FAILED` instead of diffing the error text. A usage limit stops the suite, and the report keeps what finished.

Cases with a `fixture/` folder (`mode-extends-existing-module`) start from a copy of it, so the agent edits an existing repo instead of an empty dir. These runs use your own Claude usage limit.

Both arms run `claude -p` in an empty temp dir (or a copy of the fixture) with user settings off (`--setting-sources project`), so plugins you installed globally don't leak into either arm. Only the plugin arm gets `--plugin-dir`, or both do with `--variant`. The script reads each arm's `init` event and **refuses to compare** if an arm loaded anything besides what it should.

Output goes to `ab-results/<timestamp>/`:
- `without.md` and `with.md`: both full answers.
- `without.<ext>` and `with.<ext>`: the first code block of each.
- `diff.patch`.
- `summary.md`: cost, turns, tokens, per-function NLOC, CC and nesting via `lizard -ENS`, language cards sent, and rule codes cited.
- `files.patch`: when the case lets the agent write files (`mode-writes-ts-file`), the diff of what each arm wrote.

With `--suite`, each case gets its own folder plus, at the top:
- `report.md`: totals for both arms (cost, tokens, output tokens, turns, delta %) and the judge's win count, then per case the median function count, total NLOC, max NLOC, max CC and max nesting across runs, each judge verdict, and run 1's summary and with/without diff in a `diff` block. With `--runs n`, runs live in `<case>/run-<i>/`, with a `judge.json` each.
- `all.patch`: every case's diff in one file, with headers like `a/mode-writes-flat-code/without.py`.

### Measured results

Final suite, 7 cases × 5 runs, blind judge in both orders (`ab-results/2026-11-05T06-36-35-315Z`):

| Judge | with clean-n-code | without | inconsistent |
|---|---|---|---|
| Sonnet | **20** | 11 | 4 |
| Opus (`--rejudge`, same pairs) | **26** | 8 | 1 |

Opus wins per case:
- 5–0: new Python function, TS file with validation, 2-file TS feature, code plus tests.
- 4–1: refactor.
- 2–2: extending an existing module.
- 0–5: the Go config loader.

The plugin costs about 38% more than no plugin. In the feature case, max CC drops from 8 to 5 and nesting from 4 to 1.

How the always-on rules got there, each change judged against the version before it:
- Dropping the `Applied:` closing line lost 7–22, so it stays.
- The *Proportion* rules (do exactly the task, name numbers only when it helps, a clear trust-boundary definition, docstrings, no invented behavior) won 22–8.
- Inline idiom lines instead of an extra turn to read the card won 12–9 at 15% less cost.
- A complexity-feedback hook never fired in 100 runs and was removed.
- Three targeted fixes tied overall (Opus 14–14), so only the Go fix was kept: don't re-declare code the task gave you, and keep a spec value literal when it appears only in its check and that check's message (Go case 4–0). The rule limiting edits of existing code and the rule keeping side-effect order in refactors showed no gain and were reverted.

One run per arm shows the change; it doesn't measure it, because LLM output varies. Use `--runs 5 --judge`, or `npm run eval` for the graded cases.

---

## Quick Start

### 1. Requirements

- **Claude Code** with plugin support
- **Node 18+** (for the hook and the tests)

### 2. Install

```text
/plugin marketplace add /path/to/clean-n-code
/plugin install clean-n-code@clean-n-code
```

Start a new session. The hook loads the ruleset into every session and every subagent.

### 3. Try it once without installing

```bash
claude --plugin-dir /path/to/clean-n-code
```

### 4. Turn it off

```bash
export CLEAN_N_CODE=off            # skip the session hook (style rules)
export CLEAN_N_CODE_SECRETS=off    # skip the secret-blocking hook
```

You can also say "stop clean-n-code" in a session, or run `/plugin disable clean-n-code`.

---

## Testing

There are two tiers: fast and offline checks, and slow, paid checks of behavior.

```bash
npm test        # 179 unit tests, about 1 s, no network
npm run eval    # the 10 cases tagged `graded` × (with plugin, without plugin), about $1.50
```

| Suite | What it checks |
|-------|----------------|
| `tests/hook.test.js` | Plain-text SessionStart and JSON SubagentStart; frontmatter stripped; catalog paths resolved; `off`/`OFF`/`Off` silences the hook; the context budget. |
| `tests/secrets-hook.test.js` | Each key format is blocked in Write, Edit and MultiEdit with exit 2; env-var code and test-mode keys pass; `CLEAN_N_CODE_SECRETS=off` disables it, `CLEAN_N_CODE=off` does not; malformed input fails open. Fake keys are built at runtime so the file holds no secret-shaped literal. |
| `tests/languages.test.js` | One guide per language and nothing else in `languages/`; each defines its prefix's codes 1..n with no gaps (at least 12); the header range matches; it lists sources, stays within 80 lines, and every code it cites exists. |
| `tests/ab.test.js` | The A/B script's pure parts: stream-json parsing (plugins, mode injection, result), the isolation check, code-block extraction, eval-case loading, argument parsing, suite case selection, refusing failed arms and stopping on a usage limit, variant isolation, metrics and medians, the blind judge's prompt, verdict mapping and two-order agreement, reading a finished suite back for `--rejudge`, the hook log, and the suite report. It never calls `claude`. |
| `tests/after-write.test.js` | The card is sent once per session and never for a language SessionStart injected; non-code files, a missing session and `CLEAN_N_CODE=off` add nothing; malformed input fails open; `CLEAN_N_CODE_HOOK_LOG` records each card sent. |
| `tests/catalogs.test.js` | Each catalog defines exactly its codes. No duplicates. Every code a skill or catalog cites exists, so a renamed code can't silently break a reference. |
| `tests/skills.test.js` | Frontmatter matches the folder; relative paths to sibling skills resolve; the report skills promise to change no code; the refactor pins behavior before it edits; no skill or manifest depends on another plugin by name. |
| `tests/manifest.test.js` | Plugin and marketplace agree; every hook command points at a script that exists. |
| `evals/*` | Graded by sonnet. The review measures and flags arrow code but spares a flat dispatch, and finds the quadratic lookup. The review leaves SQL injection out of scope and cites codes. The always-on mode writes flat code with named rules. The mode writes idiomatic Go (wrapped errors with `%w`, `defer Close`, GO codes). The security review finds a hardcoded key (and asks to revoke it), a missing ownership check and SQL injection, each with S codes. The writing cases also grade correctness against the spec, kept idioms (annotations, no `any`), a 2-file feature's structure, and tests that cover each boundary. `mode-extends-existing-module` (repo conventions, touching only what's needed) runs in the A/B only: `claude plugin eval` doesn't document how a scaffold reaches its workspace yet, so it carries no `graded` tag. |

The unit suite was mutation-checked: 8 deliberate defects (an unknown code cited, a catalog code removed, a broken path, the off switch broken, …) all turn it red. The evals run with and without the plugin: the plugin arm scores 1.00 on the 3 readability cases, against 0.20-0.50 for the baseline. The security and Go cases (`secure-finds-authz-and-secret`, `mode-writes-idiomatic-go`) have not been scored yet.

---

## License

MIT, as declared in `.claude-plugin/plugin.json`. *Clean Code* and the other sources belong to their authors. This repo stores notes and short quotes with page or URL references, not their text.

---

<div align="center">

**clean-n-code**: Claude Code plugin | Clean Code | complexity | design | security

</div>
