# Python

Cite codes **PY1–PY16**. The repo's formatter, linter and type-checker config win over this file; this file wins over the general catalogs on idiom.

## Card
- `is None`, implicit truthiness, `isinstance` (PY3). No mutable default args (PY4).
- Iterate directly; simple comprehensions only (PY5). `with` for every resource (PY13).
- Catch specific exceptions in a minimal `try`; `raise … from err` (PY9). `assert` is not validation (PY10).
- Annotate public APIs, `X | None` (PY12).
- `subprocess.run([...], check=True)`, no `shell=True`/`eval`, DB placeholders (PY15). No `pickle` on input (PY16).

## Tooling
- **PY1 Let the tools format and lint.** Use the repo's formatter (ruff format / black) and linter (ruff, flake8, pylint). With none configured, follow PEP 8: 4-space indents, lines ≤ 79 characters (the repo may raise it), imports on separate lines grouped stdlib, third-party, local; no wildcard imports. Measure complexity with ruff `C901` or `uvx lizard` (K1).

## Naming
- **PY2 PEP 8 names.** `snake_case` functions, variables and modules; `CapWords` classes; `UPPER_SNAKE` module-level constants; a leading `_` for internal names. Never shadow builtins (`list`, `id`, `type`, `input`).

## Idioms
- **PY3 Compare idiomatically.** `is None` / `is not None` for None, never `==` (PEP 8). Implicit truthiness for sequences (`if not users:`), never `len(x) == 0` or `== False` (Google 2.14). `isinstance()` instead of comparing types. `startswith()`/`endswith()` instead of slicing.
- **PY4 No mutable default arguments.** `def f(items=[])` shares one list across calls. Default to `None` and create the object inside (Google 2.12).
- **PY5 Iterate directly.** `for key in d:`, `for i, x in enumerate(xs):`, `zip()`; no `range(len(xs))` and no `.keys()` (Google 2.8). Use a comprehension only while it stays simple: one `for` and at most one filter, otherwise write a loop (Google 2.7).
- **PY6 Simple conditional expressions and lambdas.** A ternary only when each part fits on one line (2.11). A lambda only for a one-liner; prefer `operator` functions; a nested `def` for anything longer (2.10).
- **PY7 No side effects at import time.** Executable code lives in `main()` behind `if __name__ == "__main__":` (Google 3.17). No mutable module-level state; if unavoidable, make it `_private` and reach it through functions (2.5).
- **PY8 Prefer the standard library.** `pathlib` for paths, `dataclasses` for plain data (D6), `collections` (`defaultdict`, `Counter`, `deque`) by access pattern (D15), `itertools` and `functools` before hand-rolled loops.

## Errors
- **PY9 Catch specific exceptions in a minimal `try`.** No bare `except:`; catch `Exception` only to re-raise or at an isolation boundary (PEP 8, Google 2.4). Keep the `try` body to the line that can fail. Chain with `raise NewError(...) from err` so context survives.
- **PY10 `assert` is not validation.** Asserts vanish under `python -O`. Validate input with `if` and raise `ValueError`/`TypeError` (Google 2.4.4); see S12.
- **PY11 Consistent returns.** All `return` statements return an expression, or none do (PEP 8). Don't return `None` for "not found" and a value otherwise without the type saying `X | None`.

## Types
- **PY12 Annotate public APIs and run a type checker.** Use built-in generics (`list[str]`), `X | None` instead of implicit Optional (Google 3.19), `Protocol` for duck-typed interfaces, and `Any` only when a type truly can't be expressed. Run mypy or pyright in CI if the repo has it.

## Resources & concurrency
- **PY13 Manage resources with `with`.** Files, locks, connections and temp dirs use a context manager; write your own with `contextlib.contextmanager`. Don't mix blocking I/O into `async def` code; use the async library or `asyncio.to_thread`.

## Testing
- **PY14 pytest, plain asserts, fixtures.** Use the repo's runner (pytest by default): plain `assert`, fixtures for setup, `parametrize` for boundary tables (T5), `tmp_path` instead of real paths, and no network or clock dependence (`freezegun` or an injected clock).

## Security pitfalls
- **PY15 No shell strings, no `eval`.** `subprocess.run([...], check=True)` with a list of arguments; `shell=True` with input is shell injection (docs, "Security Considerations"). Never `eval`/`exec` input (S13). Use DB-API placeholders (`cursor.execute(sql, params)`), never f-strings in SQL.
- **PY16 Never unpickle untrusted data.** "The pickle module is not secure… malicious pickle data… execute arbitrary code" (docs). The same goes for `yaml.load` without `SafeLoader` and `marshal`. Use `json` and validate (S16). Use `secrets`, never `random`, for tokens (S20).
