# context-bridge

[![npm version](https://img.shields.io/npm/v/context-bridge-mcp)](https://www.npmjs.com/package/context-bridge-mcp)
[![CI](https://github.com/Kamlesh-62/context-bridge/actions/workflows/ci.yml/badge.svg)](https://github.com/Kamlesh-62/context-bridge/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

Shared project memory for **Claude Code**, **Codex**, and **Gemini CLI** — powered by [MCP](https://modelcontextprotocol.io).

Save decisions, facts, and context once. Every AI CLI in your project remembers it.

```
AI CLI  -->  MCP Server  -->  .ai/memory/
                                  ├── a1b2c3d4-use-postgres.md
                                  ├── e5f6g7h8-api-port-3000.md
                                  └── ...
```

## Setup

One command:

```bash
npx context-bridge-mcp setup
```

This auto-configures **Claude Code**, **Gemini CLI**, and **Codex CLI**. The server is registered as `<project-name>-context-bridge` (e.g., `my-app-context-bridge`), making it easy to identify across multiple projects.

Or pick one:

```bash
npx context-bridge-mcp setup --claude
npx context-bridge-mcp setup --gemini
npx context-bridge-mcp setup --codex
```

Bootstrap your first memory:

```bash
npx context-bridge-mcp init
```

Then open your AI CLI and try:

```
"Show memory status"
"Remember this project uses TypeScript"
```

That's it.

## Tools

5 tools. Just tell your AI CLI what to do:

| Tool | What it does | Example |
|------|-------------|---------|
| **remember** | Save something | `"Remember that we use PostgreSQL for the database"` |
| **recall** | Find something | `"Recall everything about the database"` |
| **memory** | List, update, delete | `"List all memories"` |
| **export** | Back up | `"Export all memories"` |
| **import** | Restore | `"Import these memories: <JSON>"` |

More examples in the [examples/](examples/) folder.

## Why This Over Alternatives?

| Feature | context-bridge | memory-keeper | server-memory | sharedcontext |
|---------|-------------------|---------------|---------------|---------------|
| Multi-CLI support | Claude, Codex, Gemini | Claude only | Claude only | Claude, Cursor |
| Storage format | Markdown files | JSON | Knowledge graph | SQLite |
| Git-friendly | Yes (one file per memory) | No | No | No |
| Human-editable | Yes (any text editor) | No | No | No |
| Setup | `npx setup` (1 command) | Manual config | Manual config | Manual config |
| Runtime deps | 2 (MCP SDK + Zod) | Many | 2 | Many |
| Project-scoped | Yes (`.ai/memory/`) | Global (`~/`) | Global | Global |

## Memory Types

| Type | Use for |
|------|---------|
| `note` | General notes (default) |
| `decision` | Choices made and why |
| `fact` | Things that are true about the project |
| `constraint` | Limits and requirements |
| `todo` | Things to do later |
| `architecture` | System design and patterns |
| `glossary` | Term definitions |

## How It Works

Memories are stored as **markdown files** in `.ai/memory/` inside your project:

```markdown
---
type: decision
title: Use PostgreSQL for database
tags: [database, backend]
created: 2024-01-15T10:30:00Z
updated: 2024-01-15T10:30:00Z
source: claude
---

We chose PostgreSQL over MongoDB because our data is highly relational
and we need ACID transactions for the payment flow.
```

**Why markdown?**
- Human-readable — edit memories with any text editor
- Git-friendly — clean diffs, one file per memory
- No lock files — each memory is independent
- No special tools needed — it's just files

### Should you commit `.ai/memory/`?

**Yes.** Commit it to git so the whole team shares the same project memory. Add this to your `.gitignore` if you want to keep it local instead:

```
.ai/memory/
```

### MCP Resources

Memories are also exposed as MCP resources, so CLIs can auto-discover and load your project context at session start.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MEMORY_PROJECT_ROOT` | Override project root detection |
| `MEMORY_DIR_PATH` | Override memory directory path |

## CLI Commands

```bash
context-bridge           # Start the MCP server (default)
context-bridge setup     # Auto-configure your AI CLIs
context-bridge init      # Create .ai/memory/ with a starter memory
context-bridge --help    # Show help
context-bridge --version # Show version
```

## Development

```bash
git clone https://github.com/Kamlesh-62/context-bridge.git
cd context-bridge
npm install
npm run build
npm test
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
