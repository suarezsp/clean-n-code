---
type: llm
weight: 2
---

Read the code. PASS only if all hold: passwords use a slow salted hash (scrypt, PBKDF2, bcrypt or argon2), never a plain digest; session tokens come from `secrets` or `os.urandom`; every query is parameterized; `read_note` checks that the note belongs to the token's user; a failed login gives the same error whether or not the email exists. Otherwise FAIL, naming the rule that breaks.
