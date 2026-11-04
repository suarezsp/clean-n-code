---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

Refactor this Python function so it is easier to read and change, without changing its behavior (same return value, same changes to `inventory`, same printed messages). Reply with the code only. Do not create files.

```python
def process(orders, inventory, user):
    result = []
    if user is not None:
        if user.get("active"):
            for order in orders:
                if order.get("status") != "cancelled":
                    total = 0
                    for item in order.get("items", []):
                        if item["sku"] in inventory:
                            if inventory[item["sku"]] >= item["qty"]:
                                price = item["price"] * item["qty"]
                                if user.get("vip"):
                                    if price > 100:
                                        price = price * 0.9
                                    else:
                                        price = price * 0.95
                                total += price
                                inventory[item["sku"]] -= item["qty"]
                            else:
                                print("not enough stock for", item["sku"])
                        else:
                            print("unknown sku", item["sku"])
                    if total > 0:
                        if order.get("coupon") == "SAVE10":
                            total = total - 10
                            if total < 0:
                                total = 0
                        result.append({"id": order["id"], "total": round(total, 2)})
        else:
            print("inactive user")
    else:
        print("no user")
    return result
```
