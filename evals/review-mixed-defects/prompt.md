---
tags: [graded]
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
---

/clean-n-code:clean-review the file `users.ts`. It is not on disk, so here is its full content:

```typescript
import { db } from "./db";
import { audit } from "./audit";

export async function getUser(id: any) {
  const user = await db.users.findById(id);
  user.lastSeenAt = new Date();
  await db.users.save(user);
  audit.log("user_read", id);
  return user;
}
```

`audit.log` returns a Promise.
