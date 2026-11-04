---
type: llm
weight: 2
---

For every function in the reply, count (1) its maximum nesting depth of control structures (`if`/`for`/`while`/`try`/`with`) inside the function body, and (2) its own length: lines from its `def` through its last line, excluding blank lines, comment-only lines and docstrings, and excluding any other function. PASS if every function has nesting of 2 or less and length of 20 or less, and no function exists only to shorten another (each helper has a name that is not a restatement of its body). Otherwise FAIL.
