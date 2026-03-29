export const CONFIG = {
  serverName: "context-bridge",
  serverVersion: "1.0.5",
  /** Directory inside project root where individual memory files are stored */
  memoryDir: ".ai/memory",
  /** Single compacted memory file path */
  memoryFile: ".ai/memory.md",
  /** Auto-compact when individual files reach this count */
  compactThreshold: 20,
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
