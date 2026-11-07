---
tags: [graded]
timeout_seconds: 900
max_turns: 15
allowed_tools: [Read, Glob, Grep, Write, Edit, Skill]
---

/clean-n-code:clean-refactor the file `pay.py`. It is not on disk yet, so first write it exactly as below, then refactor it. You cannot run commands here, so you cannot run tests; say so instead of claiming they passed. End by printing the full content of each file you wrote, one fenced block per file.

```python
def calc(e, h, f):
    if e != None:
        if e["type"] == "hourly":
            if h > 40:
                p = 40 * e["rate"] + (h - 40) * e["rate"] * 1.5
            else:
                p = h * e["rate"]
            if f == True:
                p = p - p * 0.2
            return p
        else:
            if e["type"] == "salaried":
                p = e["salary"] / 12
                if f == True:
                    p = p - p * 0.2
                return p
            else:
                return 0
    else:
        return 0
```
