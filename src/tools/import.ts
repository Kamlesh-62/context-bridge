import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { importMemories, getMemoryDir } from "../storage.js";

export function registerImportTool(server: McpServer): void {
  server.registerTool(
    "import",
    {
      description: "Import memories from a previous export. Duplicates are skipped automatically.",
      inputSchema: {
        data: z.string().min(1).describe("JSON string from a previous export"),
        projectRoot: z.string().optional().describe("Project root path (auto-detected if omitted)"),
      },
    },
    async ({ data, projectRoot }) => {
      const { memoryDir } = await getMemoryDir(projectRoot);

      try {
        const count = await importMemories(memoryDir, data);
        return {
          content: [
            {
              type: "text",
              text:
                count > 0
                  ? `Imported ${count} memor${count === 1 ? "y" : "ies"}. Duplicates were skipped.`
                  : "No new memories to import (all duplicates or empty).",
            },
          ],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Import failed: ${msg}` }],
        };
      }
    },
  );
}
