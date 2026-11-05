---
tags: [graded]
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
---

/clean-n-code:clean-secure the file `invoices.py`. It is not on disk, so here is its full content. `login_required` sets `g.user` from a signed session cookie and returns 401 without one; `conn` is a sqlite3 connection.

```python
import os

import requests
from flask import Flask, abort, g, jsonify
from auth import login_required
from db import conn

app = Flask(__name__)
PAYMENTS_API_KEY = os.environ["PAYMENTS_API_KEY"]


@app.get("/invoices/<int:invoice_id>")
@login_required
def get_invoice(invoice_id):
    row = conn.execute(
        "SELECT id, amount_cents, payment_id FROM invoices WHERE id = ? AND owner_id = ?",
        (invoice_id, g.user.id),
    ).fetchone()
    if row is None:
        abort(404)
    status = requests.get(
        f"https://payments.example.com/v1/status/{row['payment_id']}",
        headers={"Authorization": f"Bearer {PAYMENTS_API_KEY}"},
        timeout=5,
    ).json()
    return jsonify(invoice=dict(row), payment=status)
```
