import fs from "node:fs/promises";
import path from "node:path";
import { CONFIG, LIMITS } from "./config.js";
import { findProjectRoot, resolveMemoryDir, nowIso } from "./runtime.js";
import { newUniqueId, normalizeTags, validateType } from "./domain.js";
import type { MemoryItem, MemoryFrontmatter } from "./types.js";

// --- Frontmatter parsing ---

/** Parse YAML-like frontmatter from markdown content. */
export function parseFrontmatter(raw: string): {
  meta: Record<string, string | string[]>;
  content: string;
} {
  const meta: Record<string, string | string[]> = {};
  let content = raw;

  if (raw.startsWith("---")) {
    const end = raw.indexOf("\n---", 3);
    if (end !== -1) {
      const block = raw.slice(3, end).trim();
      content = raw.slice(end + 4).trim();

      for (const line of block.split("\n")) {
        const colonIdx = line.indexOf(":");
        if (colonIdx === -1) continue;

        const key = line.slice(0, colonIdx).trim();
        const val = line.slice(colonIdx + 1).trim();

        // Parse arrays: [item1, item2]
        if (val.startsWith("[") && val.endsWith("]")) {
          meta[key] = val
            .slice(1, -1)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else {
          meta[key] = val;
        }
      }
    }
  }

  return { meta, content };
}

/** Serialize frontmatter + content into a markdown string. */
export function serializeFrontmatter(meta: MemoryFrontmatter, content: string): string {
  const lines: string[] = ["---"];
  lines.push(`id: ${meta.id}`);
  lines.push(`type: ${meta.type}`);
  lines.push(`title: ${meta.title}`);
  if (meta.tags.length > 0) {
    lines.push(`tags: [${meta.tags.join(", ")}]`);
  }
  lines.push(`created: ${meta.created}`);
  lines.push(`updated: ${meta.updated}`);
  if (meta.source) {
    lines.push(`source: ${meta.source}`);
  }
  lines.push("---");
  lines.push("");
  lines.push(content);
  lines.push("");
  return lines.join("\n");
}

// --- File operations ---

const COMPACT_HEADER = "<!-- context-bridge memories -->";

/** Ensure the memory directory exists. */
export async function ensureMemoryDir(memoryDir: string): Promise<void> {
  await fs.mkdir(memoryDir, { recursive: true });
}

/** Build a filename for a memory item (short ID only). */
export function buildFilename(id: string): string {
  return `${id}.md`;
}

/** Enforce title and content length limits. */
function truncateTitle(title: string): string {
  return title.slice(0, LIMITS.maxTitleChars);
}

function truncateContent(content: string): string {
  return content.slice(0, LIMITS.maxContentChars);
}

/** Extract the short hex ID from a filename, handling old long format. */
function idFromFilename(filename: string): string {
  const base = path.basename(filename, ".md");
  // Old format: "a1b2c3d4-use-postgresql" → extract "a1b2c3d4"
  // New format: "a1b2" → use as-is
  const match = base.match(/^([a-f0-9]{4,8})/);
  return match ? match[1] : base;
}

/** Parse a MemoryItem from a .md file. */
function fileToItem(filePath: string, raw: string): MemoryItem {
  const { meta, content } = parseFrontmatter(raw);
  const id = idFromFilename(filePath);
  const now = nowIso();

  return {
    id: typeof meta.id === "string" ? meta.id : id,
    type: validateType(meta.type),
    title: typeof meta.title === "string" ? meta.title : id,
    content,
    tags: normalizeTags(meta.tags),
    source: typeof meta.source === "string" ? meta.source : undefined,
    created: typeof meta.created === "string" ? meta.created : now,
    updated: typeof meta.updated === "string" ? meta.updated : now,
  };
}

/** Parse all memory items from a compacted .ai/memory.md file. */
function parseCompactFile(raw: string): MemoryItem[] {
  if (!raw.trim()) return [];

  // Split on blank line followed by --- and id:
  const sections = raw.split(/\n\n(?=---\nid: )/);
  const items: MemoryItem[] = [];
  const now = nowIso();

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed.startsWith("---")) continue;

    const { meta, content } = parseFrontmatter(trimmed);
    if (!meta.id || typeof meta.id !== "string") continue;

    items.push({
      id: meta.id,
      type: validateType(meta.type),
      title: typeof meta.title === "string" ? meta.title : meta.id,
      content: content.trim(),
      tags: normalizeTags(meta.tags),
      source: typeof meta.source === "string" ? meta.source : undefined,
      created: typeof meta.created === "string" ? meta.created : now,
      updated: typeof meta.updated === "string" ? meta.updated : now,
    });
  }

  return items;
}

