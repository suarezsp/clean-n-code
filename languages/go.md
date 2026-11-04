# Go

Cite codes **GO1–GO16**. The repo's `golangci-lint` config wins over this file; this file wins over the general catalogs on idiom.

Sources:
- *Effective Go* (go.dev/doc/effective_go). Written for Go 1.0 and not updated for generics or modules, but its idioms stand.
- *Go Code Review Comments* (go.dev/wiki/CodeReviewComments), section headings as cited.
- Google Go Style Guide (google.github.io/styleguide/go) `[secondary]`.
- `errors` package docs (pkg.go.dev/errors): `fmt.Errorf("%w")`, `errors.Is`, `errors.As`.
- Pike, *Go Proverbs* (2015) `[talk]`.

## Card
- Every error handled, never `_` (GO8). Wrap with context: `fmt.Errorf("op %s: %w", x, err)`; `errors.Is` (GO9).
- Error path first, no `else` after `return` (GO10). Libraries don't panic (GO11).
- `defer` the release right after the acquire (GO12).
- `ctx context.Context` first, never stored (GO13). Every goroutine has a known end (GO14).
- Short scoped names, no `util` packages (GO2, GO3). `crypto/rand`, SQL parameters (GO16).

## Tooling
- **GO1 gofmt, vet, a linter.** Code is `gofmt`-formatted, never hand-aligned ("let the machine take care of most formatting issues"). `go vet` runs clean; use `golangci-lint` if configured (`gocyclo`/`gocognit` measure K1). Tests run with `-race` in CI.

## Naming
- **GO2 Short, scoped, MixedCaps names.** `MixedCaps`, no underscores. Short names for short scopes (`r`, `i`, `buf`); "the farther a name is used from its declaration, the more descriptive it must be". Here this sits closer to Go than N5 does, and it wins. Keep initialisms in one case: `ServeHTTP`, `appID`.
- **GO3 Packages are lowercase, single words, never `util`/`common`/`misc`.** Don't repeat the package in exported names: `bytes.Buffer`, not `bytes.ByteBuffer`. Getters drop `Get` (`Owner()`, `SetOwner()`). One-method interfaces are named method + `-er` (`Reader`).
- **GO4 Receivers are short and consistent.** One or two letters, the same on every method, never `this` or `self`. Use a pointer receiver when the method mutates, the struct is large, or it holds a `sync.Mutex`; don't mix receiver kinds on one type.

## Idioms
- **GO5 Make the zero value useful.** Design types so `var v T` works without a constructor, like `bytes.Buffer` and `sync.Mutex`. Declare empty slices as `var s []T` (nil), not `[]T{}`.
- **GO6 Accept interfaces, return structs; define interfaces at the consumer.** The package that uses a behavior declares the small interface it needs. Don't predefine interfaces on the implementer side "for mocking" (CRC "Interfaces", D2). "The bigger the interface, the weaker the abstraction" (Pike).
- **GO7 Prefer synchronous APIs.** Return results directly and let callers add goroutines (CRC "Synchronous Functions").

## Errors
- **GO8 Handle every error; never discard it with `_`.** Return `error` as the last result. No in-band sentinels like `-1` or `""`: return `(T, error)` or `(T, bool)` (CRC "Handle Errors", "In-Band Errors").
- **GO9 Wrap with context, inspect with `errors.Is`/`As`.** `return fmt.Errorf("load config %s: %w", path, err)`. Error strings are lowercase, without trailing punctuation, and prefixed by their origin. Compare errors with `errors.Is`, never with `==` on wrapped errors or with string matching.
- **GO10 Indent the error path, not the happy path.** `if err != nil { return … }` comes first; no `else` after a `return` (CRC "Indent Error Flow", K3).
- **GO11 Don't panic.** `panic` is for impossible states and broken init. Libraries return errors (CRC "Don't Panic"). `recover` lives only in a deferred function at a goroutine boundary.

## Resources & concurrency
- **GO12 `defer` the release right after the acquire.** `f, err := os.Open(p); if err != nil {…}; defer f.Close()`. The same goes for `mu.Unlock()` and `cancel()`. Deferred arguments are evaluated immediately; don't `defer` inside a long loop.
- **GO13 `context.Context` first, never stored.** `func (s *S) Fetch(ctx context.Context, id string)`. Pass it down and honor cancellation; don't put it in a struct (CRC "Contexts"). Every outbound call has a deadline (S19).
- **GO14 Every goroutine has a known end.** "Make it clear when, or whether, each goroutine exits" (CRC "Goroutine Lifetimes"). Use `errgroup` or `WaitGroup` and close channels from the sender. "Share memory by communicating", but a mutex is fine for a counter.

## Testing
- **GO15 Table-driven tests with useful failures.** `t.Run` subtests over a table of cases (T5). Failures print got and want: `t.Errorf("Parse(%q) = %v, want %v", in, got, want)`. Use `t.Helper()`, `t.TempDir()`, and `httptest` instead of real servers.

## Security pitfalls
- **GO16 `crypto/rand` for keys, parameters for SQL, `exec.Command` without a shell.** "Do not use package math/rand… to generate keys" (CRC "Crypto Rand", S20). `db.QueryContext(ctx, "… WHERE id = $1", id)`, never `fmt.Sprintf` SQL (S13). `exec.Command(name, args...)`, never `sh -c` with input. Set server `ReadHeaderTimeout` (S19).
