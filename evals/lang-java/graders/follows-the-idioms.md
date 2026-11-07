---
type: llm
weight: 1
---

PASS only if all hold: the file is read with try-with-resources or `Files` helpers that close it; the returned map is unmodifiable; a failure carries the line or path in its message; no caught exception is swallowed; no `Optional` parameter or field. Otherwise FAIL, naming the rule.
