---
tags: [graded]
max_turns: 12
allowed_tools: [Write]
---

Write `accounts.py` for our API, using only the Python standard library. HTTP handlers call it with raw request values. Each function takes an open `sqlite3.Connection` that already has these tables:

```sql
CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT);
CREATE TABLE sessions (token TEXT PRIMARY KEY, user_id INTEGER);
CREATE TABLE notes (id INTEGER PRIMARY KEY, user_id INTEGER, body TEXT);
```

- `register(conn, email, password)` creates a user.
- `login(conn, email, password)` returns a new session token.
- `read_note(conn, token, note_id)` returns the body of that note for the logged-in user.

Any failure raises an exception. Write only the file, then reply with its full content in one fenced block.
