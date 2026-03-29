# context-bridge

[![npm version](https://img.shields.io/npm/v/context-bridge-mcp)](https://www.npmjs.com/package/context-bridge-mcp)
[![CI](https://github.com/Kamlesh-62/context-bridge/actions/workflows/ci.yml/badge.svg)](https://github.com/Kamlesh-62/context-bridge/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

Shared project memory for **Claude Code**, **Codex**, and **Gemini CLI** — powered by [MCP](https://modelcontextprotocol.io).

Save decisions, facts, and context once. Every AI CLI in your project remembers it.

```
AI CLI  -->  MCP Server  -->  .ai/memory/
                                  ├── a1b2.md
                                  ├── c3d4.md
                                  └── ...
```

## Setup

One command:

```bash
npx context-bridge-mcp setup
```

This auto-configures **Claude Code**, **Gemini CLI**, and **Codex CLI**. The server is registered as `<project-name>-context-bridge` (e.g., `my-app-context-bridge`), making it easy to identify across multiple projects.

For Claude Code, it also installs slash commands: `/remember`, `/recall`, `/memory-manage`, `/memory-compact`.

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
| **memory** | List, update, delete, compact | `"List all memories"` |
| **export** | Back up | `"Export all memories"` |
| **import** | Restore | `"Import these memories: <JSON>"` |

### Short IDs

Every memory gets a short 4-character ID like `#a1b2`. Use it for update and delete:

```
"Delete memory #a1b2"
"Update memory #a1b2 — change title to Use PostgreSQL v16"
```

You can also delete by title:

```
"Delete memory titled Use PostgreSQL"
```

### Compact

Memories start as individual files in `.ai/memory/`. When you have many, compact them into a single file:

| CLI | How to compact |
|-----|---------------|
| **Claude Code** | `/memory-compact` or `"Compact memories"` |
| **Codex** | `"Compact memories"` or `"Use memory tool with action compact"` |
| **Gemini** | `"Compact memories"` or `"Use memory tool with action compact"` |

Auto-compact triggers at 20+ files. After compacting, all memories live in `.ai/memory.md`.

### Slash Commands (Claude Code)

Setup installs these slash commands for Claude Code:

| Command | What it does |
|---------|-------------|
| `/remember` | Save a memory |
| `/recall` | Search memories |
| `/memory-manage` | List, update, or delete memories |
| `/memory-compact` | Compact files into `.ai/memory.md` |

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
id: a1b2
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

### Compact mode

When you run compact (manually or auto at 20+ files), all memories merge into a single `.ai/memory.md` file. New memories are then appended to that file. Both formats are read seamlessly.

### Should you commit memories?

**Yes.** Commit them to git so the whole team shares the same project memory.

```bash
git add .ai/
git commit -m "add project memory"
```

Keep them local instead — add to `.gitignore`:

```
.ai/memory/
.ai/memory.md
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
