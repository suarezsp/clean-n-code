#!/usr/bin/env bash
# Hidden check: $1 is the arm's code (a .go file). Exit 0 when the spec holds.
here="$(cd "$(dirname "$0")" && pwd)"
python3 -I "$here/check.py" "$1" "$here/../../lib"
