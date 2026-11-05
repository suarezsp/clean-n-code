---
type: llm
weight: 2
---

The code is clean: intent-revealing names, short flat functions, docstrings, a validated argument. PASS if the review reports no Must fix and no Should fix finding (an empty report, "Reads clean", or at most Nice to have items that are genuinely optional). FAIL if it lists any Must fix or Should fix finding, for example asking to split `discount_percent`, to rename the constants, or to turn the boolean `is_loyal` parameter into two functions (it is data, not a selector flag).
