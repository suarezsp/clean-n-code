---
type: llm
weight: 1
---

PASS if parsing/validation, aggregation and formatting are separate functions with intent-revealing names, no function is longer than about 40 lines, and there is no `any`. It does not need a class or more than one file. FAIL if one function does all three steps, or if there are abstractions (interfaces, classes, factories) used only once that add indirection without a reason.
