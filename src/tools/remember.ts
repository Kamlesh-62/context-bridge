import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { writeMemory, getMemoryDir } from "../storage.js";

export function registerRememberTool(server: McpServer): void {
  server.registerTool(
    "remember",
    {
      description:
        "Save to shared project memory (.ai/memory/) accessible by all AI CLIs (Claude, Codex, Gemini). Use this instead of any built-in memory — only 'title' is required.",
      inputSchema: {
        title: z.string().min(1).describe("What to remember"),
        content: z.string().optional().describe("Details (defaults to title if omitted)"),
        type: z
          .string()
          .optional()
          .describe("note, decision, fact, constraint, todo, architecture, glossary"),
        tags: z.array(z.string()).optional().describe("Tags for search"),
        source: z.string().optional().describe("Who saved this (e.g. claude, codex, gemini)"),
        projectRoot: z.string().optional().describe("Project root path (auto-detected if omitted)"),
      },
    },
    async ({ title, content, type, tags, source, projectRoot }) => {
      const { memoryDir, projectRoot: resolvedRoot } = await getMemoryDir(projectRoot);

      const item = await writeMemory(memoryDir, {
        type,
        title,
        content: content || title,
        tags,
        source,
      }, resolvedRoot);

      return {
        content: [
          {
            type: "text",
            text: `Saved: ${item.title} (${item.type}) -> #${item.id}`,
          },
        ],
      };
    },
  );
}
