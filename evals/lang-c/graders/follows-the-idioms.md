---
type: llm
weight: 1
---

PASS only if all hold: the `malloc` result is checked; the size computation accounts for the separator and terminator and guards against overflow; no `strcpy`, `strcat` or `sprintf`, or a checked `snprintf`/`memcpy`; `sizeof` or length logic is correct; NULL inputs are not dereferenced unless documented. Otherwise FAIL, naming the rule.
