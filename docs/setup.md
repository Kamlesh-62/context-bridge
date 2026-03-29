# Setup Guide

## Quick setup

```bash
npx context-bridge-mcp setup
```

This auto-configures all your AI CLIs in one step:

- **Claude Code** — creates `.mcp.json` in your project
- **Gemini CLI** — runs `gemini mcp add`
- **Codex CLI** — runs `codex mcp add`

The server is registered as `<project-name>-context-bridge` (e.g., `my-app-context-bridge`), so you can easily identify it when working with multiple projects.

### Configure only one CLI

```bash
npx context-bridge-mcp setup --claude
npx context-bridge-mcp setup --gemini
npx context-bridge-mcp setup --codex
```

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
| Server not found | Run `npx context-bridge-mcp setup` again |
| Wrong project | Set `MEMORY_PROJECT_ROOT` env var |
| No memories found | Run `"Show memory status"` to check the path |
| npx is slow | Install globally: `npm install -g context-bridge` |
