---
tags: [languages]
max_turns: 8
allowed_tools: [Write]
---

Write `pricing.ts` exporting `async function fetchPrice(sku: string): Promise<number>`: it GETs `https://prices.example/api/<sku>` with the global `fetch`, expects a JSON body `{ "cents": <number> }` and returns `cents`. A non-200 response or a body of another shape throws an error that names the SKU. Use no libraries. Write only the file, then reply with its full content in one fenced block.
