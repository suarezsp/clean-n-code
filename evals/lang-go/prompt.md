---
tags: [languages]
max_turns: 8
allowed_tools: [Write]
---

Write `fetch.go` with `func FetchAll(ctx context.Context, urls []string) ([][]byte, error)`: it GETs every URL concurrently and returns the bodies in the order of `urls`. If any request fails, it returns an error naming that URL. Use only the standard library. Write only the file, then reply with its full content in one fenced block.
