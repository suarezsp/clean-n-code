# Rust

Cite codes **RS1–RS15**, plus the Rust API Guidelines id where one fits (`[RS6, C-CONV]`). The repo's `rustfmt.toml`, `clippy.toml` and lint attributes win over this file; this file wins over the general catalogs on idiom.

## Card
- clippy and rustfmt clean (RS1). `as_`/`to_`/`into_` naming (RS3).
- Newtypes and enums over bools; private fields (RS4). Borrow in params, no `.clone()` to please the borrow checker (RS5).
- `Result` + `?` with context (RS8). Panic only on broken invariants; `expect`, not `unwrap` (RS9).
- Every `unsafe` has a `// SAFETY:` comment and a safe wrapper (RS11).
- No `std` mutex guard across `.await` (RS12). `checked_*` on untrusted sizes (RS15).

## Tooling
- **RS1 rustfmt and clippy clean.** `cargo fmt --check` and `cargo clippy -- -D warnings` pass in CI. Enable `clippy::pedantic` selectively if the repo does. Clippy's `cognitive_complexity` lint is the K1/K2 proxy. Run `cargo test` and, for `unsafe` code, Miri.

## Naming
- **RS2 RFC 430 casing.** `snake_case` functions, variables and modules; `UpperCamelCase` types and traits; `SCREAMING_SNAKE_CASE` constants (C-CASE). Getters drop `get_` (`fn name(&self)`), and iterator methods are `iter`, `iter_mut`, `into_iter` (C-GETTER, C-ITER).
- **RS3 Conversions say their cost.** `as_` is cheap and borrowed, `to_` is expensive or owned, `into_` consumes self (C-CONV). Implement `From`/`TryFrom`/`AsRef` instead of ad-hoc conversion methods (C-CONV-TRAITS).

## Types & ownership
- **RS4 Make invalid states unrepresentable.** Use newtypes for distinct units and ids (C-NEWTYPE), and enums instead of `bool` or `Option` flag arguments (C-CUSTOM-TYPE, F3). Validate in a constructor and keep the fields private (C-STRUCT-PRIVATE).
- **RS5 Borrow in parameters, own in fields.** Take `&str`, `&[T]` and `impl AsRef<Path>` instead of `&String` or `&Vec<T>`. Let callers decide where to clone (C-CALLER-CONTROL). Don't scatter `.clone()` to silence the borrow checker; restructure ownership instead.
- **RS6 Implement the common traits.** `Debug` on all public types (C-DEBUG), plus `Clone`, `PartialEq`, `Eq`, `Hash` and `Default` where they make sense (C-COMMON-TRAITS). Make types `Send` and `Sync` when possible (C-SEND-SYNC).
- **RS7 Iterators over index loops.** Use `iter().map().filter().collect()` and `for x in &v`, not `for i in 0..v.len()` (`clippy::needless_range_loop`). Pick collections by access pattern (`HashMap`, `BTreeMap`, `VecDeque`; D15).

## Errors
- **RS8 `Result` by default, `?` to propagate.** "Returning `Result` is a good default choice when you're defining a function that might fail" (Book 9.3). Propagate with `?` and add context (`anyhow::Context` in applications; a `thiserror` enum in libraries).
- **RS9 Panic only for broken invariants.** `panic!` is for a "bad state" that should never happen, not for user input or I/O failure (Book 9.3). Use `unwrap` only in tests and prototypes; elsewhere use `expect("why this can't fail")`. Document panics in a `# Panics` section (C-FAILURE).
- **RS10 Meaningful error types.** Implement `std::error::Error`, `Display` and `Debug`; make errors `Send + Sync + 'static` (C-GOOD-ERR). Never use `()` or `String` as a library's error type.

## Unsafe
- **RS11 Minimize and encapsulate `unsafe`.** "The only bullet-proof way to limit the scope of unsafe code is at the module boundary with privacy" (Nomicon). Wrap it in a safe API whose private fields protect the invariants. Every `unsafe` block has a `// SAFETY:` comment stating why it is sound (`clippy::undocumented_unsafe_blocks`), and every `unsafe fn` has a `# Safety` doc section (C-FAILURE).

## Concurrency
- **RS12 Let the type system carry thread safety.** Share with `Arc<Mutex<T>>`/`RwLock`, or pass ownership through channels. Never hold a `std::sync::Mutex` guard across `.await`; use `tokio::sync::Mutex` or restructure. Don't block inside async tasks (use `spawn_blocking`).

## Testing & docs
- **RS13 Unit tests beside the code, doc examples that run.** A `#[cfg(test)] mod tests` per module and integration tests in `tests/`. Doc examples compile and use `?`, not `unwrap` (C-EXAMPLE, C-QUESTION-MARK). Use `proptest` or `quickcheck` for boundary-heavy logic (T5).

## Security pitfalls
- **RS14 Audit dependencies and `unsafe` reach.** Run `cargo audit` or `cargo deny` in CI, commit `Cargo.lock` for binaries, and review crates that use `unsafe` or build scripts (S23). Use `rand::rngs::OsRng` or `getrandom` for secrets (S20).
- **RS15 Integer and input handling.** Release builds wrap on overflow silently. Use `checked_*`/`saturating_*` for arithmetic on untrusted sizes, and `TryFrom` instead of `as` for narrowing casts (`clippy::cast_possible_truncation`, S12).
