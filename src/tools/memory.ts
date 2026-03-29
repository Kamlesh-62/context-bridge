import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  readAllMemories,
  deleteMemory,
  deleteMemoryByTitle,
  updateMemory,
  compactMemories,
  getMemoryDir,
} from "../storage.js";

export function registerMemoryTool(server: McpServer): void {
  server.registerTool(
    "memory",
    {
      description:
        "Manage shared project memory (.ai/memory/) accessible by all AI CLIs. Actions: 'status' (default), 'list', 'update', 'delete', 'compact'.",
      inputSchema: {
        action: z
          .enum(["status", "list", "update", "delete", "compact"])
          .default("status")
          .describe("What to do: status, list, update, delete, or compact"),
        id: z.string().optional().describe("Memory ID like #a1b2 (for update/delete)"),
        title: z.string().optional().describe("Title — for update or delete-by-title"),
        content: z.string().optional().describe("New content (for update)"),
        type: z.string().optional().describe("New type (for update)"),
        tags: z.array(z.string()).optional().describe("New tags (for update)"),
        projectRoot: z.string().optional().describe("Project root path (auto-detected if omitted)"),
      },
    },
    async ({ action, id, title, content, type, tags, projectRoot }) => {
      const { memoryDir, projectRoot: resolvedRoot } = await getMemoryDir(projectRoot);

      if (action === "compact") {
        const count = await compactMemories(memoryDir);
        return {
          content: [
            {
              type: "text",
              text:
                count > 0
                  ? `Compacted ${count} memories into .ai/memory.md`
                  : "No memories to compact.",
            },
          ],
        };
      }

      if (action === "delete") {
        if (!id && !title) {
          return {
            content: [
              { type: "text", text: "Error: 'id' or 'title' is required for delete action." },
            ],
          };
        }

        let deleted: boolean;
        if (id) {
          deleted = await deleteMemory(memoryDir, id);
        } else {
          deleted = await deleteMemoryByTitle(memoryDir, title!);
        }

        const ref = id || title;
        return {
          content: [
            {
              type: "text",
              text: deleted ? `Deleted memory: ${ref}` : `Memory not found: ${ref}`,
            },
          ],
        };
      }

      if (action === "update") {
        if (!id) {
          return {
            content: [{ type: "text", text: "Error: 'id' is required for update action." }],
          };
        }
        const updated = await updateMemory(memoryDir, id, { title, content, type, tags });
        if (!updated) {
          return {
            content: [{ type: "text", text: `Memory not found: ${id}` }],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: `Updated: ${updated.title} (${updated.type}) — #${updated.id}`,
            },
          ],
        };
      }

      const items = await readAllMemories(memoryDir);

      if (action === "list") {
        if (items.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No memories yet. Use `remember` to save your first one.",
              },
            ],
          };
        }

        const list = items
          .map((item) => {
            const tagsStr = item.tags.length > 0 ? `  [${item.tags.join(", ")}]` : "";
            return `#${item.id}  ${item.type}  **${item.title}**${tagsStr}`;
          })
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `**${items.length} memor${items.length === 1 ? "y" : "ies"}:**\n\n${list}`,
            },
          ],
        };
      }

      // Default: status
      const typeCounts: Record<string, number> = {};
      for (const item of items) {
        typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
      }

      const lines = [
        `**Project:** ${resolvedRoot}`,
        `**Memory dir:** ${memoryDir}`,
        `**Total memories:** ${items.length}`,
      ];

      if (items.length > 0) {
        lines.push("");
        lines.push("**By type:**");
        for (const [tp, count] of Object.entries(typeCounts).sort()) {
          lines.push(`  ${tp}: ${count}`);
        }
      }

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    },
  );
}
