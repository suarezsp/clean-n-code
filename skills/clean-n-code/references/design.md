# Design, architecture, paradigms, dependencies, algorithms

Cite codes **D1–D16** in findings.

**Scope guard:** these rules shape code the task already creates or touches. They never justify new layers, modules, frameworks or rewrites nobody asked for; the task's scope wins. If a design problem needs a bigger change, name it under `Left for later`, don't do it.

Sources are listed in `knowledge.md` → "Fuentes externas". `[secondary]` means only summaries of the source were checked.

## Modules
- **D1 Hide a decision, not a step.** Parnas (CACM 1972): "begin with a list of difficult design decisions or design decisions which are likely to change. Each module is then designed to hide such a decision from the others." A file format, a protocol, a storage engine or a pricing rule each live behind one module. Don't split modules by processing steps ("read", then "parse", then "save") when all of them know the same format.
- **D2 Deep modules.** Ousterhout `[secondary]`: the interface is much simpler than what it hides. Shallow modules, whose interface is as big as their body (pass-through wrappers, one-line classes), add cost without hiding anything. So: no wrapper that only passes calls through.
- **D3 Define errors out of existence.** Ousterhout `[secondary]`: shape the API so that common edge cases are not errors (deleting something already gone succeeds; `get` with a default; an empty result instead of an exception). Never use this to hide a real failure; *Clean Code* chapter 7 and the never-cut rule on data loss still apply.
- **D4 Change amplification test.** A good structure lets one change touch one place. If adding the next variant means editing N parallel spots, the structure is wrong (*Clean Code* cap. 14 p243, G5).

## Architecture
- **D5 Dependencies point inward.** Martin, "The Clean Architecture" (2012): "source code dependencies can only point inwards". Business rules don't import the web framework, the ORM or the UI. Apply this to the files you touch; don't restructure a repo that uses another style.
- **D6 Plain data crosses boundaries.** The same article: "Typically the data that crosses the boundaries is simple data structures". Don't pass ORM rows or framework objects into domain logic.
- **D7 Separate construction from use.** Wire dependencies in `main` or the composition root, not inside business code (*Clean Code* cap. 11 p185). Pass collaborators in; don't reach out to globals.
- **D8 The repo's architecture wins.** Follow the layers and patterns the codebase already uses (see `SKILL.md` → "When rules collide"). Point out a conflict, but don't impose a new architecture.

## State and paradigms
- **D9 Minimize mutable state.** Moseley & Marks, *Out of the Tar Pit* (2006): state and control flow are the main sources of accidental complexity. Prefer values and pure functions. Keep state local and its lifetime short. Make shared state explicit and owned by one place.
- **D10 Functional core, imperative shell.** Bernhardt, "Boundaries" (2012) `[talk/secondary]`: logic with many paths and no I/O lives in pure functions, which are easy to unit test; I/O, time, randomness and the network live in a thin shell with few paths, covered by a few integration tests. This is the general form of *Clean Code*'s "keep threading code separate" (cap. 13).
- **D11 Choose the paradigm by the axis of change.** *Clean Code* cap. 6 p128: objects make it easy to add new types; data and functions make it easy to add new operations. Use the paradigm the language and repo are idiomatic in: free functions in Python, Go or JS modules; classes where the codebase is OO. "Simple" means not intertwined, which is different from familiar (Hickey, "Simple Made Easy", 2011 `[talk/secondary]`).

## Dependencies
Reuse comes first: the codebase, then the standard library or platform, then an already-installed dependency, then the minimum new code. **D12–D13 apply only when that order ends in "add a new dependency".**
- **D12 Inspect before adding.** Cox, "Our Software Dependency Problem" (2019) lists what to check:
  - API design and documentation;
  - code quality (read some of it);
  - tests that exist and pass;
  - the issue tracker (long-open bugs are a red flag);
  - whether it is actively maintained;
  - how widely it is used;
  - its security history, if it handles untrusted input;
  - a license compatible with the project;
  - its transitive dependencies ("Flaws in indirect dependencies are just as bad").
- **D13 Contain it.** Cox: test the features you use; keep the dependency behind your own small interface when it is used widely (*Clean Code* cap. 8, G26); upgrade promptly. For a tiny need, "A little copying is better than a little dependency": copy the few lines and keep the original license notice.

## Algorithms and performance
- **D14 Measure first.** Pike, "Notes on Programming in C", rules 1–2: "You can't tell where a program is going to spend its time… Measure." Knuth (1974) `[secondary]`: "premature optimization is the root of all evil", but don't pass up "that critical 3%". Profile, fix the hotspot, measure again.
- **D15 Simple algorithm, right data structure.** Pike, rules 3–5: "Fancy algorithms are slow when n is small, and n is usually small"; "Data dominates". Choose the structure by how it is accessed: a hash map or set for lookup and membership, an array or list for ordered iteration, a heap for "the next smallest", a deque for a queue. Use the standard library's sort and search. Write a cleverer algorithm only when n is known to be large and the measurement says so.
- **D16 Know the complexity you write.** No O(n²) loop over input that can be large (a membership check against a list inside a loop, string building in a loop, a query per item). When you need a non-obvious algorithm, name it and leave a one-line comment on why (*Clean Code* cap. 4, "Explanation of Intent").
