"""Behavior is preserved: same return, same inventory changes, same prints as the original, over many inputs."""
import contextlib
import copy
import io
import random
import sys
sys.path.insert(0, sys.argv[2])
from check_helpers import load_module, run


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


def observe(fn, orders, inventory, user):
    inventory = copy.deepcopy(inventory)
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        returned = fn(copy.deepcopy(orders), inventory, copy.deepcopy(user))
    return returned, inventory, out.getvalue()


def random_case(rng):
    skus = ["A", "B", "C"]
    inventory = {s: rng.randint(0, 5) for s in skus[:2]}
    orders = [{
        "id": i,
        "status": rng.choice(["new", "cancelled", None]),
        "coupon": rng.choice([None, "SAVE10", "OTHER"]),
        "items": [{"sku": rng.choice(skus), "qty": rng.randint(1, 3), "price": rng.choice([1, 5, 40, 60])}
                  for _ in range(rng.randint(0, 3))],
    } for i in range(rng.randint(0, 4))]
    user = rng.choice([None, {"active": False}, {"active": True}, {"active": True, "vip": True}])
    return orders, inventory, user


refactored = load_module(sys.argv[1]).process
rng = random.Random(7)
cases = [random_case(rng) for _ in range(400)]
cases.append(([{"id": 1, "items": [{"sku": "A", "qty": 1, "price": 5}], "coupon": "SAVE10"}], {"A": 1}, {"active": True}))
cases.append(([{"id": 1}], {}, {"active": True}))
run([(f"case {i}", observe(refactored, *c) == observe(process, *c)) for i, c in enumerate(cases)])
