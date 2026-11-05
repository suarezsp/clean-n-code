import sys
sys.path.insert(0, sys.argv[2])
from check_helpers import load_module, only_function, raises, run

cost = only_function(load_module(sys.argv[1]))
order = lambda country, weight, express=False: {"country": country, "weight_kg": weight, "express": express}


def accepts_one(names, weight, express, expected):
    """The prompt says Spain or Portugal without a format; accept any one spelling the code understands."""
    return any(cost(order(n, weight, express)) == expected for n in names)


SPAIN = ["Spain", "ES", "spain", "es"]
PORTUGAL = ["Portugal", "PT", "portugal", "pt"]
run([
    ("spain base", accepts_one(SPAIN, 3, False, 5)),
    ("portugal base", accepts_one(PORTUGAL, 3, False, 5)),
    ("other base", cost(order("France", 3)) == 15 and cost(order("FR", 3)) == 15),
    ("10 kg has no surcharge", cost(order("France", 10)) == 15),
    ("2 per kg above 10", cost(order("France", 13)) == 21),
    ("express doubles the total", cost(order("France", 13, True)) == 42),
    ("express iberian", accepts_one(SPAIN, 12, True, 18)),
    ("missing weight is an error", raises(cost, {"country": "France", "express": False})),
    ("negative weight is an error", raises(cost, order("France", -1))),
])
