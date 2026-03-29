import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CONFIG } from "../config.js";
import { log } from "../logger.js";
import { findProjectRoot, resolveMemoryDir } from "../runtime.js";
import { readAllMemories, readMemory } from "../storage.js";
import { registerTools } from "../tools/index.js";

function registerResources(server: McpServer, memoryDir: string): void {
  server.registerResource(
    "project-memories",
    new ResourceTemplate("memory:///{id}", {
      list: async () => {
        const items = await readAllMemories(memoryDir);
        return {
          resources: items.map((item) => ({
            uri: `memory:///${item.id}`,
            name: item.title,
            description: `${item.type}: ${item.title}`,
            mimeType: "text/markdown" as const,
          })),
        };
      },
    }),
    { description: "Project memory items" },
    async (_uri, variables) => {
      const id = String(variables.id);
      const item = await readMemory(memoryDir, id);
      if (!item) {
        return {
          contents: [{ uri: `memory:///${id}`, text: "Memory not found.", mimeType: "text/plain" }],
        };
      }
      const text = `# ${item.title}\n\n**Type:** ${item.type}\n**Tags:** ${item.tags.join(", ") || "none"}\n\n${item.content}`;
      return { contents: [{ uri: `memory:///${item.id}`, text, mimeType: "text/markdown" }] };
    },
  );
}

export async function startServer(): Promise<void> {
  const server = new McpServer({
    name: CONFIG.serverName,
    version: CONFIG.serverVersion,
  });

  const projectRoot = await findProjectRoot();
  const memoryDir = resolveMemoryDir(projectRoot);

  registerTools(server);
  registerResources(server, memoryDir);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  log("running on stdio");
  log("project:", projectRoot);
  log("memory dir:", memoryDir);
}
