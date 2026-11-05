---
type: llm
weight: 1
---

PASS if each test checks one concept and its name says which (`test_cuts_at_last_dash_before_limit`), tests are independent (no shared mutable state, no order dependence), and parametrization, if used, groups only cases of the same concept. FAIL if a test asserts several unrelated rules, or names are generic (`test_slugify_1`).
