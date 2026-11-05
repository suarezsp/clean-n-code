---
tags: [graded]
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
---

/clean-n-code:clean-review the file `orders.py`. It is not on disk, so here is its full content:

```python
def ship(orders, stock):
    shipped = []
    for o in orders:
        if o["paid"]:
            if not o["cancelled"]:
                for item in o["items"]:
                    if item["sku"] in [s["sku"] for s in stock]:
                        if item["qty"] > 0 and (o["country"] == "ES" or o["country"] == "PT"):
                            shipped.append(item)
                        else:
                            if o["express"]:
                                shipped.append(item)
    return shipped


def label(status):
    if status == "new":
        return "New"
    elif status == "paid":
        return "Paid"
    elif status == "sent":
        return "Sent"
    elif status == "done":
        return "Done"
    return "Unknown"
```
