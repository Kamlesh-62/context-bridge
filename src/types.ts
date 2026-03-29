export type MemoryType =
  | "note"
  | "decision"
  | "fact"
  | "constraint"
  | "todo"
  | "architecture"
  | "glossary";

export interface MemoryItem {
  /** Derived from filename (e.g. "a1b2c3d4-use-postgres") */
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
  type: string;
  tags: string[];
  created: string;
  updated: string;
  source?: string;
  title: string;
}
