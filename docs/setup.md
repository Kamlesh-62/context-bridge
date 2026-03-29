# Setup Guide

## Quick setup

```bash
npx context-bridge-mcp setup
```

This auto-configures all your AI CLIs in one step:

- **Claude Code** — creates `.mcp.json` + installs slash commands
- **Gemini CLI** — runs `gemini mcp add`
- **Codex CLI** — runs `codex mcp add`

The server is registered as `<project-name>-context-bridge` (e.g., `my-app-context-bridge`), so you can easily identify it when working with multiple projects.

### Configure only one CLI

```bash
npx context-bridge-mcp setup --claude
npx context-bridge-mcp setup --gemini
npx context-bridge-mcp setup --codex
```

## Updating

To get the latest version, re-run setup with `@latest`:

```bash
npx context-bridge-mcp@latest setup
```

Running setup again is safe — it overwrites existing config, never duplicates.

## Verify it works

Open your AI CLI and say:

```
"Show memory status"
```

You should see:

```
Project: /path/to/your/project
Server:  my-app-context-bridge
Memory dir: /path/to/your/project/.ai/memory
Total memories: 0
```

Then try:

```
"Remember this project uses TypeScript"
"Recall everything about TypeScript"
```

## Using across CLIs

Memories are shared. Save in one CLI, access from any:

| Action | Claude Code | Codex | Gemini |
|--------|-------------|-------|--------|
| Save | `/remember use PostgreSQL` | `"Remember we use PostgreSQL"` | `"Remember we use PostgreSQL"` |
| Search | `/recall database` | `"Recall database"` | `"Recall database"` |
| List | `/memory-manage list` | `"List all memories"` | `"List all memories"` |
| Delete | `/memory-manage delete #a1b2` | `"Delete memory #a1b2"` | `"Delete memory #a1b2"` |
| Compact | `/memory-compact` | `"Compact memories"` | `"Compact memories"` |
| Status | `/memory-manage status` | `"Show memory status"` | `"Show memory status"` |

### Short IDs

Every memory gets a 4-character ID like `#a1b2`. Use it for update and delete:

```
"Delete memory #a1b2"
"Update memory #a1b2 — change title to Use PostgreSQL v16"
```

You can also delete by title:

```
"Delete memory titled Use PostgreSQL"
```

### Compact

Individual memory files auto-compact into `.ai/memory.md` at 20+ files. You can also compact manually:

```
"Compact memories"
```

After compacting, new memories append to the single file.

## Slash commands (Claude Code only)

Setup installs these in `.claude/skills/`:

| Command | What it does |
|---------|-------------|
| `/remember <text>` | Save a memory |
| `/recall <query>` | Search memories |
| `/memory-manage` | List, update, or delete |
| `/memory-compact` | Merge into single file |

## Manual setup

If you prefer to configure manually:

Replace `<project>` below with your project name (e.g., `my-app`).

### Claude Code

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "<project>-context-bridge": {
      "command": "npx",
      "args": ["-y", "context-bridge-mcp"]
    }
  }
}
```

### Gemini CLI

```bash
gemini mcp add <project>-context-bridge npx -- -y context-bridge-mcp
```

### Codex CLI

```bash
codex mcp add <project>-context-bridge -- npx -y context-bridge-mcp
```

## Git setup

Memories live in `.ai/memory/` as individual files, or `.ai/memory.md` after compacting.

**Commit them (recommended)** — the whole team shares project context:

```bash
git add .ai/
git commit -m "add project memory"
```

**Keep them local** — add to `.gitignore`:

```
.ai/memory/
.ai/memory.md
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MEMORY_PROJECT_ROOT` | Nearest `.git` directory | Override project root |
| `MEMORY_DIR_PATH` | `.ai/memory` | Override memory directory |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Server not found | Run `npx context-bridge-mcp setup` again |
| Wrong project | Set `MEMORY_PROJECT_ROOT` env var |
| No memories found | Run `"Show memory status"` to check the path |
| npx is slow | Install globally: `npm install -g context-bridge-mcp` |
| Claude uses built-in memory | Say `"Use context-bridge to remember..."` explicitly |
| Ran setup twice | No problem — setup overwrites, never duplicates |
