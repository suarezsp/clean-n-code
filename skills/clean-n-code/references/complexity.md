# Control-flow complexity

Cite codes **K1–K8** in findings. Apply them only to code the task already creates or touches. Ponytail's scope rules still decide what gets written.

Sources:
- NIST SP 500-235, *Structured Testing* (Watson & McCabe, 1996), §2.5.
- SonarSource, *Cognitive Complexity* white paper (G. Ann Campbell, 2023 edition).
- Fowler, refactoring.com catalog.
- Martin, *Clean Code* chapter 3, p66.

## The two metrics
- **Cyclomatic complexity (CC)** counts decision points plus one: every `if`, `else if`, loop, `case`, `catch`, `&&`, `||` and `?:` adds one. CC equals the number of basis-path tests needed to cover the function (NIST §5). Use it to answer "how many tests does this need?".
- **Cognitive complexity** measures how hard the code is for a human to follow (Campbell). It has three rules:
  1. Ignore shorthand that reads as one statement (null-coalescing, a simple method call).
  2. Add +1 for each break in linear flow: `if`, `else if`, `else`, ternary, `switch`, loops, `catch`, labelled break/continue, each run of the same boolean operator, and recursion.
  3. Add a further +1 for each level of nesting on `if`, ternary, `switch`, loops and `catch`.
- Why both matter: a flat 4-case `switch` and a doubly nested loop with a labelled `continue` both have CC 4. Their cognitive complexity is 1 versus 7 (Campbell's `getWords` vs `sumOfPrimes`). **Nesting is what humans struggle with.**

## Codes
- **K1 Function CC over 10.** NIST: "The original limit of 10 as proposed by McCabe has significant supporting evidence, but limits as high as 15 have been used successfully". Going above 10 is reserved for teams with "experienced staff, formal design… and a comprehensive test plan". Treat 11–15 as needing a stated reason, and anything over 15 as a finding.
- **K2 Nesting deeper than 2.** *Clean Code* p66 says a function's indent level "should not be greater than one or two". Deep nesting is the main driver of cognitive complexity.
- **K3 Arrow code: the happy path is buried inside nested `if`s.** Fix: *Replace Nested Conditional with Guard Clauses*. Handle the exceptional cases first and return early.
- **K4 Long or compound conditions.** Fix: *Decompose Conditional* (name the condition, which is G28), or *Consolidate Conditional Expression* when several branches give the same result.
- **K5 The same type switch repeated across functions, or a type-code ladder whose branches carry real logic.** Fix: *Replace Conditional with Polymorphism* (G23, the ONE SWITCH rule). If the branches only map a value to another value, use a lookup table or dict; no polymorphism is needed. A **single** flat value mapping (one line per case, written once) is not a finding, whether it is a ladder or a table.
- **K6 Special-case checks scattered around** (`if x is None` and the like in many places). Fix: *Introduce Special Case* (Null Object or empty collection, as in *Clean Code* chapter 7).
- **K7 Flag-driven control flow.** Fixes: *Remove Flag Argument* (F3), *Replace Control Flag with Break*. A loop that does two jobs: *Split Loop*, or *Replace Loop with Pipeline* (map, filter, comprehension) when the language idiom favours it.
- **K8 Gaming the metric.** Never lower a number without lowering the real difficulty. NIST warns against "modified" metrics that, for example, divide by switch branches, and against splitting a function into helpers that only make sense together. Extract only when the new function has a name that is not a restatement of its body (G34, *Clean Code* p67).

## When a high CC is fine
- A flat `switch` or dispatch table where each case is one simple line. McCabe exempted these; cognitive complexity stays at 1. Prefer a table if the language has one.
- Generated code, parsers produced by a grammar tool, and state machines that mirror a spec. Say so in the finding instead of flagging the code.

## Measure; don't guess
Use the first tool that is available. **Never add a dependency to the project just to measure.**
1. **The repo's own linter rule**, if configured:
   - Python: ruff `C901` (`ruff check --select C901`, mccabe) or flake8 `--max-complexity`.
   - JS/TS: eslint's `complexity` rule, or `sonarjs/cognitive-complexity` if installed.
   - Go: `gocyclo -over 10` and `gocognit -over 15`.
   - Java: Checkstyle `CyclomaticComplexity`, or PMD.
2. **A run-once tool**, without installing it into the project: `uvx lizard -C 10 -w <files>` covers many languages (CCN and length). This needs network access and the user's permission to run downloaded code. If it is not available, say so.
3. **Count by hand** with the rules above, and state that the numbers are manual estimates.

Report numbers per function: `name  CC=12  nesting=4  (cognitive ≈ 18)`. When you refactor, measure before and after **with the same tool**.
