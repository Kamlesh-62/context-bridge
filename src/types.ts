export type MemoryType =
  | "note"
  | "decision"
  | "fact"
  | "constraint"
  | "todo"
  | "architecture"
  | "glossary";

export interface MemoryItem {
  /** Short hex identifier (e.g. "a1b2") */
  id: string;
  type: MemoryType;
  title: string;
  content: string;
  tags: string[];
  source?: string;
  created: string;
  updated: string;
}

/** Parsed frontmatter from a .md memory file */
export interface MemoryFrontmatter {
  id: string;
  type: string;
  tags: string[];
  created: string;
  updated: string;
  source?: string;
  title: string;
}
