---
type: llm
weight: 2
---

Trace the new functions by hand on `Item("A1", on_hand=10, reserved=4)`. PASS only if: `release(..., "A1", 3)` leaves reserved 1 and on_hand 10; `release(..., "A1", 5)` raises; `ship(..., "A1", 4)` leaves on_hand 6 and reserved 0; `ship(..., "A1", 5)` raises; both raise for qty 0 or negative and for an unknown SKU; nothing is changed when they raise. Otherwise FAIL, naming the case.
