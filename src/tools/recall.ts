import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readAllMemories, getMemoryDir } from "../storage.js";
import { tokenize, normalizeTags, scoreItem, safeSnippet, validateType } from "../domain.js";

export function registerRecallTool(server: McpServer): void {
  server.registerTool(
    "recall",
    {
      description:
        "Search and retrieve from project memory. Find relevant decisions, facts, and context by keyword or tags.",
      inputSchema: {
        query: z.string().optional().describe("Search keywords (case-insensitive)"),
        tags: z.array(z.string()).optional().describe("Filter by tags"),
        type: z.string().optional().describe("Filter by memory type"),
        limit: z.number().int().min(1).max(50).default(10).describe("Max results to return"),
        projectRoot: z.string().optional().describe("Project root path (auto-detected if omitted)"),
      },
    },
    async ({ query, tags, type, limit, projectRoot }) => {
      const { memoryDir } = await getMemoryDir(projectRoot);
      const allItems = await readAllMemories(memoryDir);

      if (allItems.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No memories found. Use the `remember` tool to save your first memory.",
            },
          ],
        };
      }

      const queryTokens = query ? tokenize(query) : [];
      const tagTokens = normalizeTags(tags);
      const typeFilter = type ? validateType(type) : null;

      let results = allItems;

      // Filter by type
      if (typeFilter) {
        results = results.filter((item) => item.type === typeFilter);
      }

      // If query or tags provided, score and rank
      if (queryTokens.length > 0 || tagTokens.length > 0) {
        results = results
          .map((item) => ({ item, score: scoreItem(item, queryTokens, tagTokens) }))
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((x) => x.item);
      }

      results = results.slice(0, limit);

      if (results.length === 0) {
        return {
          content: [{ type: "text", text: "No matching memories found." }],
        };
      }

      const output = results
        .map((item) => {
          const tagsStr = item.tags.length > 0 ? ` [${item.tags.join(", ")}]` : "";
          return `**${item.title}** (${item.type})${tagsStr}\n${safeSnippet(item.content, 300)}\n_ID: ${item.id}_`;
        })
        .join("\n\n---\n\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${results.length} memor${results.length === 1 ? "y" : "ies"}:\n\n${output}`,
          },
        ],
      };
    },
  );
}
