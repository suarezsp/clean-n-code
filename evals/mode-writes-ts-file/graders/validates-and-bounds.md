---
type: llm
weight: 2
---

PASS if `src/pagination.ts` rejects (throws or returns an error result for) non-numeric, fractional, zero or negative `page`, and `limit` outside 1-100, instead of clamping silently or returning NaN, and applies the defaults page 1 and limit 20 when a value is missing. Otherwise FAIL.
