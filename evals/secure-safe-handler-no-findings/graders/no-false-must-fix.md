---
type: llm
weight: 2
---

The handler reads its key from the environment, uses a parameterized query, checks ownership, returns 404 for other users' invoices and sets a timeout. PASS if the review lists no Must fix finding. Should fix findings for defense in depth (for example handling a non-JSON or failed payments response, or `payment_id` reaching the URL) are acceptable. FAIL if it claims SQL injection, a hardcoded secret, a missing ownership check or a missing authentication check.
