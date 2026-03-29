# Contributing

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/Kamlesh-62/context-bridge.git
cd context-bridge
npm install
```

## Commands

| Command | What it does |
|---------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run dev` | Watch mode compilation |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Check for lint errors |
| `npm run lint:fix` | Auto-fix lint errors |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Type-check without building |

## Project Structure

```
src/
├── cli.ts           # CLI entry point
├── server/index.ts  # MCP server bootstrap
├── tools/           # MCP tools (remember, recall, memory, export, import)
├── storage.ts       # Read/write markdown memory files
├── domain.ts        # Scoring, tokenization, validation
├── config.ts        # Configuration constants
├── types.ts         # TypeScript interfaces
├── runtime.ts       # Project root resolution
└── logger.ts        # Stderr logging
```

## How to Add a New MCP Tool

1. Create `src/tools/your-tool.ts`:

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerYourTool(server: McpServer): void {
  server.registerTool(
    "your_tool",
    {
      description: "What it does",
      inputSchema: {
        param: z.string().describe("Description"),
      },
    },
    async ({ param }) => {
      return { content: [{ type: "text", text: "result" }] };
    },
  );
}
```

2. Register it in `src/tools/index.ts`
3. Add tests in `tests/unit/tools/your-tool.test.ts`

## Pull Request Process

1. Fork the repo and create a branch
2. Make your changes
3. Run `npm test` and `npm run lint` — both must pass
4. Open a PR with a clear description

## Code Style

- TypeScript with `strict: true`
- Formatted with Prettier (runs automatically)
- Linted with ESLint

## Reporting Bugs

Open an issue with:
- What you expected
- What happened
- Steps to reproduce
- Your Node.js version and OS
