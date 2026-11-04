# PHP

Cite codes **PH1–PH14**. The repo's PHP-CS-Fixer, PHP_CodeSniffer, PHPStan or Psalm config wins over this file; this file wins over the general catalogs on idiom.

Sources:
- PHP-FIG, *PER Coding Style* 3.0 (php-fig.org/per/coding-style), which "extends, expands and replaces" PSR-12; PSR-1 and PSR-4.
- *PHP The Right Way* (phptherightway.com), section names as cited.
- PHP Manual (php.net/manual): PDO prepared statements, `password_hash`, `htmlspecialchars`, error configuration.

## Card
- `declare(strict_types=1);` and full types (PH4). Enums, `match`, readonly (PH5).
- Constructor injection, no service locator (PH6).
- Exceptions, never `@` (PH8). Production logs errors, never displays them (PH9).
- PDO prepared statements only (PH12). `htmlspecialchars`, `password_hash` (PH13).
- Never `unserialize` input (PH14).

## Tooling
- **PH1 PER-CS formatting, static analysis in CI.** Run PHP-CS-Fixer (`@PER-CS`) or PHPCS on a pre-commit hook. Run PHPStan or Psalm at the highest level the repo sustains, with a baseline for legacy code. Target a supported PHP 8.x.

## Naming & structure
- **PH2 PSR-1 and PER names.** `PascalCase` classes, interfaces, traits and enums; `camelCase` methods; `UPPER_SNAKE` class constants. Abbreviations are written as words (`XmlParser`, not `XMLParser`) (PER §2.7). Visibility is declared on every property, method and constant (PER §4.3).
- **PH3 One class per file, PSR-4 autoloading, namespaces.** Composer's PSR-4 autoloader; no `require` chains, no PSR-0 ("Namespaces and Autoloading").

## Types & idioms
- **PH4 `declare(strict_types=1);` and full type declarations.** Declare parameter, return and property types, including union, nullable `?T` and `never`. Use `mixed` only at real boundaries.
- **PH5 Modern constructs over arrays-as-objects.** Constructor property promotion, `readonly` properties and classes, `enum` instead of string constants (K5), and `match` instead of `switch` ladders. Use value objects instead of associative arrays passed between layers (D6).
- **PH6 Dependency injection, not service location.** Pass collaborators through the constructor and depend on interfaces; "avoid using a container as a service locator" ("Dependency Injection", D7).
- **PH7 Multibyte-safe strings, immutable dates.** `mb_*` functions for user text, `utf8mb4` end to end ("Working with UTF-8"). `DateTimeImmutable` and `DateInterval` instead of timestamp arithmetic ("Date and Time").

## Errors
- **PH8 Exceptions, specific types, no `@`.** Throw exceptions instead of returning `false`; use SPL and domain exception types; never use the `@` error-suppression operator, use `??` or an explicit check ("Errors and Exceptions"). Convert warnings to `ErrorException` so nothing fails silently.
- **PH9 Production shows nothing and logs everything.** `display_errors = Off`, `log_errors = On`, `error_reporting = E_ALL` ("Error Reporting"). Development shows all errors.

## Dependencies
- **PH10 Commit `composer.lock`; deploy with `composer install`.** "Don't use `composer update` when deploying" ("Dependency Management"). Run `composer audit` in CI (S23).

## Testing
- **PH11 PHPUnit or Pest, isolated.** Data providers for boundary tables (T5); an injected clock (`Psr\Clock\ClockInterface`) instead of `time()`; no real network or database in unit tests.

## Security pitfalls
- **PH12 PDO prepared statements only.** Bound parameters, never interpolated SQL; set `PDO::ATTR_EMULATE_PREPARES => false` and `ERRMODE_EXCEPTION` ("Databases", S13). Validate input with `filter_var` or a validation layer first (S12).
- **PH13 Escape output, hash passwords properly.** Use `htmlspecialchars($s, ENT_QUOTES, 'UTF-8')` or the template engine's auto-escape (S14), and `escapeshellarg` if a shell is unavoidable. Use `password_hash($p, PASSWORD_DEFAULT)` with `password_verify`, never `md5`/`sha1` (S11). Use `random_bytes` for tokens (S20).
- **PH14 Never `unserialize` input; keep config out of the web root.** `unserialize` on user data is object injection; use `json_decode` (S16). Config and secrets live outside the document root and out of git ("Configuration Files", S7). No `eval`, no `include` built from input (S13, S15).
