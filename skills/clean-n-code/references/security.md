# Security baseline: principles, secrets, input, access, failure, supply chain

Cite codes **S1–S25** in findings, together with the CWE id when one fits (`[S13, CWE-89]`).

**Scope guard:** these rules apply to code the task already creates or touches, and to anything on a trust boundary it crosses. They are never cut to keep a diff small, and they never justify a rewrite nobody asked for. A bigger hardening job goes under `Left for later`.

## Principles (Saltzer & Schroeder, 1975)
- **S1 Least privilege.** "Every program and every user of the system should operate using the least set of privileges necessary to complete the job." DB users without DDL, tokens with the narrowest scope, processes not running as root.
- **S2 Fail-safe defaults.** "Base access decisions on permission rather than exclusion." Deny by default: an allowlist, not a blocklist; a new route is private until someone makes it public.
- **S3 Complete mediation.** "Every access to every object must be checked for authority." Check on every request, not once at login, and not only in the UI (OWASP A01:2025).
- **S4 Economy of mechanism.** "Keep the design as simple and small as possible." Fewer endpoints, flags and code paths mean less attack surface; remove debug routes and unused features.
- **S5 Open design.** "The design should not be secret." Security rests on keys, never on hidden URLs, obscured IDs or a custom encoding.
- **S6 Psychological acceptability.** The secure path must be the easy one, or people route around it: safe defaults, one obvious way to call the API.

## Secrets and API keys (OWASP Secrets Management Cheat Sheet)
- **S7 No secret in code or artifacts.** No key, password, token, connection string or private key in source, committed config, Docker `ENV`/`ARG` (§5.1), logs ("Never be logged", §8.3), URLs, error messages or pipeline output (§3.1). CWE-798, CWE-532, CWE-200 (#20).
- **S8 Load secrets at runtime.** Read them from a secret manager or an orchestrator-mounted file. Environment variables are "not recommended unless the other methods are not possible" (§5.1); when used, read them once at the edge and pass the value down (D7). Commit a `.env.example` with names only and gitignore `.env`.
- **S9 Scope, expire, rotate.** One key per service and per environment, with "the minimum privileges assigned" (§2.7.1). Prefer short-lived or dynamic credentials (§2.4). Code must survive rotation: accept two valid keys during the switch, and never cache a secret forever (§2.7.2).
- **S10 A leaked secret is revoked, not deleted.** Deleting the commit does not help: it lives in history, forks and caches. Order: revoke immediately, rotate (automated if possible), then remove the exposed copy and record who is alerted (§9).
- **S11 Store credentials you receive with one-way, slow hashing.** Passwords (NIST 800-63B-4): at least 15 characters as a single factor (8 with MFA), accept at least 64, SHALL NOT impose composition rules or periodic changes, check against a blocklist of compromised passwords, salt (≥ 32 bits) and hash with a password-hashing scheme at a cost "as high as practical". API keys you issue: generate with a CSPRNG (S20), show once, store a hash, add a recognisable prefix so leaks can be scanned, and compare in constant time (CWE-208).

## Input and output (CWE Top 25, 2025)
- **S12 Validate at every trust boundary.** Everything from outside the process is untrusted: HTTP, files, headers, env, queues, other services. Validate type, length, range and format against an allowlist, on the server (CWE-20, #18; ASVS V2).
- **S13 Never build code from strings.** Parameterized queries, argv arrays instead of a shell, no `eval`/`exec` on input, template engines with auto-escape. SQL injection CWE-89 (#2), OS command CWE-78 (#9), command CWE-77 (#23), code injection CWE-94 (#10); OWASP A05:2025.
- **S14 Encode output for its context.** HTML body, attribute, JS, URL and CSS each need their own encoding; prefer the framework's auto-escaping and never mark input as safe. XSS CWE-79 (#1); ASVS V1.
- **S15 Confine paths, uploads and outbound URLs.** Canonicalize a path and check it stays under the allowed root (CWE-22, #6). Check uploads by type and size, rename them, and store them outside the web root (CWE-434, #12). Server-side fetches of a user URL go through an allowlist of hosts, blocking internal ranges (SSRF CWE-918, #22; API7).
- **S16 Don't deserialize untrusted data into objects.** No `pickle`, Java native serialization, YAML full loaders or `unserialize` on input; parse a data format (JSON) into plain structures and validate it (CWE-502, #15).
- **S17 Protect state-changing requests from forgery.** Cookie-authenticated `POST/PUT/DELETE` need an anti-CSRF token or `SameSite` cookies; `GET` never changes state (CWE-352, #3).

## Access control for APIs (OWASP API Security Top 10:2023)
- **S18 Authenticate every non-public endpoint and authorize per object, property and function.** Load the object by its id **and** the caller's ownership, not by the id alone (BOLA, API1; CWE-639, #24). Filter the fields a caller may read or write; no mass assignment (API3). Admin functions check the role on the server (API5). CWE-306 (#21), CWE-862 (#4), CWE-863 (#17).
- **S19 Bound every resource.** Timeouts on outbound calls, limits on body size, page size, upload size and query cost, and rate limits on login, signup and expensive or paid operations (CWE-770, #25; API4, API6).

## Cryptography
- **S20 Use vetted crypto, never your own.** The platform's crypto library with its defaults, TLS for every network hop, a CSPRNG for tokens, ids and keys (`secrets`, `crypto.randomBytes`, never `Math.random`). No MD5/SHA-1 for security, no ECB, no hardcoded IVs (OWASP A04:2025).

## Failure and logging
- **S21 Fail closed.** When an authorization check, a parser or a dependency fails, deny the request; an exception must never fall through to "allowed". Clients get a generic error and a correlation id; stack traces and internals go to the log (OWASP A10:2025; CWE-209, CWE-200).
- **S22 Log security events, not secrets.** Record logins, failures, permission denials and admin actions with who, what and when, so an attack can be detected and traced (OWASP A09:2025). Mask secrets, tokens and personal data (S7). Neutralize newlines in logged input.

## Supply chain
- **S23 Pin, lock and scan dependencies.** Commit the lockfile, pin versions, install from the lockfile in CI, run the ecosystem's audit (`npm audit`, `pip-audit`, `cargo audit`, `govulncheck`) and remove what you don't use. Before adding one, run the D12 checks. Prefer reusing well-secured software over writing your own (OWASP A03:2025; SSDF PW.4).
- **S24 Data from third-party APIs is untrusted input.** Validate it like user input (S12), enforce TLS and timeouts (S19), and don't follow redirects blindly (API10).

## Memory
- **S25 Memory-safe by default.** New components use a memory-safe language when the project allows it. In C/C++, use bounds-checked APIs, never `strcpy`/`sprintf`/`gets`, and build with sanitizers in tests. Out-of-bounds write CWE-787 (#5), use after free CWE-416 (#7), out-of-bounds read CWE-125 (#8), buffer overflow CWE-120 (#11).
