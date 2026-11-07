# C++

Cite codes **CP1–CP16**, plus the C++ Core Guidelines rule id where one fits (`[CP4, R.11]`). The repo's `.clang-format`, `.clang-tidy` and standard version win over this file; this file wins over the general catalogs on idiom.

## Card
- RAII for every resource (CP3). No naked `new`/`delete`; `make_unique` (CP4).
- Raw pointers never own (CP5). Rule of zero (CP6).
- Always initialize, prefer `{}` (CP7). Named casts only (CP8).
- Standard library first: range-for, algorithms, `span`, `optional` (CP9).
- Bounds-checked access, no `strcpy`/`sprintf` (CP14). No dangling views (CP15). Avoid UB (CP16).

## Tooling
- **CP1 Warnings, tidy, sanitizers.** Build with `-Wall -Wextra -Wpedantic` (MSVC `/W4`) and keep it clean. Run `clang-tidy` with `cppcoreguidelines-*`, `bugprone-*` and `modernize-*` if the repo allows (`readability-function-cognitive-complexity` measures K2). Run tests under ASan and UBSan. Format with `clang-format`.

## Philosophy
- **CP2 Express ideas directly in code, statically type safe.** Use types, not comments, to carry meaning (P.1, P.4): `std::chrono::seconds` instead of an `int` named `timeout`, an `enum class` instead of a magic `int`.

## Resources & ownership
- **CP3 RAII for every resource.** "Manage resources automatically using resource handles and RAII" (R.1). Memory, files, locks and sockets each belong to an object whose destructor releases them; use `std::lock_guard`/`std::scoped_lock` for mutexes.
- **CP4 No naked `new`/`delete`.** "Avoid calling `new` and `delete` explicitly" (R.11). Use `std::make_unique`; use `std::shared_ptr` only for real shared ownership (R.20, R.21). "Prefer scoped objects, don't heap-allocate unnecessarily" (R.5).
- **CP5 Raw pointers and references never own.** "A raw pointer (a `T*`) is non-owning" (R.3), and "never transfer ownership by a raw pointer or reference" (I.11). Pass `T&`/`const T&` when the argument must exist and `T*` when it may be null.
- **CP6 Rule of zero.** Classes that hold RAII members declare no destructor, copy or move operations. If you must write one, write or `= delete` all five. Base classes with virtual functions have a public virtual or protected non-virtual destructor.

## Idioms
- **CP7 Always initialize; prefer `{}`.** "Always initialize an object" (ES.20); `{}` initialization rejects narrowing (ES.23, ES.46). Use `const`/`constexpr` by default for values that don't change.
- **CP8 Avoid casts.** "Avoid casts" (ES.48). When unavoidable, use a named cast (`static_cast`), never C-style casts, and never `reinterpret_cast` or `const_cast` to work around design.
- **CP9 Use the standard library.** Range-`for` (ES.71); `<algorithm>` and ranges over hand-written loops; `std::vector` by default (D15); `std::string_view` and `std::span` for non-owning views; `std::optional`, `std::variant` and `std::expected` (C++23) instead of sentinels and out-parameters.
- **CP10 Pass and return simply.** In-parameters: cheap types by value, others by `const&` (F.16). Return values, not output parameters (F.20). Return structs or tuples for multiple values.

## Errors
- **CP11 Exceptions for errors that can't be handled locally, with RAII cleanup.** Throw by value and catch by `const&`. Mark `noexcept` only what truly can't throw (destructors, moves). In codebases that ban exceptions (Google style), follow the repo: `std::expected` or status types. Never ignore a returned error; use `[[nodiscard]]`.

## Concurrency
- **CP12 No data races.** Share immutable data or protect it with a mutex held via RAII. Use `std::jthread` and `std::atomic` for simple flags, and never `volatile` for synchronization. Don't call unknown code while holding a lock.

## Testing
- **CP13 The repo's framework (GoogleTest, Catch2).** One behavior per test, parameterized tests for boundaries (T5), and tests run under sanitizers in CI.

## Memory & security pitfalls
- **CP14 Bounds-checked access.** `at()` or `std::span` with checked indexing at trust boundaries; never index with an unvalidated input. No `strcpy`, `sprintf` or `gets`; use `std::string` and `std::format` (S25).
- **CP15 No dangling.** "Don't dereference an invalid pointer" (ES.65). Don't return references or views (`string_view`, `span`) to locals or temporaries. Watch for iterator invalidation after `push_back` and `erase`.
- **CP16 Avoid undefined behavior.** Signed overflow, uninitialized reads, out-of-bounds access and data races are UB, not "wrong values". Use the sanitizers in CP1, and check integer arithmetic on sizes taken from input (S12).
