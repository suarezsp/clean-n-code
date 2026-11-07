---
type: llm
weight: 1
---

PASS only if all hold: `NOT EXISTS` or an anti-join, not `NOT IN` over the nullable column; no `SELECT *`; a bind parameter for the date, never a literal or concatenation; no function wrapped around `created_at` in the filter; `LIMIT 100`; uppercase keywords. Otherwise FAIL, naming the rule.
