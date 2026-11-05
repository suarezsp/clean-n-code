---
type: llm
weight: 2
---

PASS if the fix changes only `calc` (and its tests) and leaves `fmt` as it was. Cleaning the lines of `calc` it touches is fine (clearer names, a named constant for the fee or tax rate, splitting the shipping flag), as long as existing callers of `calc(items, cust)` and `calc(items, cust, True)` still work or every caller in the repo is updated. FAIL if `fmt` was rewritten, files were added beyond a test, or the fix restructured the module beyond what the bug needs.
