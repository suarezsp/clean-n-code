# TypeScript

Cite codes **TS1–TS14**. TypeScript is JavaScript plus types, so `javascript.md` applies as well; this file adds the type-level rules. The repo's `tsconfig` and ESLint config win.

Sources:
- TypeScript Handbook and TSConfig reference (typescriptlang.org/tsconfig), `strict` and related flags.
- Google TypeScript Style Guide (google.github.io/styleguide/tsguide.html), section headings as cited.
- typescript-eslint rules (typescript-eslint.io), for example `no-floating-promises` in `recommended-type-checked`.

## Card
- `strict` on; never weaken tsconfig (TS1). `unknown` not `any` at boundaries (TS2).
- No `as`/`!` without a check (TS3). No `@ts-ignore` (TS4).
- Discriminated unions with exhaustive `switch` (TS6). `readonly` by default (TS8).
- Narrow `catch (e: unknown)` (TS12). No floating promises (TS13).
- Types are erased: validate untrusted input with a runtime schema (TS14).

## Tooling
- **TS1 `strict` on, and type-aware linting.** `"strict": true` enables `noImplicitAny`, `strictNullChecks`, `useUnknownInCatchVariables` and six more. Also consider `noUncheckedIndexedAccess` (index reads become `T | undefined`) and `exactOptionalPropertyTypes`. Lint with `typescript-eslint` `recommended-type-checked`. Never weaken `tsconfig` to make an error disappear.

## Types
- **TS2 `unknown`, not `any`.** `any` "can mask severe programming errors" (Google). Data from outside the program (JSON, `catch` variables, message events) is `unknown` and gets narrowed or schema-validated (zod, valibot) at the boundary (S12).
- **TS3 No unchecked assertions.** `x as T` and `y!` "are unsafe" because they add no runtime check (Google). Prefer narrowing (`typeof`, `in`, `instanceof`, a user-defined type guard). Use annotations, not `as`, on object literals.
- **TS4 Never suppress the compiler.** "Do not use `@ts-ignore`", nor `@ts-expect-error` or `@ts-nocheck` outside tests (Google). Fix the type, or write a narrow, commented guard.
- **TS5 Let inference work and annotate the boundaries.** Skip annotations that are trivially inferred (`const n = 5`). Annotate exported function parameters and return types so the API is explicit and errors surface at the definition.
- **TS6 Model states with discriminated unions.** `type Result = { ok: true; value: T } | { ok: false; error: E }` instead of optional flags that allow impossible combinations (G23). Check exhaustiveness with a `never` default in `switch` (K5).
- **TS7 `interface` for object shapes, `type` for unions and compositions.** Use an interface for object types (Google). Don't bake `| null`/`| undefined` into an alias; add it where the alias is used. Use `T[]` for simple element types and `Array<T>` for complex ones.
- **TS8 Prefer `readonly` and `as const`.** Mark properties that are never reassigned `readonly`; use `ReadonlyArray`/`readonly T[]` for parameters you don't mutate (D9). Use `as const` for literal tables instead of `enum` when only values are needed; never use `const enum` (Google).
- **TS9 Avoid return-type-only generics and over-clever types.** A generic should relate at least two positions (parameter and return). Deep conditional or mapped types that a reader can't follow are G16; name intermediate types.

## Modules & classes
- **TS10 ES modules, named exports, no `namespace`.** "Your code must not use the `namespace Foo { ... }` construct"; use named exports and no `export let` (Google). Use `import type` for type-only imports.
- **TS11 Class members.** Use TypeScript `private`, not `#private` (Google), unless the repo uses `#`. Drop redundant `public`. Use parameter properties only for simple injection (D7).

## Errors
- **TS12 Throw `Error` subclasses; narrow `catch (e: unknown)`.** "Do not throw primitives" (Google). In `catch`, check `e instanceof Error` before reading `.message`. Return a `Result` union instead of throwing for expected failures, such as validation, when the codebase does that.
- **TS13 No floating promises.** Every promise is awaited, returned, or explicitly handled; `no-floating-promises` catches "improperly sequenced operations, ignored Promise rejections". `void p` does not handle rejections (typescript-eslint).

## Security pitfalls
- **TS14 Types are erased at runtime.** A type annotation on `req.body` validates nothing. Parse untrusted input with a runtime schema before it becomes a typed value (S12, S18 for mass assignment). All of `javascript.md`'s security pitfalls apply (JS14–JS16).
