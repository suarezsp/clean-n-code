# SQL

Cite codes **SQ1–SQ14**. These rules apply to SQL files, migrations, and SQL embedded in host-language code. The repo's linter (SQLFluff) and the database vendor's documentation win over this file.

Sources:
- Holywell, *SQL Style Guide* (sqlstyle.guide, CC BY-SA 4.0), written to be compatible with Celko, *Joe Celko's SQL Programming Style* (2005) `[secondary for Celko]`.
- OWASP, *Query Parameterization Cheat Sheet*.
- Winand, *Use The Index, Luke* (use-the-index-luke.com), "Obfuscated Conditions".
- PostgreSQL documentation, §13.2 "Transaction Isolation".

## Card
- `snake_case`, no prefixes; uppercase keywords (SQ2, SQ4).
- Explicit `JOIN … ON`, no `SELECT *` in app code (SQ5).
- `IS NULL`; `NOT EXISTS` instead of `NOT IN` over nullable subqueries (SQ7).
- Sargable predicates: no functions on indexed columns (SQ11). No N+1, always `LIMIT` (SQ12).
- Bind parameters for values, allowlists for identifiers (SQ13).

## Tooling
- **SQ1 Lint with the repo's tool.** Use SQLFluff (with the dialect set) or the repo's formatter. Schema changes go through versioned migrations (Flyway, Liquibase, Alembic, the framework's migrator), never ad-hoc DDL against production.

## Naming
- **SQ2 `snake_case`, no prefixes.** Lowercase names with underscores; no `tbl_`/`sp_` prefixes or Hungarian notation; names never reserved words; tables as collective or plural nouns, columns singular; a table and its columns never share a name (sqlstyle "Naming conventions").
- **SQ3 Uniform suffixes.** `_id`, `_status`, `_total`, `_num`, `_name`, `_date`, `_size` and so on, used consistently. Aliases always use `AS` and relate to the object (`c` for `customers`). Computed columns get a schema-style name (`SUM(x) AS order_total`).

## Query style
- **SQ4 Uppercase keywords, one clause per line.** `SELECT`, `FROM`, `WHERE`, `JOIN` in uppercase; full keywords rather than abbreviations; ANSI forms over vendor ones (sqlstyle "Query syntax").
- **SQ5 Explicit `JOIN … ON`, explicit columns.** Never comma joins with the condition in `WHERE`. List the columns you need instead of `SELECT *` in application code, so schema changes don't silently change results or leak columns (S18).
- **SQ6 Readable predicates.** `BETWEEN` instead of paired comparisons; `IN (…)` instead of chains of `OR`; `CASE` to translate values; name complex conditions with a CTE (`WITH`) instead of nesting subqueries three deep (K2, G28).

## Correctness
- **SQ7 Handle `NULL` explicitly.** `= NULL` is never true; use `IS NULL`. `NOT IN` against a subquery that can return `NULL` returns no rows; use `NOT EXISTS`. Aggregates skip `NULL`s; decide whether that is intended.
- **SQ8 Constrain the schema.** Every table has a primary key; use foreign keys with explicit `ON DELETE`, `NOT NULL` by default, and `CHECK` constraints for known ranges (sqlstyle "Create syntax"). `NUMERIC`/`DECIMAL` for money, never `FLOAT`; timestamps with time zone, in ISO 8601.
- **SQ9 Avoid the designs the guide names.** No entity-attribute-value tables, no splitting one logical table into many (e.g. per year), no value and unit in separate unconstrained columns (sqlstyle "Designs to avoid").
- **SQ10 Know your isolation level.** PostgreSQL defaults to Read Committed, which allows non-repeatable reads and lost updates. Use `SELECT … FOR UPDATE`, an atomic `UPDATE … SET n = n + 1`, or a higher level. Repeatable Read and Serializable transactions must be retried on SQLSTATE `40001` (PostgreSQL §13.2).

## Performance
- **SQ11 Keep predicates sargable.** Don't wrap indexed columns in functions or arithmetic (`WHERE DATE(created_at) = …`, `WHERE price * 1.2 > …`), and don't compare across types; rewrite as ranges on the bare column (Winand, "Obfuscated Conditions"). A leading-wildcard `LIKE '%x'` can't use a B-tree index.
- **SQ12 No N+1 queries, bounded results.** Fetch related rows with a join or one `IN` query instead of a query per row (D16). Every query an end user can trigger has a `LIMIT`; paginate with keyset (`WHERE id > :last ORDER BY id LIMIT n`) for deep pages (S19). Check plans with `EXPLAIN` before adding indexes (D14).

## Security pitfalls
- **SQ13 Parameters for values, allowlists for identifiers.** Every value goes through a bind parameter; SQL injection is "best prevented through the use of parameterized queries". Dynamic SQL inside stored procedures also uses bind variables (`EXECUTE … USING`, `sp_executesql`) (OWASP, S13). Table, column and sort names can't be parameters; map them from an allowlist (S2).
- **SQ14 Least-privilege database roles.** The application connects with a role that has only the DML it needs: no DDL, no superuser, and separate roles for migrations and read replicas (S1). Use row-level security where the database supports it and tenancy demands it (S18).