/** Serialize all memory items into a single compacted file string. */
function serializeCompactFile(items: MemoryItem[]): string {
  const sections: string[] = [COMPACT_HEADER, ""];

  for (const item of items) {
    const meta: MemoryFrontmatter = {
      id: item.id,
      type: item.type,
      title: item.title,
      tags: item.tags,
      created: item.created,
      updated: item.updated,
      source: item.source,
    };
    sections.push(serializeFrontmatter(meta, item.content));
  }

  return sections.join("\n");
}

/** Resolve the compact file path (.ai/memory.md) for a project root. */
function resolveCompactFile(projectRoot: string): string {
  return path.join(projectRoot, CONFIG.memoryFile);
}

/** Check if the compact file exists. */
async function compactFileExists(projectRoot: string): Promise<boolean> {
  try {
    await fs.stat(resolveCompactFile(projectRoot));
    return true;
  } catch {
    return false;
  }
}

/** Read memories from individual files in the directory. */
async function readFromDir(memoryDir: string): Promise<MemoryItem[]> {
  try {
    const files = await fs.readdir(memoryDir);
    const mdFiles = files.filter((f) => f.endsWith(".md")).sort();

    const items: MemoryItem[] = [];
    for (const file of mdFiles) {
      try {
        const raw = await fs.readFile(path.join(memoryDir, file), "utf8");
        items.push(fileToItem(file, raw));
      } catch {
        // skip unreadable files
      }
    }
    return items;
  } catch {
    return [];
  }
}

/** Read memories from the compact file. */
async function readFromCompactFile(projectRoot: string): Promise<MemoryItem[]> {
  try {
    const raw = await fs.readFile(resolveCompactFile(projectRoot), "utf8");
    return parseCompactFile(raw);
  } catch {
    return [];
  }
}

// --- Write lock for single-file operations ---

let writeLock = Promise.resolve();

async function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = writeLock;
  let resolve: () => void;
  writeLock = new Promise<void>((r) => {
    resolve = r;
  });
  await prev;
  try {
    return await fn();
  } finally {
    resolve!();
  }
}

// --- Public API ---

/** Read all memory items from both individual files and compact file. */
export async function readAllMemories(
  memoryDir: string,
  projectRoot?: string,
): Promise<MemoryItem[]> {
  const root = projectRoot ?? await resolveProjectRoot(memoryDir);
  const dirItems = await readFromDir(memoryDir);
  const compactItems = await readFromCompactFile(root);

  // Merge, deduplicating by ID (dir items take precedence)
  const seen = new Set<string>();
  const items: MemoryItem[] = [];

  for (const item of dirItems) {
    seen.add(item.id);
    items.push(item);
  }
  for (const item of compactItems) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      items.push(item);
    }
  }

  return items;
}

