---
tags: [graded]
timeout_seconds: 900
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
---

/clean-n-code:clean-audit this small repo. It is not on disk, so here is all of it. There is no git history.

`money.py`:

```python
"""Money helpers. Amounts are integer cents."""


def to_euros(cents: int) -> str:
    """Format cents as euros with two decimals."""
    return f"{cents / 100:.2f} EUR"
```

`orders.py`:

```python
import datetime


def proc(o, flag):
    if o:
        if o["items"]:
            for i in o["items"]:
                if i["qty"] > 0:
                    if i["kind"] == "food":
                        if flag:
                            i["tax"] = i["price"] * 0.04
                        else:
                            i["tax"] = i["price"] * 0.10
                    elif i["kind"] == "book":
                        i["tax"] = i["price"] * 0.04
                    else:
                        i["tax"] = i["price"] * 0.21
    return o
```

`invoices.py`:

```python
def tax_for(kind, price):
    if kind == "food":
        return price * 0.10
    elif kind == "book":
        return price * 0.04
    else:
        return price * 0.21
```

`test_orders.py`:

```python
import datetime
import orders


def test_proc():
    assert datetime.date.today().year >= 2024
    assert orders.proc({"items": []}, False) == {"items": []}
```
