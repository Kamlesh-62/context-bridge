import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { exportMemories, getMemoryDir } from "../storage.js";

export function registerExportTool(server: McpServer): void {
  server.registerTool(
    "export",
    {
      description:
        "Export all project memories as JSON. Use this for backups or sharing with your team.",
      inputSchema: {
        projectRoot: z.string().optional().describe("Project root path (auto-detected if omitted)"),
      },
    },
    async ({ projectRoot }) => {
      const { memoryDir } = await getMemoryDir(projectRoot);
      const json = await exportMemories(memoryDir);
      return { content: [{ type: "text", text: json }] };
    },
  );
}
