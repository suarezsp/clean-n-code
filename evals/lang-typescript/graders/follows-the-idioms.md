---
type: llm
weight: 1
---

PASS only if all hold: no `any` (the parsed body is `unknown` and checked at runtime before use); no `as` cast or `!` assertion on the response body; no `@ts-ignore`; every promise is awaited or returned (none floating); errors name the SKU; a caught error, if any, is typed or narrowed from `unknown`. Otherwise FAIL, naming the rule.
