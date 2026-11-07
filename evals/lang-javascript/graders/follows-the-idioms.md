---
type: llm
weight: 1
---

PASS only if all hold: reads with async file APIs, not `readFileSync`; reads files concurrently (`Promise.all` or similar), no `await` in a loop; `const`/`let`, no `var`; a failure throws an `Error` naming the file and keeps the original via `{ cause }`; no empty `catch`. Otherwise FAIL, naming the rule.
