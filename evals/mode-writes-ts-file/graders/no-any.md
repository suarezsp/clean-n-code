---
type: llm
weight: 1
---

PASS if `src/pagination.ts` declares explicit types for the `query` parameter and the return value and uses no `any`. `unknown` or `Record<string, string | undefined>` are fine. Otherwise FAIL.
