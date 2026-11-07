---
tags: [languages]
max_turns: 8
allowed_tools: [Write]
---

Write `backup.sh`: `backup.sh <dir> <dest-dir>` makes a `.tar.gz` of `<dir>` in `<dest-dir>` named with the date, building it in a temporary file first so a failed run leaves no partial archive. Paths can contain spaces or start with a dash. Write only the file, then reply with its full content in one fenced block.
