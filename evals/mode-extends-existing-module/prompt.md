---
tags: [graded]
max_turns: 15
allowed_tools: [Read, Glob, Grep, Edit, Write]
---

This repo has a small warehouse module in `inventory/stock.py` with tests in `tests/test_stock.py`. Add two operations to it:

- `release(items, sku, qty)`: undo part of a reservation. Releasing more than is reserved is an error.
- `ship(items, sku, qty)`: units leave the warehouse, so they come off both `on_hand` and `reserved`. Only reserved units can ship.

Add tests for both next to the existing ones. Edit the files in place, then reply with one short line.
