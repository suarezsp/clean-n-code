---
type: llm
weight: 1
---

PASS if the existing code (`StockError`, `Item`, `find_item`, `reserve` and the three existing tests) is unchanged, or changed only where the new operations truly need it (for example extracting a shared qty check used by all three). FAIL if existing code was reformatted, renamed, restructured or "improved" without the task needing it, or if files or modules beyond the two named were created.
