---
type: llm
weight: 1
---

PASS only if all hold: `ctx` is the first parameter and is passed to the requests (`http.NewRequestWithContext`); every error is handled, none assigned to `_`; errors are wrapped with the URL using `fmt.Errorf` and `%w`; `defer resp.Body.Close()` follows the successful request; every goroutine ends (a `sync.WaitGroup`, `errgroup` or channel receive covers all of them). Otherwise FAIL, naming the rule.
