---
tags: [languages]
max_turns: 8
allowed_tools: [Write]
---

Write `stock.py` with `load_stock(path)`: it reads a JSON file mapping each SKU to its quantity and returns it as a dict. A missing file or invalid JSON raises `StockError` naming the path and keeping the original error. A quantity that is not a non-negative integer also raises `StockError`. Use only the standard library. Write only the file, then reply with its full content in one fenced block.
