---
tags: [languages]
max_turns: 8
allowed_tools: [Write]
---

Write `Prices.cs` with a `Price` type (`Sku`, `Cents`) and `public static async Task<IReadOnlyList<Price>> LoadAsync(string path, CancellationToken token)`: it reads `sku;cents` lines and fails on a malformed line, saying which one. Write only the file, then reply with its full content in one fenced block.
