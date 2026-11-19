---
type: llm
weight: 1
---

PASS only if all hold: the file is opened with `with`; `StockError` subclasses `Exception` and the original error is chained with `raise ... from err`; `except` clauses name specific exceptions (no bare `except:` or `except Exception:`), around a minimal `try` body; the public function has type annotations; validation uses `isinstance` and explicit `raise`, not `assert`. Otherwise FAIL, naming the rule.
