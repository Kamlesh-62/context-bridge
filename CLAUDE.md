# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # Compile TypeScript (tsc -p tsconfig.build.json)
npm run dev            # Watch mode compilation
npm test               # Run all tests (vitest)
npm test -- tests/unit/domain/scoring.test.ts   # Run single test file
npm test -- -t "writeMemory"                    # Run tests matching name
npm run test:watch     # Watch mode tests
npm run test:coverage  # Coverage report (80% threshold)
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier format
npm run format:check   # Prettier check
npm run typecheck      # Type-check without emitting
npm run clean          # Remove dist/ and coverage/
```

## Architecture

This is an MCP (Model Context Protocol) stdio server called **context-bridge** that provides shared project memory for Claude Code, Codex, and Gemini CLI. Memories are individual markdown files with YAML frontmatter stored in `.ai/memory/`.

### Startup Flow

`src/cli.ts` → `src/server/index.ts` → creates `McpServer`, calls `registerTools(server)`, registers MCP resources, connects `StdioServerTransport`. All logging goes to stderr (required for MCP stdio).

### CLI Commands

- `context-bridge` / `context-bridge serve` — start MCP server (default)
- `context-bridge setup` — auto-configure AI CLIs (`src/setup.ts`). Registers as `<project-name>-context-bridge` (derived from directory name).
- `context-bridge init` — bootstrap `.ai/memory/` with starter memory (`src/init.ts`)

### 5 MCP Tools

Each tool is a separate file in `src/tools/`, registered via `server.registerTool(name, {description, inputSchema}, handler)` with Zod schemas for input validation.

- **`remember`** — Saves a memory as a `.md` file. Generates an 8-char hex ID + slug filename (e.g. `a1b2c3d4-use-postgres.md`). Only `title` is required.
- **`recall`** — Searches memories by tokenizing the query, scoring items (+3 per keyword match in title/content, +4 per tag match), and ranking by score.
- **`memory`** — Four actions: `status` (overview), `list` (all items), `update` (edit in place), `delete` (by ID prefix).
- **`export`** — Dumps all memories as a single JSON object for backup/sharing.
- **`import`** — Restores from exported JSON, skipping duplicates by title.

### MCP Resources

Memories are also exposed as MCP resources via `memory:///{id}` URI template in `src/server/index.ts`, allowing CLIs to auto-discover and load project context.

### Storage Layer (`src/storage.ts`)

Markdown files with simple YAML frontmatter (type, title, tags, created, updated, source). The frontmatter parser is hand-written — it only handles flat key:value and `[array]` syntax. No external YAML library.

Key functions: `writeMemory()`, `readAllMemories()`, `readMemory()`, `updateMemory()`, `deleteMemory()`, `exportMemories()`, `importMemories()`.

Files are identified by ID prefix — `readMemory(dir, "a1b2c3d4")` finds any file starting with that prefix.

### Project Root Detection (`src/runtime.ts`)

Priority: `MEMORY_PROJECT_ROOT` env var → nearest ancestor with `.git` → cwd. Memory dir defaults to `<root>/.ai/memory/`, overridable via `MEMORY_DIR_PATH`.

### Domain Logic (`src/domain.ts`)

Pure functions: `tokenize()` splits on non-alphanumeric (preserves hyphens/underscores, min 2 chars, max 40 tokens), `scoreItem()` ranks search results, `normalizeTags()` deduplicates and lowercases (max 20), `validateType()` ensures valid memory type or defaults to "note", `slugify()` creates filename-safe strings (max 60 chars).

### Memory Types

`note`, `decision`, `fact`, `constraint`, `todo`, `architecture`, `glossary` — defined in `src/config.ts` as `ALLOWED_TYPES` set.

## Testing

Tests use vitest with `globals: true`. Storage/integration tests create temp directories via `fs.mkdtemp()` and clean up in `afterEach`. Coverage excludes `src/cli.ts`.

## TypeScript

Strict mode enabled (`strict: true`, `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`). Target ES2022, NodeNext modules. Build config in `tsconfig.build.json` extends `tsconfig.json`.
