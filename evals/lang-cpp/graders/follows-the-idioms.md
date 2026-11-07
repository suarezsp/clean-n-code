---
type: llm
weight: 1
---

PASS only if all hold: no naked `new`/`delete`, memory owned by `std::vector` or a smart pointer; the rule of zero, or all five special members written correctly; `at` is bounds-checked and throws; members are initialized; no C-style casts. Otherwise FAIL, naming the rule.
