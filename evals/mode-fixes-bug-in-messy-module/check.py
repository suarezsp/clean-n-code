import os
import subprocess
import sys
sys.path.insert(0, sys.argv[2])
from check_helpers import run

root = sys.argv[1]
sys.path.insert(0, root)
from billing.invoice import calc, fmt  # noqa: E402

own_tests = subprocess.run([sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider", "tests"],
                           cwd=root, capture_output=True, text=True, env={**os.environ, "PYTHONPATH": root})
run([
    ("shipping is not taxed", calc([{'p': 10, 'q': 2}], {'tier': 'none'}, True) == 29.19),
    ("no shipping unchanged", calc([{'p': 10, 'q': 2}], {'tier': 'none'}) == 24.2),
    ("gold unchanged", calc([{'p': 100, 'q': 1}], {'tier': 'gold'}) == 108.9),
    ("silver with shipping", calc([{'p': 100, 'q': 1}], {'tier': 'silver'}, True) == 119.94),
    ("fmt unchanged", fmt(42, 7.5) == 'INV-000042: 7.50 EUR'),
    ("its own tests pass", own_tests.returncode == 0),
])
