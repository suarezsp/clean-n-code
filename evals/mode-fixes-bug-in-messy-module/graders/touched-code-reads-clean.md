---
type: llm
weight: 1
---

PASS if, after the change, a reader of `calc` can see at a glance that shipping is added after tax: the order of subtotal, discount, tax and shipping is clear from names or structure, not only from a comment. FAIL if the fix is a bare arithmetic tweak (for example subtracting `4.99 * 0.21`) that leaves the reason hidden.
