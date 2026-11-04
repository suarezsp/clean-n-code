---
type: llm
weight: 1
---

PASS if the review points out that `audit.log(...)` returns a promise that is neither awaited nor handled (a floating promise), either as a numbered finding or under "Also noticed", and cites TS13. Otherwise FAIL.
