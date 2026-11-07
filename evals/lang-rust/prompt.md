---
tags: [languages]
max_turns: 8
allowed_tools: [Write]
---

Write `ports.rs` with `pub fn load_ports(path: &Path) -> Result<Vec<u16>, PortsError>`: it reads one port per line, skips blank lines and fails on a bad line, saying which line. Use only the standard library. Write only the file, then reply with its full content in one fenced block.
