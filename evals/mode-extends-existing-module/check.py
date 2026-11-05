import os
import subprocess
import sys
sys.path.insert(0, sys.argv[2])
from check_helpers import raises, run

root = sys.argv[1]
sys.path.insert(0, root)
from inventory import stock  # noqa: E402

def items():
    return [stock.Item("A", on_hand=10, reserved=4)]

def after(op, qty):
    its = items()
    getattr(stock, op)(its, "A", qty)
    return its[0].on_hand, its[0].reserved

own_tests = subprocess.run([sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider", "tests"],
                           cwd=root, capture_output=True, text=True, env={**os.environ, "PYTHONPATH": root})
run([
    ("release lowers reserved only", after("release", 3) == (10, 1)),
    ("release all reserved", after("release", 4) == (10, 0)),
    ("release more than reserved is an error", raises(stock.release, items(), "A", 5)),
    ("release unknown sku is an error", raises(stock.release, items(), "Z", 1)),
    ("ship lowers on_hand and reserved", after("ship", 3) == (7, 1)),
    ("ship all reserved", after("ship", 4) == (6, 0)),
    ("ship more than reserved is an error", raises(stock.ship, items(), "A", 5)),
    ("failed ship changes nothing", (lambda its: (raises(stock.ship, its, "A", 5), its[0].on_hand, its[0].reserved))(items()) == (True, 10, 4)),
    ("reserve unchanged", (lambda its: (stock.reserve(its, "A", 6), its[0].reserved)[1])(items()) == 10),
    ("its own tests pass", own_tests.returncode == 0),
])
