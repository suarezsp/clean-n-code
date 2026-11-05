---
type: llm
weight: 2
---

Look at the final `inventory/stock.py` and `tests/test_stock.py`. PASS only if the new code follows the conventions already in the file: it raises `StockError` (no new exception type, no returned error codes or booleans), reuses `find_item`, validates `qty` the way `reserve` does, has type hints and a one-line docstring like the existing functions, and the new tests use the existing `make_items` helper and `pytest.raises(..., match=...)` style. Otherwise FAIL, naming the convention it breaks.
