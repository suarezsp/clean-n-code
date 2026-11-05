---
type: llm
weight: 2
---

Trace `salesReport` by hand on this input:
```
date,region,amount_cents
2024-01-02,North,1050
2024-01-03,South,2000

2024/01/05,North,5
2024-01-04,,100
2024-01-05,North,950
2024-01-06,South,-3
```
PASS only if the output lists `North` 20.00 then `South` 20.00 (equal totals, so sorted by name), a `TOTAL` of 40.00, and an `Errors:` section with lines 5, 6 and 8 in that order, each with a reason, and the amounts are right-aligned in one column. Line 4 (blank) is not an error. Otherwise FAIL, naming the first mismatch.
