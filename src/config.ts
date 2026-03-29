export const CONFIG = {
  serverName: "context-bridge",
  serverVersion: "1.0.0",
  /** Directory inside project root where memories are stored */
  memoryDir: ".ai/memory",
} as const;

export const LIMITS = {
  maxTags: 20,
  maxTitleChars: 200,
  maxContentChars: 5000,
  maxSnippetChars: 280,
} as const;

export const ALLOWED_TYPES = new Set([
  "note",
  "decision",
  "fact",
  "constraint",
  "todo",
  "architecture",
  "glossary",
]);
