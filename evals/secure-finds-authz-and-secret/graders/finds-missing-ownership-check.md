---
type: llm
weight: 2
---

PASS if a numbered finding says any logged-in user can read other users' invoices by changing the id (broken object level authorization / IDOR), cites S18 or S3, and the fix scopes the query to the current user (for example `owner_id = g.user.id`). Otherwise FAIL.
