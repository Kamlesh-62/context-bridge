---
name: remember
description: Save a memory to shared project memory (.ai/memory/) accessible by all AI CLIs
argument-hint: <what to remember>
---

Use the `remember` MCP tool to save the user's input to shared project memory.

If the user provided text after `/remember`, use that as the title. Otherwise ask what they want to remember.

Pick the best type (note, decision, fact, constraint, todo, architecture, glossary) and add relevant tags automatically. Do not ask the user to choose — just save it.
