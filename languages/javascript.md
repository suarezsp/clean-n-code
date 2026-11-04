# JavaScript

Cite codes **JS1–JS16**. The repo's ESLint/Prettier config wins over this file; this file wins over the general catalogs on idiom. For `.ts` files, read `typescript.md` too.

Sources:
- MDN Web Docs: *Using promises*, *Strict mode*, *Equality comparisons*, *JavaScript modules*.
- Google JavaScript Style Guide (google.github.io/styleguide/jsguide.html), section numbers as cited. Google no longer updates it and recommends TypeScript.
- Node.js, *Security Best Practices* (nodejs.org/en/learn/getting-started/security-best-practices).
- ECMAScript specification (tc39.es/ecma262) for semantics.

## Card
- `const`/`let`, never `var` (JS3). `===` except `== null` (JS4). Named exports (JS6).
- Throw `Error` with `{ cause }`; no empty `catch` (JS9).
- Await or return every promise (JS10). `Promise.all` for independent work, no `await` in loops (JS11).
- Don't block the event loop with sync I/O (JS12).
- No `eval`/`innerHTML` with input (JS14). No merging untrusted JSON into objects (JS15).

## Tooling
- **JS1 Prettier formats, ESLint judges.** Use the repo config. With none, at least use ESLint `recommended` plus `eqeqeq`, `no-var`, `prefer-const`, `no-implicit-globals` and `complexity` (K1). Code is ES modules in strict mode.

## Naming
- **JS2 Google casing.** `lowerCamelCase` variables, functions and methods; `UpperCamelCase` classes; `CONSTANT_CASE` only for deeply immutable module constants (Google 6.2). No abbreviations a newcomer can't decode (N1).

## Idioms
- **JS3 `const` by default, `let` when reassigned, never `var`.** One variable per declaration, declared next to its first use (Google 5.1).
- **JS4 Strict equality.** `===`/`!==` always. The one allowed exception is `x == null` to catch both null and undefined (Google 5.10). Use `??` and `?.` instead of `||` when `0`, `""` or `false` are valid values.
- **JS5 Modern syntax over workarounds.** `for…of` for arrays and iterables, never `for…in` on arrays (5.8.1). Spread and rest instead of `arguments` and `apply` (5.5.5). Template literals instead of concatenation. Destructuring for options objects instead of long positional parameter lists (F1).
- **JS6 Named exports, no cycles.** Use named exports, no default exports, no mutable exported bindings, and no circular imports between modules (Google 3.4).
- **JS7 Don't fight the language.** No `with`, no modifying built-in prototypes, no `new Boolean/Number/String` (Google 5.11). Use arrow functions for callbacks instead of `const self = this` or `.bind(this)` (5.5.3).
- **JS8 Prefer immutable updates.** Return new arrays and objects (`map`, `filter`, spread, `structuredClone`) instead of mutating arguments (D9). Don't use `Array.prototype.sort`/`reverse` on shared data; use `toSorted`/`toReversed`.

## Errors
- **JS9 Throw `Error` objects with context.** Never throw strings or plain objects (Google 5.8.2). Use `new Error(msg, { cause: err })` to keep the chain. An empty `catch` needs a comment saying why (5.8.2.1).
- **JS10 Never leave a promise floating.** Return or `await` every promise. A promise that "is not returned… is said to be floating" and its rejection is lost (MDN). Handle rejections at the top level. In `async` code, `try/catch` around `await`, not `.catch` chains mixed with callbacks.
- **JS11 Run independent work concurrently, on purpose.** `await Promise.all([...])` for independent calls; `Promise.allSettled` when one failure must not hide the others (MDN). No `await` inside a loop over independent items (D16). Wrap callback APIs once at the lowest level ("don't mix callbacks and promises").

## Resources & concurrency
- **JS12 Don't block the event loop.** No sync file or crypto calls (`readFileSync`, `pbkdf2Sync`) on a request path. Cap CPU-heavy work or move it to a worker. Clear timers, listeners and `AbortController`s you create.

## Testing
- **JS13 The repo's runner, isolated tests.** Use the runner in `package.json` (`node:test`, Vitest, Jest). Use fake timers instead of real waits, inject `fetch` or use a mock server instead of the network, and reset module state between tests (T9, F.I.R.S.T.).

## Security pitfalls
- **JS14 No code from strings; no raw HTML sinks.** No `eval`, `new Function`, or `setTimeout("code")` (Google 5.11.2, S13). Use `textContent` instead of `innerHTML`; let the framework escape, and treat `dangerouslySetInnerHTML`/`v-html` as a sanitizer boundary (S14).
- **JS15 Guard against prototype pollution.** Don't recursively merge untrusted JSON into objects. Validate with a schema; use `Object.create(null)` or `Map` for dictionaries keyed by input and `Object.hasOwn` to check keys (Node.js, CWE-1321).
- **JS16 Lock the supply chain.** Commit the lockfile and install with `npm ci`; consider `--ignore-scripts`; run `npm audit` in CI; check package names for typosquats (Node.js "Supply Chain Attacks", S23). Use `child_process.execFile`/`spawn` with an args array, never `exec` with input.
