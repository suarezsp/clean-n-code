---
type: llm
weight: 1
---

PASS only if all hold: async all the way, no `.Result` or `.Wait()`, no `async void`; `token` reaches the async read; any `IDisposable` is under `using`; `Price` is a record or immutable; a catch, if any, is specific and rethrows with `throw;` or wraps the cause. Otherwise FAIL, naming the rule.
