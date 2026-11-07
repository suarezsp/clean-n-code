# Sources

Where each language guide and catalog comes from, kept out of the files agents read. `[secondary]` marks sources checked only through summaries. `smells.md` cites *Clean Code* page by page and `design.md` names each source inline.

## bash.md

- Google Shell Style Guide (google.github.io/styleguide/shellguide.html), section headings as cited.
- ShellCheck (shellcheck.net) and its wiki (SC codes).
- Wooledge, *Bash Pitfalls* (mywiki.wooledge.org/BashPitfalls), pitfall numbers as cited.
- GNU Bash Reference Manual.

## c.md

- SEI CERT C Coding Standard (cmu-sei.github.io/secure-coding-standards/sei-cert-c-coding-standard), rule ids and titles as cited.
- Linux kernel coding style (kernel.org/doc/html/latest/process/coding-style.html), section numbers as cited.
- GCC and Clang manuals: warning options, `-fsanitize`, `_FORTIFY_SOURCE`.
- CISA/NSA, *Memory Safe Languages* (2025) `[secondary]`, see S25.

## cpp.md

- Stroustrup & Sutter (eds.), *C++ Core Guidelines* (isocpp.github.io/CppCoreGuidelines), rule ids as cited.
- Google C++ Style Guide (google.github.io/styleguide/cppguide.html) `[secondary]`.
- Compiler docs: GCC/Clang warning options and sanitizers (`-fsanitize=address,undefined`).

## csharp.md

- Microsoft Learn, *.NET Coding Conventions*, *C# identifier naming rules and conventions*, *Nullable reference types* (learn.microsoft.com/dotnet/csharp).
- Cwalina, Barton & Abrams, *Framework Design Guidelines*, 3rd ed. (Microsoft Learn: standard/design-guidelines) `[secondary]`.
- Cleary, "Async/Await – Best Practices in Asynchronous Programming", *MSDN Magazine*, March 2013.

## go.md

- *Effective Go* (go.dev/doc/effective_go). Written for Go 1.0 and not updated for generics or modules, but its idioms stand.
- *Go Code Review Comments* (go.dev/wiki/CodeReviewComments), section headings as cited.
- Google Go Style Guide (google.github.io/styleguide/go) `[secondary]`.
- `errors` package docs (pkg.go.dev/errors): `fmt.Errorf("%w")`, `errors.Is`, `errors.As`.
- Pike, *Go Proverbs* (2015) `[talk]`.

## java.md

- Google Java Style Guide (google.github.io/styleguide/javaguide.html), section numbers as cited.
- Bloch, *Effective Java*, 3rd ed. (2018), item numbers as cited `[secondary]`.
- Oracle, *Addressing Deserialization Vulnerabilities* (Java SE 21 docs) and *Secure Coding Guidelines for Java SE* `[secondary]`.
- SEI CERT Oracle Coding Standard for Java, for example SER12-J.

## javascript.md

- MDN Web Docs: *Using promises*, *Strict mode*, *Equality comparisons*, *JavaScript modules*.
- Google JavaScript Style Guide (google.github.io/styleguide/jsguide.html), section numbers as cited. Google no longer updates it and recommends TypeScript.
- Node.js, *Security Best Practices* (nodejs.org/en/learn/getting-started/security-best-practices).
- ECMAScript specification (tc39.es/ecma262) for semantics.

## php.md

- PHP-FIG, *PER Coding Style* 3.0 (php-fig.org/per/coding-style), which "extends, expands and replaces" PSR-12; PSR-1 and PSR-4.
- *PHP The Right Way* (phptherightway.com), section names as cited.
- PHP Manual (php.net/manual): PDO prepared statements, `password_hash`, `htmlspecialchars`, error configuration.

## python.md

- PEP 8, *Style Guide for Python Code* (peps.python.org/pep-0008), sections as cited.
- PEP 20, *The Zen of Python*; PEP 257, *Docstring Conventions*; PEP 484 and the `typing` docs.
- Google Python Style Guide (google.github.io/styleguide/pyguide.html), section numbers as cited.
- Python docs: `subprocess` → "Security Considerations"; `pickle` → the warning at the top.

## rust.md

- *The Rust Programming Language* (doc.rust-lang.org/book), chapter 9.3 "To panic! or Not to panic!".
- Rust API Guidelines (rust-lang.github.io/api-guidelines), checklist ids (C-*) as cited.
- *The Rustonomicon*, "Working with Unsafe" (doc.rust-lang.org/nomicon).
- Clippy lint list (rust-lang.github.io/rust-clippy) and the Rust Style Guide (rustfmt).

## sql.md

- Holywell, *SQL Style Guide* (sqlstyle.guide, CC BY-SA 4.0), written to be compatible with Celko, *Joe Celko's SQL Programming Style* (2005) `[secondary for Celko]`.
- OWASP, *Query Parameterization Cheat Sheet*.
- Winand, *Use The Index, Luke* (use-the-index-luke.com), "Obfuscated Conditions".
- PostgreSQL documentation, §13.2 "Transaction Isolation".

## typescript.md

- TypeScript Handbook and TSConfig reference (typescriptlang.org/tsconfig), `strict` and related flags.
- Google TypeScript Style Guide (google.github.io/styleguide/tsguide.html), section headings as cited.
- typescript-eslint rules (typescript-eslint.io), for example `no-floating-promises` in `recommended-type-checked`.

## complexity.md

- NIST SP 500-235, *Structured Testing* (Watson & McCabe, 1996), §2.5.
- SonarSource, *Cognitive Complexity* white paper (G. Ann Campbell, 2023 edition).
- Fowler, refactoring.com catalog.
- Martin, *Clean Code* chapter 3, p34 and p66.
- Google Python Style Guide §3.18 "Function length".

## security.md

- Saltzer & Schroeder, *The Protection of Information in Computer Systems*, Proc. IEEE 63(9), 1975, §I.A.3 (web.mit.edu/saltzer/www/publications/protection/).
- OWASP *Secrets Management Cheat Sheet* (cheatsheetseries.owasp.org), section numbers as cited.
- NIST SP 800-63B-4, *Authentication and Authenticator Management*, §3.1.1.2 (pages.nist.gov/800-63-4/sp800-63b.html).
- MITRE / CISA, *2025 CWE Top 25 Most Dangerous Software Weaknesses* (cwe.mitre.org/top25), ranks as cited.
- OWASP Top 10:2025 (top10.owasp.org) and OWASP API Security Top 10:2023 (api-security.owasp.org).
- NIST SP 800-218, *Secure Software Development Framework* v1.1 (csrc.nist.gov/projects/ssdf) `[secondary for task wording]`.
- OWASP ASVS 5.0 (2025) `[secondary]`; CISA/NSA, *Memory Safe Languages* (2025) `[secondary]`.
