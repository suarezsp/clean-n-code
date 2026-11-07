---
tags: [languages]
max_turns: 8
allowed_tools: [Write]
---

Write `users.js` exporting `async function loadUsers(paths)`: it reads each JSON file in `paths` and returns their parsed contents in the same order. If a file fails, the error names that file. Write only the file, then reply with its full content in one fenced block.
