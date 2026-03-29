---
name: memory-manage
description: List, update, or delete shared project memories in .ai/memory/
argument-hint: "list|status|delete #id|update #id"
---

Use the `memory` MCP tool to manage shared project memories.

Parse the user's input after `/memory-manage`:
- No argument or "list" -> action: "list"
- "status" -> action: "status"
- "delete #xxxx" or "delete Some Title" -> action: "delete" with id or title
- "update #xxxx" followed by changes -> action: "update"

Show results clearly. For list, show each memory as: #id  type  **title**  [tags]
