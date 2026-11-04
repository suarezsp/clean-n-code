---
type: llm
weight: 2
---

PASS if every error returned from opening or decoding the file is wrapped with context using `fmt.Errorf("...: %w", err)` (the message names the operation or the path), errors are never discarded with `_`, and the code does not call `panic` or `log.Fatal`. Otherwise FAIL.
