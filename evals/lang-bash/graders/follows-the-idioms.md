---
type: llm
weight: 1
---

PASS only if all hold: every expansion double-quoted; a `main "$@"` structure with `local` variables; the temporary file from `mktemp` removed by a `trap`; a `--` or `./` guard so a leading dash is not read as an option; no `eval`, no parsing of `ls`; failures stop the script with a message. Otherwise FAIL, naming the rule.
