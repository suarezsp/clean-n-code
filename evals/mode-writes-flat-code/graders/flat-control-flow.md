---
type: llm
weight: 2
---

The produced function keeps control flow flat: nesting depth of at most 2 inside any function, errors handled with an early guard (raise/return) before the main logic, and no boolean parameter that selects between two behaviors besides the `express` field read from the order.
