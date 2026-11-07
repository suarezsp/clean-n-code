---
name: clean-secure
description: >
  Security review of a change or repo: secrets, access control, injection, limits, crypto. Report only. Use for "security review", "is this secure", "check for leaked keys", "OWASP check", /clean-secure.
---

Review like an attacker who has the source code and wants one thing: a path from input they control to data or actions they should not reach. Readability is out of scope here; `/clean-review` covers it.

## 1. Understand first

- Review what the user names: uncommitted or staged changes, a branch, a PR, files, or the whole repo. If nothing is named, review the uncommitted changes, or the last commit if there are none.
- Read `../clean-n-code/references/security.md` (relative to this skill's base directory).
- Read the "Security pitfalls" section of the language guide in `../../languages/` for each language in scope (for example PY15–PY16, JS14–JS16, CL14); cite those codes next to the S code.
- Map the trust boundaries the code touches:
  - **Sources:** where outside data enters (HTTP params, bodies, headers, cookies, files, uploads, env, queues, webhooks, third-party API responses).
  - **Sinks:** where it can do harm (SQL, shell, `eval`, HTML templates, file paths, deserializers, outbound fetches, redirects, logs).
  - **Guards:** the auth middleware, ORM, validation layer and template auto-escaping already in place. A guard that already covers a path means no finding.
- Grep the whole repo (not only the diff) for secret-shaped strings: `AKIA`, `ghp_`, `github_pat_`, `sk-`, `xox`, `AIza`, `BEGIN .*PRIVATE KEY`, `password\s*=`, `api[_-]?key\s*=`. Check `.gitignore` for `.env`. If git history is in scope, `git log -p -S <prefix>` finds keys that were "deleted".

## 2. Look for (in this order)

1. **Secrets:** a key, password or token in code, committed config, Dockerfiles, logs or errors (S7); loaded in a way that blocks rotation (S8, S9); one key shared across environments or with admin scope (S9, S1); passwords or issued API keys stored reversibly or compared with `==` (S11).
2. **Access control:** an endpoint without authentication (S18); an object loaded by id without checking the caller owns it (S3, S18; CWE-639); fields writable through mass assignment (S18); an admin action checked only in the UI (S18); allow-by-default logic (S2).
3. **Injection and sinks:** a query, command or code string built from input (S13); output not encoded for its context (S14); user paths, uploads or URLs not confined (S15); untrusted data deserialized into objects (S16); state changed without CSRF protection (S17); missing validation at the boundary (S12).
4. **Resources:** no timeout, size limit, pagination or rate limit on something an attacker can call in a loop (S19).
5. **Crypto:** home-made crypto, weak hashes, `Math.random` for tokens, TLS verification disabled (S20).
6. **Failure and logs:** an exception path that ends up allowing the request, stack traces sent to clients (S21); secrets or personal data in logs, or security events not logged at all (S22).
7. **Supply chain:** a missing lockfile, unpinned versions, a known-vulnerable package, third-party responses trusted blindly (S23, S24). Run the ecosystem's audit command if it works offline or is already set up; otherwise say it was not run.
8. **Memory (C/C++ and unsafe blocks only):** unchecked copies, `strcpy`/`sprintf`/`gets`, manual lifetimes (S25).

## 3. Check before you report

- Every finding needs a concrete attack: "an attacker sends X to Y and gets Z". No attack path, no finding. Theoretical weaknesses behind an existing guard are not findings.
- Re-read the code path end to end, from source to sink, and confirm no guard sits in between (middleware, ORM parameters, auto-escape, a validation schema).
- A secret that looks like a placeholder (`changeme`, `xxx`, `<your-key>`, an `.example` file) is not a finding. A real-looking one is, even in tests.
- Propose the smallest fix that closes the path: parameterize, add the ownership condition to the query, move the key to the secret store, add the limit. Don't propose a new framework or a rewrite.
- For a committed secret, the fix is always: revoke, rotate, then clean up (S10). Deleting the line is not a fix.

## 4. Output

Use short sentences and everyday words. Start with `What this code does:` in two sentences, then `Trust boundaries:` in one line (sources → sinks).

Then list findings under **Must fix** (exploitable now: leaked secret, missing authorization, injection) and **Should fix** (needs a precondition, or is defense in depth). Skip empty groups. Number findings across groups. Each finding:

1. **Any logged-in user can read any invoice** (`api/invoices.py:L14-20`) `[S18, S3, CWE-639]`
   - **What this is:** `GET /invoices/<id>` loads the invoice by id only.
   - **Attack:** A user changes `/invoices/41` to `/invoices/42` and gets another customer's invoice.
   - **Fix:** Query by `id` and `owner_id = current_user.id`; return 404 when nothing matches.
   - **If we skip it:** Every invoice in the database can be read by walking the ids.

End with:
- `Verdict: No exploitable findings.` or `Verdict: fix 1 and 2 before merging.`
- `Not checked:` one line for what mattered but could not be checked (git history, runtime config, the dependency audit, infrastructure).

If nothing is found: `What this code does:`, `Trust boundaries:`, then `No findings against S1–S25.` and one line on what you checked.

Lists findings, changes no code. To fix them, ask for the fixes explicitly.
