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
    ("no dash left when the cut lands on one", slugify("a" * 59 + " " + "b" * 10) == "a" * 59),
    ("a dash just past the limit is not used", slugify("a" * 60 + " b") == "a" * 60),
    ("upper-case accents", slugify("ÑANDÚ") == "nandu"),
    ("letters with no ASCII form count as other characters", slugify("straße") == "stra-e"),
    ("nothing usable is an error", raises(slugify, "!!! ???")),
    ("empty is an error", raises(slugify, "")),
    ("only non-ASCII letters is an error", raises(slugify, "日本語")),
    ("its own tests pass", own_tests.returncode == 0),
])
