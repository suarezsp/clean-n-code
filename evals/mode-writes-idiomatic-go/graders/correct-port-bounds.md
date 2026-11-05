---
type: llm
weight: 2
---

PASS if `LoadConfig` returns an error (and a zero `Config`) for ports 0 and 65536, accepts ports 1 and 65535, returns the open error wrapped with `%w` when the file is missing, and returns the decode error when the JSON is malformed. Otherwise FAIL, naming the case that breaks.
