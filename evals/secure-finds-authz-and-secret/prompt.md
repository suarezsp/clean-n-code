---
tags: [graded]
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
---

/clean-n-code:clean-secure the file `invoices.py`. It is not on disk, so here is its full content. `login_required` sets `g.user` from the session cookie.

```python
import requests
from flask import Flask, g, jsonify
from auth import login_required
from db import conn

app = Flask(__name__)
PAYMENTS_API_KEY = "pk_9f2c7e1a4b8d6e3f0a5c2b7d9e1f4a6c"

@app.get("/invoices/<invoice_id>")
@login_required
def get_invoice(invoice_id):
    row = conn.execute("SELECT * FROM invoices WHERE id = " + invoice_id).fetchone()
    status = requests.get(
        "https://payments.example.com/v1/status/" + str(row["payment_id"]),
        headers={"Authorization": "Bearer " + PAYMENTS_API_KEY},
    ).json()
    return jsonify(invoice=dict(row), payment=status)
```
