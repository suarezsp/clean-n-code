---
tags: [languages]
max_turns: 8
allowed_tools: [Write]
---

Write `ConfigLoader.java` with `public static Map<String, String> load(Path file)`: it reads `key=value` lines, skips blank lines and lines starting with `#`, and fails on any other line, saying which one. Write only the file, then reply with its full content in one fenced block.
