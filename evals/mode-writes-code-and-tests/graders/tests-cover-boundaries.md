---
type: llm
weight: 2
---

PASS if `tests/test_slug.py` tests each rule's boundary: accents, a run of mixed separators, leading/trailing separators, a title of exactly 60 usable characters and one just over it (cut at a `-`), a long title with no `-` to cut at, and the error for an empty or all-punctuation title. Otherwise FAIL, listing the missing boundaries.
