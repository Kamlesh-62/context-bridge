import fs from "node:fs/promises";
import path from "node:path";
import { findProjectRoot, resolveMemoryDir, nowIso } from "./runtime.js";
import { newId, slugify, normalizeTags, validateType } from "./domain.js";
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

/** Ensure the memory directory exists. */
export async function ensureMemoryDir(memoryDir: string): Promise<void> {
  await fs.mkdir(memoryDir, { recursive: true });
}

/** Build a filename for a memory item. */
export function buildFilename(id: string, title: string): string {
  const slug = slugify(title);
  return slug ? `${id}-${slug}.md` : `${id}.md`;
}

/** Parse a MemoryItem from a .md file. */
function fileToItem(filePath: string, raw: string): MemoryItem {
  const { meta, content } = parseFrontmatter(raw);
  const id = path.basename(filePath, ".md");
  const now = nowIso();

  return {
    id,
    type: validateType(meta.type),
    title: typeof meta.title === "string" ? meta.title : id,
    content,
    tags: normalizeTags(meta.tags),
    source: typeof meta.source === "string" ? meta.source : undefined,
    created: typeof meta.created === "string" ? meta.created : now,
    updated: typeof meta.updated === "string" ? meta.updated : now,
  };
}

/** Read all memory items from the memory directory. */
export async function readAllMemories(memoryDir: string): Promise<MemoryItem[]> {
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

/** Read a single memory item by ID. */
export async function readMemory(memoryDir: string, id: string): Promise<MemoryItem | null> {
  try {
    const files = await fs.readdir(memoryDir);
    const match = files.find((f) => f.startsWith(id) && f.endsWith(".md"));
    if (!match) return null;

    const raw = await fs.readFile(path.join(memoryDir, match), "utf8");
    return fileToItem(match, raw);
  } catch {
    return null;
  }
}

/** Write a memory item as a .md file. Returns the item with its ID. */
export async function writeMemory(
  memoryDir: string,
  input: { type?: string; title: string; content?: string; tags?: string[]; source?: string },
): Promise<MemoryItem> {
  await ensureMemoryDir(memoryDir);

  const now = nowIso();
  const id = newId();
  const type = validateType(input.type);
  const tags = normalizeTags(input.tags);

  const meta: MemoryFrontmatter = {
    type,
    title: input.title.trim(),
    tags,
    created: now,
    updated: now,
    source: input.source?.trim(),
  };

  const filename = buildFilename(id, input.title);
  const content = (input.content || input.title).trim();
  const markdown = serializeFrontmatter(meta, content);

  await fs.writeFile(path.join(memoryDir, filename), markdown, "utf8");

  return {
    id: path.basename(filename, ".md"),
    type,
    title: meta.title,
    content,
    tags,
    source: meta.source,
    created: now,
    updated: now,
  };
}

/** Update an existing memory item. Returns the updated item or null if not found. */
export async function updateMemory(
  memoryDir: string,
  id: string,
  updates: { title?: string; content?: string; type?: string; tags?: string[] },
): Promise<MemoryItem | null> {
  try {
    const files = await fs.readdir(memoryDir);
    const match = files.find((f) => f.startsWith(id) && f.endsWith(".md"));
    if (!match) return null;

    const filePath = path.join(memoryDir, match);
    const raw = await fs.readFile(filePath, "utf8");
    const item = fileToItem(match, raw);

    const now = nowIso();
    const meta: MemoryFrontmatter = {
      type: updates.type ? validateType(updates.type) : item.type,
      title: updates.title?.trim() || item.title,
      tags: updates.tags ? normalizeTags(updates.tags) : item.tags,
      created: item.created,
      updated: now,
      source: item.source,
    };

    const content = updates.content?.trim() || item.content;
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
  } catch {
    return null;
  }
}

/** Delete a memory item by ID. Returns true if deleted. */
export async function deleteMemory(memoryDir: string, id: string): Promise<boolean> {
  try {
    const files = await fs.readdir(memoryDir);
    const match = files.find((f) => f.startsWith(id) && f.endsWith(".md"));
    if (!match) return false;

    await fs.unlink(path.join(memoryDir, match));
    return true;
  } catch {
    return false;
  }
}

/** Export all memories as a single JSON string. */
export async function exportMemories(memoryDir: string): Promise<string> {
  const items = await readAllMemories(memoryDir);
  return JSON.stringify({ version: 1, exported: nowIso(), memories: items }, null, 2);
}

/** Import memories from a JSON string. Returns count of imported items. Skips duplicates by title. */
export async function importMemories(memoryDir: string, json: string): Promise<number> {
  const data = JSON.parse(json);
  if (!data || !Array.isArray(data.memories)) {
    throw new Error("Invalid export format: expected { memories: [...] }");
  }

  const existing = await readAllMemories(memoryDir);
  const existingTitles = new Set(existing.map((item) => item.title.toLowerCase()));

  let imported = 0;
  for (const mem of data.memories) {
    if (!mem.title || typeof mem.title !== "string") continue;
    if (existingTitles.has(mem.title.toLowerCase())) continue;

    await writeMemory(memoryDir, {
      type: mem.type,
      title: mem.title,
      content: mem.content || mem.title,
      tags: Array.isArray(mem.tags) ? mem.tags : [],
      source: mem.source,
    });
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
