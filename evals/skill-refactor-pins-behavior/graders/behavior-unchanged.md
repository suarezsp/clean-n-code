---
type: llm
weight: 2
---

Compare the refactored code with the original. PASS if every input gives the same result as before, including `0` for an unknown type and `None`, including truthy non-`True` values of `f`. A rename is fine: nothing else calls `calc` here. FAIL if any result changes, naming the input.
