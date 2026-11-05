---
tags: [graded]
max_turns: 8
allowed_tools: [Write]
---

Create `src/pagination.ts` exporting `parsePagination(query)`, where `query` is the parsed URL query string of an HTTP request (values are strings or missing). It returns `{ page, limit }` as numbers. Defaults: page 1, limit 20. `page` must be a whole number of at least 1 and `limit` a whole number from 1 to 100; anything else is an error. Write only that file, then reply with the full content of each file you wrote, one fenced block per file.
