# Setup Guide

## Quick setup

```bash
npx context-bridge setup
```

This auto-configures all your AI CLIs in one step:

- **Claude Code** — creates `.mcp.json` in your project
- **Gemini CLI** — runs `gemini mcp add`
- **Codex CLI** — runs `codex mcp add`

### Configure only one CLI

```bash
npx context-bridge setup --claude
npx context-bridge setup --gemini
npx context-bridge setup --codex
```

## Verify it works

Open your AI CLI and say:

```
"Show memory status"
```

You should see:

```
Project: /path/to/your/project
Memory dir: /path/to/your/project/.ai/memory
Total memories: 0
```

Then try:

```
"Remember this project uses TypeScript"
"Recall everything about TypeScript"
```

## Manual setup

If you prefer to configure manually:

### Claude Code

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "context-bridge": {
      "command": "npx",
      "args": ["-y", "context-bridge"]
    }
  }
}
```

### Gemini CLI

```bash
gemini mcp add context-bridge -- npx -y context-bridge
```

### Codex CLI

```bash
codex mcp add context-bridge -- npx -y context-bridge
```

## Git setup

Memories live in `.ai/memory/` as markdown files.

**Commit them (recommended)** — the whole team shares project context:

```bash
git add .ai/memory/
git commit -m "add project memory"
```

**Keep them local** — add to `.gitignore`:

```
.ai/memory/
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MEMORY_PROJECT_ROOT` | Nearest `.git` directory | Override project root |
| `MEMORY_DIR_PATH` | `.ai/memory` | Override memory directory |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Server not found | Run `npx context-bridge setup` again |
| Wrong project | Set `MEMORY_PROJECT_ROOT` env var |
| No memories found | Run `"Show memory status"` to check the path |
| npx is slow | Install globally: `npm install -g context-bridge` |
