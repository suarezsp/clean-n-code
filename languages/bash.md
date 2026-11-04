# Bash / Shell

Cite codes **SH1–SH14**. The repo's `.shellcheckrc` and shell conventions win over this file; this file wins over the general catalogs on idiom.

Sources:
- Google Shell Style Guide (google.github.io/styleguide/shellguide.html), section headings as cited.
- ShellCheck (shellcheck.net) and its wiki (SC codes).
- Wooledge, *Bash Pitfalls* (mywiki.wooledge.org/BashPitfalls), pitfall numbers as cited.
- GNU Bash Reference Manual.

## Card
- Small glue only; ShellCheck clean (SH1, SH2). `main "$@"` and `local` (SH3).
- Double-quote every expansion; `--` before paths (SH5). Arrays for args, never `eval` (SH6).
- Never parse `ls`; `while IFS= read -r` (SH8). `trap` cleanup with `mktemp` (SH10).
- `cd … || exit`; check critical commands; `set -e` has holes (SH11).
- Input never becomes code or options (SH14).

## When and how
- **SH1 Use shell for small glue only.** Past about 100 lines, or once there is non-trivial logic or data structures, use a structured language (Google "When to use Shell"). Executables start with `#!/usr/bin/env bash` (or `#!/bin/bash` per repo), and "Bash is the only shell scripting language permitted for executables" unless the target is POSIX `sh`.
- **SH2 ShellCheck clean.** ShellCheck "is recommended for all scripts, large or small" (Google). Fix warnings instead of disabling them; a disable comment names the SC code and the reason.

## Structure & naming
- **SH3 `main` and `local`.** Scripts with functions put the logic in `main` and end with `main "$@"`. Declare function variables `local` (Google). `lower_snake_case` for functions and variables; `UPPER_SNAKE` for constants and exported variables, which are made `readonly` right after they are set.
- **SH4 Errors go to stderr; exit codes mean something.** `echo "error: cannot read ${file}" >&2`, then a non-zero `exit`. Print usage on bad arguments. Check `"$#"` and parse options with `getopts` or a `case` loop.

## Quoting & expansion
- **SH5 Double-quote every expansion.** `"$var"`, `"$(cmd)"`, `"${array[@]}"`. Unquoted expansions split on spaces and expand globs (BashPitfalls #2, #14). Braces don't replace quotes (Google "Quoting"). Use `--` before file arguments: `rm -- "$file"`.
- **SH6 Arrays for argument lists.** Build commands with arrays, `args=(--verbose "$file"); cmd "${args[@]}"`, never with a string you later split (Google "Arrays"). Never use `eval` (Google "Eval").
- **SH7 Modern syntax.** `$(…)` instead of backticks, `[[ … ]]` instead of `[ … ]` in Bash, `(( … ))` for arithmetic, and `printf '%s\n'` instead of `echo` for data (Google, BashPitfalls #14).

## Files & loops
- **SH8 Never parse `ls`; loop over globs.** `for f in ./*.log; do [[ -e $f ]] || continue; …` or `find … -print0 | while IFS= read -r -d '' f` (BashPitfalls #1). Read lines with `while IFS= read -r line` (#12).
- **SH9 Mind pipeline subshells.** Variables set inside `cmd | while read …` vanish; use `while …; done < <(cmd)` (BashPitfalls #8). Don't read and write the same file in one pipeline (#13); write to a `mktemp` file and `mv` it.
- **SH10 Clean up with `trap`.** `tmp=$(mktemp -d); trap 'rm -rf -- "$tmp"' EXIT`. Never use fixed paths under `/tmp`.

## Errors
- **SH11 Check what can fail.** `cd "$dir" || exit 1` (BashPitfalls #19); `if ! cmd; then …` (Google "Checking Return Values"). `set -euo pipefail` is a safety net with known holes (BashPitfalls #60: `errexit` is skipped inside conditions and functions called from them). Keep explicit checks on critical commands. Copy `PIPESTATUS` right after the pipeline.
- **SH12 `a && b || c` is not if/else.** `c` also runs when `b` fails; write `if a; then b; else c; fi` (BashPitfalls #22).

## Testing
- **SH13 Test scripts like code.** Use the repo's framework (bats-core, shunit2), or keep logic in functions and source them in a test. Run ShellCheck in CI. Use a dry-run flag for destructive scripts.

## Security pitfalls
- **SH14 Untrusted input never becomes code or options.** No `eval`, no `bash -c "$input"`, no unquoted input in commands (S13). Put `--` before user-supplied paths so `-rf` can't become an option. Don't put secrets in command-line arguments, which are visible in `ps`; use stdin or a file with `chmod 600` (S7). Use `curl --fail` and verify checksums before running downloads; never `curl | bash` in production (S23).
