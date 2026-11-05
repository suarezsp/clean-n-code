---
tags: [graded]
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
---

/clean-n-code:clean-review the file `discount.py`. It is not on disk, so here is its full content:

```python
"""Order discounts. Amounts are integer cents."""

LOYALTY_DISCOUNT_PERCENT = 5
BULK_THRESHOLD_ITEMS = 10
BULK_DISCOUNT_PERCENT = 10


def discount_percent(item_count: int, is_loyal: bool) -> int:
    """Return the discount for an order: the bulk discount, or the loyalty one, whichever is larger."""
    bulk = BULK_DISCOUNT_PERCENT if item_count >= BULK_THRESHOLD_ITEMS else 0
    loyalty = LOYALTY_DISCOUNT_PERCENT if is_loyal else 0
    return max(bulk, loyalty)


def apply_discount(total_cents: int, percent: int) -> int:
    """Return total_cents reduced by percent, rounded down to whole cents."""
    if not 0 <= percent <= 100:
        raise ValueError(f"percent must be 0-100, got {percent}")
    return total_cents * (100 - percent) // 100
```
