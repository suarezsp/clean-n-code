# Clean Code smells and heuristics

From Robert C. Martin, *Clean Code* (2009), chapter 17. `[pN]` = PDF page of the source book. Cite the code (for example `G5`) in every finding.

Repo, language and team conventions beat any rule here (G24, "Team Rules" p121). The J rules apply only to Java, and only when the repo's linter or style guide does not say otherwise.

## Comments
- **C1 Inappropriate information** [p317]: change logs, authors, dates or ticket numbers in comments belong in version control or the tracker.
- **C2 Obsolete comment** [p317]: an old, wrong or irrelevant comment. Update it or delete it now.
- **C3 Redundant comment** [p317]: says what the code already says (`i++; // increment i`, a docstring that only repeats the signature).
- **C4 Poorly written comment** [p318]: rambling, obvious or ungrammatical. A comment worth writing is worth writing well.
- **C5 Commented-out code** [p318]: delete it; version control remembers.

## Environment
- **E1 Build requires more than one step** [p318]: building should be one trivial command.
- **E2 Tests require more than one step** [p318]: all tests should run with one command.

## Functions
- **F1 Too many arguments** [p319]: 0 > 1 > 2 > 3. More than three needs very special justification.
- **F2 Output arguments** [p319]: change the state of the owning object, or return the result.
- **F3 Flag arguments** [p319]: a boolean argument means the function does two things. Split it.
- **F4 Dead function** [p319]: a function nobody calls (tests don't count as callers, p312). Delete it.

## General
- **G1 Multiple languages in one source file** [p319]: keep the number and size of embedded languages (HTML, SQL, YAML…) to a minimum.
- **G2 Obvious behavior is unimplemented** [p319]: least surprise. Implement what a caller would reasonably expect (case-insensitive day names, common abbreviations).
- **G3 Incorrect behavior at the boundaries** [p320]: don't trust intuition. Find every boundary and write a test for it.
- **G4 Overridden safeties** [p320]: disabled warnings, skipped or ignored failing tests, safety checks turned off.
- **G5 Duplication** [p320]: the same code, the same switch/if chain on the same conditions, or the same algorithm written differently. Use one function, polymorphism, or template method/strategy. Only merge true duplicates (the same idea with the same reason to change).
- **G6 Code at the wrong level of abstraction** [p321]: implementation details in a base class or high-level module, or high-level concepts in low-level code. You cannot fake your way out of a misplaced abstraction.
- **G7 Base class depends on its derivatives** [p322]: a base class names or constructs its subclasses.
- **G8 Too much information** [p322]: wide interfaces, many public methods or variables, protected fields for subclasses. Hide data, utilities, constants and temporaries.
- **G9 Dead code** [p323]: an impossible `if`, a `catch` that is never reached, unused utilities, `switch` cases that never happen. Delete it.
- **G10 Vertical separation** [p323]: declare a variable just above its first use, and put a private function just below its first caller.
- **G11 Inconsistency** [p323]: similar things should be done the same way, with parallel names (`processVerificationRequest` / `processDeletionRequest`).
- **G12 Clutter** [p324]: empty default constructors, unused variables, functions nobody calls, comments that carry no information.
- **G13 Artificial coupling** [p324]: a general enum, constant or function placed inside a specific class just because it was convenient.
- **G14 Feature envy** [p324]: a method that mostly works on another object's data belongs on that object. Exception: report formatting that would couple a domain object to a presentation format.
- **G15 Selector arguments** [p325]: a boolean, enum or int that selects behavior. Write separate functions instead.
- **G16 Obscured intent** [p326]: dense expressions, Hungarian notation, magic numbers.
- **G17 Misplaced responsibility** [p326]: code that is not where a reader would look for it. Use function names to decide where it belongs.
- **G18 Inappropriate static** [p327]: a static function that might reasonably need to be polymorphic. Follow the language's idiom (free functions are normal in many languages).
- **G19 Use explanatory variables** [p327]: break calculations into well-named intermediate values. It is hard to overdo this.
- **G20 Function names should say what they do** [p328]: `date.add(5)` → is it days? Does it mutate or return a new date? Make the name answer both.
- **G21 Understand the algorithm** [p328]: passing the tests is not enough. Know why the code is correct, and refactor until that is obvious.
- **G22 Make logical dependencies physical** [p329]: don't assume what another module can handle; ask it (`formatter.getMaxPageSize()`).
- **G23 Prefer polymorphism to if/else or switch** [p330]: the ONE SWITCH rule. At most one switch per kind of selection, and it creates polymorphic objects.
- **G24 Follow standard conventions** [p330]: use the team's and the industry's coding standard. The code itself is the example.
- **G25 Replace magic numbers with named constants** [p331]: this covers any token that is not self-describing (`7777`, `"John Doe"`). Obvious constants in self-explanatory formulas (`radius * Math.PI * 2`) are fine.
- **G26 Be precise** [p332]: no floating point for money; check for null when a function can return it; don't assume a query returns only one row; lock when concurrent updates are possible.
- **G27 Structure over convention** [p332]: enforce design with types and abstract methods, not naming conventions.
- **G28 Encapsulate conditionals** [p332]: `if (shouldBeDeleted(timer))` instead of a raw boolean expression.
- **G29 Avoid negative conditionals** [p333]: `if (buffer.shouldCompact())`, not `if (!buffer.shouldNotCompact())`.
- **G30 Functions should do one thing** [p333]: loop, check and act become separate functions.
- **G31 Hidden temporal couplings** [p333]: make call order explicit by passing each result to the next step (a "bucket brigade").
- **G32 Don't be arbitrary** [p334]: every structural choice needs a reason the structure itself shows. If it looks arbitrary, others will change it.
- **G33 Encapsulate boundary conditions** [p335]: one `nextLevel = level + 1`, not scattered `+1`/`-1`.
- **G34 Functions descend only one level of abstraction** [p335]: every statement sits one level below the function's name.
- **G35 Keep configurable data at high levels** [p337]: defaults and config constants live at the top and are passed down.
- **G36 Avoid transitive navigation** [p337]: `a.getB().getC().do()` breaks the Law of Demeter. Ask your direct collaborator.

## Java (apply only if the repo does not decide otherwise)
- **J1 Wildcard imports** [p338]: the book prefers them, but many style guides forbid them (Google Java Style §3.3.1). The repo decides.
- **J2 Don't inherit constants** [p338]: use a static import or a qualified name, not an interface of constants.
- **J3 Constants versus enums** [p339]: use enums (with methods) instead of `static final int` codes.

## Names
- **N1 Choose descriptive names** [p340]: names are about 90% of readability. Re-evaluate them as meanings drift.
- **N2 Names at the appropriate level of abstraction** [p342]: don't leak the implementation (`dial(phoneNumber)` → `connect(locator)`).
- **N3 Use standard nomenclature** [p342]: pattern names, language idioms (`toString`), and the project's ubiquitous language.
- **N4 Unambiguous names** [p343]: `doRename` vs `renamePage`. Make the difference readable from the names.
- **N5 Long names for long scopes** [p343]: `i` is fine in a five-line loop. Wide scopes need long, precise names.
- **N6 Avoid encodings** [p343]: no `m_`, `f`, type prefixes or subsystem prefixes.
- **N7 Names should describe side effects** [p344]: `getOos()` that also creates the stream should be `createOrReturnOos()`.

## Tests
- **T1 Insufficient tests** [p344]: test everything that could possibly break.
- **T2 Use a coverage tool** [p344]: it shows untested branches and catch blocks.
- **T3 Don't skip trivial tests** [p344]: they cost little and document a lot.
- **T4 An ignored test is a question about an ambiguity** [p344]: a skipped or commented test should state the open requirement.
- **T5 Test boundary conditions** [p345].
- **T6 Exhaustively test near bugs** [p345]: bugs cluster.
- **T7 Patterns of failure are revealing** [p345].
- **T8 Test coverage patterns can be revealing** [p345].
- **T9 Tests should be fast** [p345]: a slow test is a test that won't get run.

## Unit-test hygiene (chapter 9, not numbered in the book)
- **F.I.R.S.T.** [p163]: Fast, Independent, Repeatable (no network, locale or clock dependence), Self-validating (pass/fail, no reading logs), Timely.
- One concept per test, with as few asserts per concept as possible [p163]. Build-operate-check structure [p158]. Test code is held to the same cleanliness standard as production code [p155].
