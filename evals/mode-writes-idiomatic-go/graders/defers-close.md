---
type: llm
weight: 1
---

PASS if the file is closed with `defer f.Close()` (or equivalent `defer`) placed right after the successful open, or if the code uses `os.ReadFile`, which needs no close. Otherwise FAIL.
