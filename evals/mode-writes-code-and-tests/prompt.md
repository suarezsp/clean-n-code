---
tags: [graded]
max_turns: 12
allowed_tools: [Write]
---

Write `slugify(title: str) -> str` in `text/slug.py` and pytest tests for it in `tests/test_slug.py`. Rules: lower-case; letters with accents become their plain ASCII letter (`é` → `e`); any run of characters that are not ASCII letters or digits becomes a single `-`; no leading or trailing `-`; at most 60 characters, cut at the last `-` before the limit when there is one; a title with nothing usable is an error. Write only the files, then reply with one short line.
