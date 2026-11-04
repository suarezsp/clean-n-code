---
type: llm
weight: 1
---

Count the lines of the `LoadConfig` function itself, from its signature line through its closing brace, excluding blank lines and comment-only lines. Do not count the package line, imports, the struct, constants or any other function. PASS if that count is 20 or fewer and `LoadConfig` does not delegate its main steps to helpers that only exist to shorten it. Otherwise FAIL.
