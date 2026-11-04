---
type: llm
weight: 3
---

Compare the refactored code with the original in the prompt. PASS only if all of these still hold: `None` user prints "no user" and returns `[]`; an inactive user prints "inactive user" and returns `[]`; cancelled orders are skipped; unknown SKUs print "unknown sku <sku>"; insufficient stock prints "not enough stock for <sku>" and skips the item; VIP discount is 10% when the line price is over 100, else 5%; stock is decremented in `inventory` (the caller's dict is mutated) only for items that are bought; orders with total 0 are omitted; coupon "SAVE10" subtracts 10 with a floor of 0; totals are rounded to 2 decimals; output dicts have keys `id` and `total`. Any behavior change is a FAIL.
