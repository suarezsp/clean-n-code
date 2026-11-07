---
tags: [languages]
max_turns: 8
allowed_tools: [Write]
---

Write `inactive_customers.sql` for PostgreSQL: one query listing the id and email of customers with no order since a date given by the caller as a bind parameter, newest customers first, 100 at most. Tables: `customers(id, email, created_at)` and `orders(id, customer_id, created_at)`; `customer_id` can be NULL. Write only the file, then reply with its full content in one fenced block.
