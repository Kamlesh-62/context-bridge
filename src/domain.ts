import crypto from "node:crypto";
import { ALLOWED_TYPES, LIMITS } from "./config.js";
import type { MemoryItem, MemoryType } from "./types.js";

/** Normalize and deduplicate tags. */
export function normalizeTags(tags?: unknown): string[] {
  const arr = Array.isArray(tags) ? tags : [];
  const normalized = arr
    .map((t) =>
      String(t || "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
  return Array.from(new Set(normalized)).slice(0, LIMITS.maxTags);
}

/** Validate a memory type string, defaulting to "note". */
export function validateType(type: unknown): MemoryType {
  const t = String(type || "note")
    .toLowerCase()
    .trim();
  return ALLOWED_TYPES.has(t) ? (t as MemoryType) : "note";
}

/** Split text into searchable tokens. */
export function tokenize(text: unknown): string[] {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9_-]+/i)
    .map((x) => x.trim())
    .filter((x) => x.length >= 2)
    .slice(0, 40);
}

/** Score a memory item against query and tag tokens. */
export function scoreItem(
  item: Pick<MemoryItem, "title" | "content" | "tags">,
  queryTokens: string[],
  tagTokens: string[],
): number {
  const hay = `${item.title || ""} ${item.content || ""}`.toLowerCase();
  let score = 0;

  for (const t of queryTokens) {
    if (t && hay.includes(t)) score += 3;
  }

  const itemTags = new Set(normalizeTags(item.tags));
  for (const t of tagTokens) {
    if (itemTags.has(t)) score += 4;
  }

  return score;
}

/** Truncate text with ellipsis. */
export function safeSnippet(text: unknown, maxChars: number = LIMITS.maxSnippetChars): string {
  const s = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length <= maxChars) return s;
  return `${s.slice(0, maxChars - 3)}...`;
}

/** Generate a short random ID (4 hex chars). */
export function newId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 4);
}

/** Generate a unique ID that doesn't collide with existing ones. */
export function newUniqueId(existingIds: Set<string>): string {
  let id = newId();
  let attempts = 0;
  while (existingIds.has(id) && attempts < 10) {
    id = newId();
    attempts++;
  }
  if (existingIds.has(id)) {
    id = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
  }
  return id;
}

/** Create a filename-safe slug from text. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
