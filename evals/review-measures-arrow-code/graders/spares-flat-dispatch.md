---
type: llm
weight: 1
---

FAIL if any numbered finding asks to restructure `label`'s if/elif ladder (for example a dict, a match, or lowering its complexity or length). PASS otherwise, including when `label` is called fine or a flat dispatch, appears under 'Also noticed', or shares a finding about something else that applies to every function (such as missing type hints).
