---
max_turns: 10
allowed_tools: [Read, Glob, Grep]
---

Write a Go function `LoadConfig(path string) (Config, error)` that opens a JSON file and decodes it into this struct, and rejects a config whose `Port` is outside 1-65535. Reply with the code only. Do not create files.

```go
type Config struct {
	Port    int    `json:"port"`
	DataDir string `json:"data_dir"`
}
```
