---
tags: [graded]
max_turns: 15
allowed_tools: [Write]
---

Write a TypeScript sales report in `src/` (split it into files as you see fit). It exports `salesReport(csv: string): string`.

Input is CSV text with the header `date,region,amount_cents`. A row is valid when `date` is `YYYY-MM-DD`, `region` is non-empty and `amount_cents` is a whole number of at least 0. Invalid rows don't stop the report: each one becomes an error line `line <n>: <reason>` (the header is line 1). Blank lines are ignored.

The output lists one line per region with its total in euros, two decimals, sorted by total descending and then by region name; then a `TOTAL` line; then, if there were invalid rows, a blank line, `Errors:` and the error lines in input order. Align the amounts in a right-justified column.

Write only the files, then reply with the full content of each file you wrote, one fenced block per file.
