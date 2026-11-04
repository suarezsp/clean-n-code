# C#

Cite codes **CS1–CS15**. The repo's `.editorconfig`, analyzers and `Directory.Build.props` win over this file; this file wins over the general catalogs on idiom.

Sources:
- Microsoft Learn, *.NET Coding Conventions*, *C# identifier naming rules and conventions*, *Nullable reference types* (learn.microsoft.com/dotnet/csharp).
- Cwalina, Barton & Abrams, *Framework Design Guidelines*, 3rd ed. (Microsoft Learn: standard/design-guidelines) `[secondary]`.
- Cleary, "Async/Await – Best Practices in Asynchronous Programming", *MSDN Magazine*, March 2013.

## Card
- `var` only when the type is obvious (CS3). Records and pattern matching (CS4).
- Nullable on; `!` sparingly (CS7). Catch specific types; `throw;` not `throw ex;` (CS8).
- `using` declarations for `IDisposable` (CS10).
- No `async void` (CS11). Never `.Result`/`.Wait()`; pass `CancellationToken` (CS12).
- Parameterized SQL, no `Html.Raw` with input (CS14). No `BinaryFormatter` (CS15).

## Tooling
- **CS1 `.editorconfig`, analyzers on, warnings as errors.** Use the repo's `.editorconfig` and enable .NET code analysis (`AnalysisLevel`, `EnforceCodeStyleInBuild`). Run `dotnet format` in CI. CA1502 measures K1.

## Naming
- **CS2 .NET casing.** `PascalCase` types, namespaces and all public members; `I` prefix on interfaces; `camelCase` locals and parameters; `_camelCase` private fields (Microsoft Learn, identifier names). `Async` suffix on awaitable methods. Language keywords over runtime types (`string`, not `String`).

## Idioms
- **CS3 `var` only when the type is obvious from the right side.** A `new` expression, a cast or a literal. Don't use `var` for method results or in `foreach` (conventions, "Implicitly typed local variables").
- **CS4 Modern constructs.** File-scoped namespaces; `using` directives outside the namespace; `record` for value-like data (D6); `required`/`init` properties instead of long constructors; collection expressions; pattern matching and `switch` expressions instead of type-check ladders (K5).
- **CS5 LINQ for collection queries, readable names.** Filter with `where` early and give query variables meaningful names (conventions). Materialize once (`ToList()`) when a query is enumerated repeatedly; never enumerate an `IQueryable` per item (D16).
- **CS6 `Func<>`/`Action<>` over custom delegate types**, unless the delegate is part of a public contract (conventions).

## Errors & null
- **CS7 Nullable reference types on.** `<Nullable>enable</Nullable>`. Treat nullable warnings as design errors. Use `!` sparingly: "Each occurrence is a place the compiler can no longer protect you"; prefer a null check or `[NotNullWhen]` (Microsoft Learn).
- **CS8 Catch only what you can handle.** No `catch (Exception)` without a filter at an isolation boundary; use specific exception types (conventions). Rethrow with `throw;`, never `throw ex;`, which loses the stack. Validate arguments with `ArgumentNullException.ThrowIfNull` and `ArgumentOutOfRangeException.ThrowIf*`.
- **CS9 Exceptions are not control flow.** Use `TryParse`/`TryGetValue` for expected failures (*FDG* "Tester-Doer", "Try-Parse" patterns).

## Resources & concurrency
- **CS10 `using` declarations for every `IDisposable`.** Replace `try/finally { Dispose(); }` with `using var x = …;` (conventions). Implement `IAsyncDisposable` for async cleanup.
- **CS11 No `async void`.** Async methods return `Task`/`Task<T>`/`ValueTask`; `async void` exceptions "can't be caught" and can't be awaited or tested. The only exception is event handlers, which should only `await` a `Task` method (Cleary).
- **CS12 Async all the way down.** Never block on async with `.Result`, `.Wait()` or `GetAwaiter().GetResult()`; that causes deadlocks and `AggregateException`. Use `await Task.WhenAll`, `Task.Delay` and `SemaphoreSlim.WaitAsync` (Cleary, Figure 5). Library code uses `ConfigureAwait(false)`. Accept and pass a `CancellationToken`.

## Testing
- **CS13 xUnit/NUnit/MSTest as the repo uses, one behavior per test.** `[Theory]`/`[TestCase]` for boundary tables (T5). Inject `TimeProvider` instead of `DateTime.Now`. Async tests return `Task`.

## Security pitfalls
- **CS14 Parameterized queries, encoded output.** `SqlCommand` with `SqlParameter`, or EF Core LINQ; never concatenate into `FromSqlRaw`; use `FromSqlInterpolated` (S13). Razor encodes by default; `Html.Raw` is a sanitizer boundary (S14).
- **CS15 No `BinaryFormatter`; secrets from configuration providers.** `BinaryFormatter` is unsafe for untrusted input and obsolete; use `System.Text.Json` (S16). Read secrets via `IConfiguration` from user-secrets or a key vault, never from `appsettings.json` in the repo (S7, S8). Use `RandomNumberGenerator` for tokens (S20).
