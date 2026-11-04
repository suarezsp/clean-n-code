# Java

Cite codes **JA1–JA15**. The repo's Checkstyle, Spotless, Error Prone or IDE config wins over this file; this file wins over the general catalogs on idiom. Clean Code's J1–J3 (`smells.md`) also apply.

Sources:
- Google Java Style Guide (google.github.io/styleguide/javaguide.html), section numbers as cited.
- Bloch, *Effective Java*, 3rd ed. (2018), item numbers as cited `[secondary]`.
- Oracle, *Addressing Deserialization Vulnerabilities* (Java SE 21 docs) and *Secure Coding Guidelines for Java SE* `[secondary]`.
- SEI CERT Oracle Coding Standard for Java, for example SER12-J.

## Card
- Immutable by default: `final`, records, unmodifiable collections (JA4). Composition over inheritance (JA5).
- Unchecked exceptions for bugs, specific types, values in messages (JA9). Never swallow a caught exception (JA10).
- `Optional` only for return values (JA11). try-with-resources (JA12).
- `java.util.concurrent`, not raw threads (JA13).
- `PreparedStatement`; no deserialization of untrusted data (JA15).

## Tooling
- **JA1 Formatter and static analysis.** Use the repo's formatter (google-java-format, Spotless) and analyzers (Error Prone, SpotBugs, Checkstyle, PMD; PMD's `CyclomaticComplexity` measures K1). Compile with `-Xlint:all` and keep it warning-free.

## Naming & structure
- **JA2 Google naming.** Packages all lowercase with no underscores; `UpperCamelCase` classes; `lowerCamelCase` methods and fields; `UPPER_SNAKE_CASE` only for deeply immutable `static final` constants (5.2). One top-level class per file; no wildcard imports (3.3.1, 3.4.1).
- **JA3 Always `@Override`.** Use it on every override and every interface implementation (6.1). Every `switch` is exhaustive, and old-style fall-through is commented (4.8.4).

## Idioms
- **JA4 Minimize mutability.** Use `final` fields, `record` for data carriers (D6), and `List.of`/`Map.of` or `Collections.unmodifiable*` for collections you return. Defensively copy mutable inputs and outputs (*EJ* 17, 50).
- **JA5 Favor composition over inheritance.** Inherit only for a true is-a within one package or a class designed for extension; otherwise wrap and delegate (*EJ* 18, 19). Make classes `final` unless designed for extension.
- **JA6 Static factories and builders over telescoping constructors.** `of`, `from`, `valueOf`; use a builder past about 4 parameters (*EJ* 1, 2; F1).
- **JA7 `equals`, `hashCode` and `toString` together.** Override `hashCode` whenever you override `equals` (*EJ* 11). Records do this for you.
- **JA8 Streams for transformations, loops for side effects.** Use streams for map/filter/collect pipelines (K7). Don't use `forEach` to mutate outside state, and don't nest streams beyond what reads in one pass (*EJ* 45, 46).

## Errors & null
- **JA9 Exceptions for exceptional conditions only.** Use unchecked exceptions for programming errors and checked exceptions only when the caller can recover (*EJ* 69–71). Prefer standard exceptions (`IllegalArgumentException`, `IllegalStateException`). Include the failing values in the message (*EJ* 75).
- **JA10 Never swallow a caught exception.** "It is very rarely correct to do nothing in response to a caught exception" (6.2). Rethrow wrapped with the cause (`new X("…", e)`), or log with the stack, never only `e.getMessage()`.
- **JA11 `Optional` for absent return values, nowhere else.** Return `Optional<T>` instead of `null` from lookups. Never use it for fields, parameters or collections; return an empty collection instead (*EJ* 54, 55).

## Resources & concurrency
- **JA12 try-with-resources for every `AutoCloseable`.** Never close in a `finally` by hand. Never use finalizers: "Do not override `Object.finalize`" (6.4; *EJ* 8, 9).
- **JA13 Use `java.util.concurrent`, not raw threads.** Executors, `CompletableFuture`, virtual threads (Java 21) and concurrent collections instead of `new Thread` and `wait`/`notify` (*EJ* 80, 81). Document thread-safety; guard shared mutable state with one lock or make it immutable.

## Testing
- **JA14 JUnit 5, one behavior per test.** Use the repo's framework. `@ParameterizedTest` for boundaries (T5), `assertThrows` for failures, AssertJ or Hamcrest if the repo uses them, and an injected `Clock` instead of `System.currentTimeMillis()`.

## Security pitfalls
- **JA15 Parameterize, and never deserialize untrusted data.** `PreparedStatement` with `?` placeholders, never string-built SQL (S13). "Do not deserialize untrusted data"; if you must, use serialization filters (`ObjectInputFilter`) with an allowlist (Oracle; CERT SER12-J; S16). Disable DTDs and external entities in XML parsers (XXE). Use `SecureRandom` for tokens (S20).
