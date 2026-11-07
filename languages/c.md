# C

Cite codes **CL1–CL15**, plus the SEI CERT C rule id where one fits (`[CL5, MEM30-C]`). The repo's style (kernel, GNU, project `.clang-format`) and compiler flags win over this file; this file wins over the general catalogs on idiom.

## Card
- Max warnings plus sanitizers (CL1). Small functions, ≤ 3 indent levels (CL3).
- One owner, one free (CL5). `malloc(sizeof *p)`, `calloc` for arrays (CL6).
- Pass the length with every buffer (CL7). No `strcpy`/`sprintf`; check `snprintf` (CL8).
- Check arithmetic on sizes (CL9). Check every library return (CL10). `goto out` cleanup (CL11).
- No `system()` with input, no `printf(input)` (CL14).

## Tooling
- **CL1 Maximum warnings, sanitizers, analyzers.** Build with `-Wall -Wextra -Wpedantic -Wconversion -Wshadow`; treat warnings as errors in CI. Test under `-fsanitize=address,undefined`. Run `clang-tidy` (`cert-*`, `bugprone-*`) or `cppcheck`. Use `-D_FORTIFY_SOURCE=2` and `-fstack-protector-strong` in release builds.

## Naming & structure
- **CL2 Descriptive globals, short locals, no Hungarian notation.** "Descriptive names for global variables are a must"; local names "should be short, and to the point" (kernel §4). Prefix public symbols with the module name (`buf_append`), since C has no namespaces. Make everything else `static`.
- **CL3 Small functions, shallow nesting.** "If you need more than 3 levels of indentation… fix your program" (kernel §1); 5–10 locals at most (kernel §6). Use `const` on pointer parameters you don't modify.
- **CL4 Prefer `static inline` functions to function-like macros.** Wrap multi-statement macros in `do { … } while (0)` and parenthesize every macro argument and expression (kernel §12). Use `enum` for related constants.

## Memory
- **CL5 Each allocation has one owner and one free.** "Do not access freed memory" (MEM30-C); "Free dynamically allocated memory when no longer needed" (MEM31-C); "Only free memory allocated dynamically" (MEM34-C). Set the pointer to `NULL` after `free` when it stays in scope.
- **CL6 Allocate by object, check for overflow.** `p = malloc(sizeof *p)`; use `calloc(n, sizeof *p)` for arrays so the multiplication is overflow-checked (MEM35-C, "Allocate sufficient memory for an object"). Don't cast `malloc`'s result (kernel §14). Check every allocation for `NULL`.
- **CL7 Bounds on every array and pointer.** "Do not form or use out-of-bounds pointers or array subscripts" (ARR30-C). Pass the length with every buffer (`const char *buf, size_t len`). Library calls must not form invalid pointers (ARR38-C).

## Strings
- **CL8 Room for the terminator, never unbounded copies.** "Guarantee that storage for strings has sufficient space for character data and the null terminator" (STR31-C). No `gets`, `strcpy`, `strcat` or `sprintf`; use `snprintf` and check its return for truncation. Don't pass non-terminated arrays to string functions (STR32-C).

## Integers
- **CL9 Check arithmetic on sizes and input.** "Ensure that unsigned integer operations do not wrap" (INT30-C) and "Ensure that operations on signed integers do not result in overflow" (INT32-C); signed overflow is undefined behavior. Use `size_t` for sizes and counts. Use `__builtin_*_overflow` or explicit range checks before multiplying lengths.

## Errors
- **CL10 Detect and handle every library error.** "Detect and handle standard library errors" (ERR33-C): check the return of `malloc`, `fopen`, `read`, `write`, `close` and `snprintf`. Parse numbers with `strtol` plus an `errno` and end-pointer check, never `atoi` (ERR34-C).
- **CL11 One exit path for cleanup.** Use `goto out_free_buf;`-style centralized cleanup when a function acquires several resources; name labels after what they undo (kernel §7). Command-style functions return 0 on success and a negative errno on failure; predicates return `bool` (kernel §16).

## Concurrency
- **CL12 Protect shared state explicitly.** Use `pthread_mutex` or `<stdatomic.h>` atomics, never `volatile`, for synchronization. Use reentrant functions (`strtok_r`, `localtime_r`) in threaded code.

## Testing
- **CL13 Unit tests under sanitizers, fuzz the parsers.** Use the repo's framework (Unity, cmocka, Check, or plain `assert` test binaries). Fuzz every function that parses input with libFuzzer or AFL++ (T5).

## Security pitfalls
- **CL14 No shell and no format-string injection.** Never `system()` or `popen()` with input; use `execve` with an argv array (ENV33-C, S13). Never `printf(user_input)`; use `printf("%s", s)`.
- **CL15 Consider a memory-safe language for new components.** For new parsers and network-facing code, weigh a memory-safe language (S25). When staying in C, keep the unsafe surface small and fuzzed.
