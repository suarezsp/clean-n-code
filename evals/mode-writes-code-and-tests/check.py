import os
import subprocess
import sys
sys.path.insert(0, sys.argv[2])
from check_helpers import load_module, raises, run

root = sys.argv[1]
slugify = load_module(os.path.join(root, "text", "slug.py")).slugify
own_tests = subprocess.run([sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider", "tests"],
                           cwd=root, capture_output=True, text=True, env={**os.environ, "PYTHONPATH": root})
run([
    ("lower-case", slugify("Hello World") == "hello-world"),
    ("accents become ASCII", slugify("Café Crème") == "cafe-creme"),
    ("runs of other characters become one dash", slugify("a  --  b!!c") == "a-b-c"),
    ("no leading or trailing dash", slugify("  ¡Hola!  ") == "hola"),
    ("digits kept", slugify("Top 10 Tips") == "top-10-tips"),
    ("cut at the last dash before 60", slugify("a" * 30 + " " + "b" * 40) == "a" * 30),
    ("hard cut when there is no dash", slugify("a" * 70) == "a" * 60),
    ("exactly 60 is kept", slugify("a" * 60) == "a" * 60),
    ("nothing usable is an error", raises(slugify, "!!! ???")),
    ("empty is an error", raises(slugify, "")),
    ("its own tests pass", own_tests.returncode == 0),
])
