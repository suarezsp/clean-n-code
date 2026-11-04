---
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
---

/clean-n-code:clean-review the file `users.py`. It is not on disk, so here is its full content:

```python
def f(db, n, x=False):
    # get user
    q = "SELECT * FROM users WHERE name = '" + n + "'"
    r = db.execute(q).fetchall()
    if x:
        return r[0]
    return r
```
