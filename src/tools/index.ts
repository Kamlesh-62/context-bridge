import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerRememberTool } from "./remember.js";
import { registerRecallTool } from "./recall.js";
import { registerMemoryTool } from "./memory.js";
import { registerExportTool } from "./export.js";
import { registerImportTool } from "./import.js";

export function registerTools(server: McpServer): void {
  registerRememberTool(server);
  registerRecallTool(server);
  registerMemoryTool(server);
  registerExportTool(server);
  registerImportTool(server);
}
