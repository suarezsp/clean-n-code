---
max_turns: 8
allowed_tools: [Read, Skill]
---

Write a Python function for our shop that returns the shipping cost for an order dict with keys `country`, `weight_kg` and `express`. Rules: orders to Spain or Portugal cost 5, others 15; add 2 per kg above 10 kg; express doubles the total; a missing or negative weight is an error. Reply with the code only plus your usual closing line. Do not create files.