/** Read a single memory item by ID (prefix match). */
export async function readMemory(
  memoryDir: string,
  id: string,
  projectRoot?: string,
): Promise<MemoryItem | null> {
  const cleanId = id.replace(/^#/, "");
  const all = await readAllMemories(memoryDir, projectRoot);
  return all.find((item) => item.id.startsWith(cleanId)) ?? null;
}

/** Write a memory item. Appends to compact file if it exists, otherwise creates individual file. */
export async function writeMemory(
  memoryDir: string,
  input: { type?: string; title: string; content?: string; tags?: string[]; source?: string },
  projectRoot?: string,
): Promise<MemoryItem> {
  const root = projectRoot ?? await resolveProjectRoot(memoryDir);
  const useCompact = await compactFileExists(root);

  const allItems = await readAllMemories(memoryDir, root);
  const existingIds = new Set(allItems.map((item) => item.id));

  const now = nowIso();
  const id = newUniqueId(existingIds);
  const type = validateType(input.type);
  const tags = normalizeTags(input.tags);
  const title = truncateTitle(input.title.trim());
  const content = truncateContent((input.content || input.title).trim());

  const meta: MemoryFrontmatter = {
    id,
    type,
    title,
    tags,
    created: now,
    updated: now,
    source: input.source?.trim(),
  };

  const item: MemoryItem = {
    id,
    type,
    title,
    content,
    tags,
    source: meta.source,
    created: now,
    updated: now,
  };

  if (useCompact) {
    await withWriteLock(async () => {
      const section = "\n" + serializeFrontmatter(meta, content);
      await fs.appendFile(resolveCompactFile(root), section, "utf8");
    });
  } else {
    await ensureMemoryDir(memoryDir);
    const filename = buildFilename(id);
    const markdown = serializeFrontmatter(meta, content);
    await fs.writeFile(path.join(memoryDir, filename), markdown, "utf8");

    // Auto-compact check
    try {
      const files = await fs.readdir(memoryDir);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      if (mdFiles.length >= CONFIG.compactThreshold) {
        await compactMemories(memoryDir, root);
      }
    } catch {
      // ignore auto-compact errors
    }
  }

  return item;
}

/** Update an existing memory item. Returns the updated item or null if not found. */
export async function updateMemory(
  memoryDir: string,
  id: string,
  updates: { title?: string; content?: string; type?: string; tags?: string[] },
  projectRoot?: string,
): Promise<MemoryItem | null> {
  const cleanId = id.replace(/^#/, "");
  const root = projectRoot ?? await resolveProjectRoot(memoryDir);
  const now = nowIso();
  const safeTitle = updates.title ? truncateTitle(updates.title) : undefined;
  const safeContent = updates.content ? truncateContent(updates.content) : undefined;

  // Try individual files first
  try {
    const files = await fs.readdir(memoryDir);
    const match = files.find((f) => f.startsWith(cleanId) && f.endsWith(".md"));
    if (match) {
      const filePath = path.join(memoryDir, match);
      const raw = await fs.readFile(filePath, "utf8");
      const item = fileToItem(match, raw);

      const meta: MemoryFrontmatter = {
        id: item.id,
        type: updates.type ? validateType(updates.type) : item.type,
        title: safeTitle?.trim() || item.title,
        tags: updates.tags ? normalizeTags(updates.tags) : item.tags,
        created: item.created,
        updated: now,
        source: item.source,
      };

      const content = safeContent?.trim() || item.content;
      const markdown = serializeFrontmatter(meta, content);
      await fs.writeFile(filePath, markdown, "utf8");

      return {
        id: item.id,
        type: meta.type as MemoryItem["type"],
        title: meta.title,
        content,
        tags: meta.tags,
        source: meta.source,
        created: meta.created,
        updated: now,
      };
    }
  } catch {
    // directory may not exist
  }

  // Try compact file
  return withWriteLock(async () => {
    const compactPath = resolveCompactFile(root);
    let raw: string;
    try {
      raw = await fs.readFile(compactPath, "utf8");
    } catch {
      return null;
    }

    const items = parseCompactFile(raw);
    const idx = items.findIndex((item) => item.id.startsWith(cleanId));
    if (idx === -1) return null;

    const item = items[idx];
    const updated: MemoryItem = {
      id: item.id,
      type: updates.type ? (validateType(updates.type) as MemoryItem["type"]) : item.type,
      title: safeTitle?.trim() || item.title,
      content: safeContent?.trim() || item.content,
      tags: updates.tags ? normalizeTags(updates.tags) : item.tags,
      source: item.source,
      created: item.created,
      updated: now,
    };

    items[idx] = updated;
    await fs.writeFile(compactPath, serializeCompactFile(items), "utf8");
    return updated;
  });
}

/** Delete a memory item by ID. Returns true if deleted. */
export async function deleteMemory(
  memoryDir: string,
  id: string,
  projectRoot?: string,
): Promise<boolean> {
  const cleanId = id.replace(/^#/, "");

  // Try individual files first
  try {
    const files = await fs.readdir(memoryDir);
    const match = files.find((f) => f.startsWith(cleanId) && f.endsWith(".md"));
    if (match) {
      await fs.unlink(path.join(memoryDir, match));
      return true;
    }
  } catch {
    // directory may not exist
  }

  // Try compact file
  return withWriteLock(async () => {
    const root = projectRoot ?? await resolveProjectRoot(memoryDir);
    const compactPath = resolveCompactFile(root);
    let raw: string;
    try {
      raw = await fs.readFile(compactPath, "utf8");
    } catch {
      return false;
    }

    const items = parseCompactFile(raw);
    const filtered = items.filter((item) => !item.id.startsWith(cleanId));
    if (filtered.length === items.length) return false;

    await fs.writeFile(compactPath, serializeCompactFile(filtered), "utf8");
    return true;
  });
}

/** Delete a memory item by title (case-insensitive). Returns true if deleted. */
export async function deleteMemoryByTitle(
  memoryDir: string,
  title: string,
  projectRoot?: string,
): Promise<boolean> {
  const lowerTitle = title.toLowerCase().trim();
  const all = await readAllMemories(memoryDir, projectRoot);
  const match = all.find((item) => item.title.toLowerCase() === lowerTitle);
  if (!match) return false;
  return deleteMemory(memoryDir, match.id, projectRoot);
}

/** Compact all individual memory files into a single .ai/memory.md file. Returns count of compacted items. */
export async function compactMemories(
  memoryDir: string,
  projectRoot?: string,
): Promise<number> {
  const root = projectRoot ?? await resolveProjectRoot(memoryDir);
  const compactPath = resolveCompactFile(root);

  // Read from both sources
  const dirItems = await readFromDir(memoryDir);
  const compactItems = await readFromCompactFile(root);

  // Merge (dedup by ID, dir takes precedence)
  const seen = new Set<string>();
  const allItems: MemoryItem[] = [];
  for (const item of dirItems) {
    seen.add(item.id);
    allItems.push(item);
  }
  for (const item of compactItems) {
    if (!seen.has(item.id)) {
      allItems.push(item);
    }
  }

  if (allItems.length === 0) return 0;

  // Write compact file
  await fs.mkdir(path.dirname(compactPath), { recursive: true });
  await fs.writeFile(compactPath, serializeCompactFile(allItems), "utf8");

  // Remove individual files
  if (dirItems.length > 0) {
    try {
      const files = await fs.readdir(memoryDir);
      for (const file of files) {
        if (file.endsWith(".md")) {
          await fs.unlink(path.join(memoryDir, file));
        }
      }
      // Try removing the directory (will fail if not empty, which is fine)
      await fs.rmdir(memoryDir);
    } catch {
      // ignore cleanup errors
    }
  }

  return allItems.length;
}

/** Export all memories as a single JSON string. */
export async function exportMemories(
  memoryDir: string,
  projectRoot?: string,
): Promise<string> {
  const items = await readAllMemories(memoryDir, projectRoot);
  return JSON.stringify({ version: 1, exported: nowIso(), memories: items }, null, 2);
}

/** Import memories from a JSON string. Returns count of imported items. Skips duplicates by title. */
export async function importMemories(
  memoryDir: string,
  json: string,
  projectRoot?: string,
): Promise<number> {
  const data = JSON.parse(json);
  if (!data || !Array.isArray(data.memories)) {
    throw new Error("Invalid export format: expected { memories: [...] }");
  }

  const existing = await readAllMemories(memoryDir, projectRoot);
  const existingTitles = new Set(existing.map((item) => item.title.toLowerCase()));

  let imported = 0;
  for (const mem of data.memories) {
    if (!mem.title || typeof mem.title !== "string") continue;
    if (existingTitles.has(mem.title.toLowerCase())) continue;

    // Track this title to prevent duplicates within the same import
    existingTitles.add(mem.title.toLowerCase());

    await writeMemory(
      memoryDir,
      {
        type: mem.type,
        title: mem.title,
        content: mem.content || mem.title,
        tags: Array.isArray(mem.tags) ? mem.tags : [],
        source: mem.source,
      },
      projectRoot,
    );
    imported++;
  }

  return imported;
}

/** Resolve the memory directory for the current project. */
export async function getMemoryDir(
  projectRoot?: string,
): Promise<{ memoryDir: string; projectRoot: string }> {
  const root = projectRoot ? path.resolve(projectRoot) : await findProjectRoot();
  return {
    memoryDir: resolveMemoryDir(root),
    projectRoot: root,
  };
}

/** Resolve project root from memory dir path. */
async function resolveProjectRoot(_memoryDir: string): Promise<string> {
  return findProjectRoot();
}
