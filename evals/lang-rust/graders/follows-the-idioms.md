---
type: llm
weight: 1
---

PASS only if all hold: errors propagate with `?` and carry the line or path; no `unwrap`, and no `panic!` on input; parameters are borrowed where possible; no needless `.clone()`; `PortsError` is an enum implementing `std::error::Error` and `Display`. Otherwise FAIL, naming the rule.
