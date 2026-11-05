---
type: llm
weight: 1
---

PASS if the public function (the one the shop calls) has type annotations on its parameter and its return value, as PEP 484 and the Python guide's PY12 ask for public APIs. Private helpers do not need them. Otherwise FAIL.
