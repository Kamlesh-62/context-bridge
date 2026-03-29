import { describe, it, expect } from "vitest";
import { parseFrontmatter, serializeFrontmatter } from "../../../src/storage.js";
import type { MemoryFrontmatter } from "../../../src/types.js";

describe("parseFrontmatter", () => {
  it("parses valid frontmatter", () => {
    const raw = `---
type: decision
title: Use PostgreSQL
tags: [database, infrastructure]
created: 2024-01-15T00:00:00Z
updated: 2024-01-15T00:00:00Z
source: claude
---

We chose PostgreSQL.`;

    const { meta, content } = parseFrontmatter(raw);
    expect(meta.type).toBe("decision");
    expect(meta.title).toBe("Use PostgreSQL");
    expect(meta.tags).toEqual(["database", "infrastructure"]);
    expect(meta.created).toBe("2024-01-15T00:00:00Z");
    expect(meta.source).toBe("claude");
    expect(content).toBe("We chose PostgreSQL.");
  });

  it("returns raw content when no frontmatter", () => {
    const raw = "Just some content without frontmatter.";
    const { meta, content } = parseFrontmatter(raw);
    expect(content).toBe(raw);
    expect(Object.keys(meta)).toHaveLength(0);
  });

  it("handles empty tags array", () => {
    const raw = `---
type: note
title: Test
tags: []
created: 2024-01-01T00:00:00Z
updated: 2024-01-01T00:00:00Z
---

Content.`;

    const { meta } = parseFrontmatter(raw);
    expect(meta.tags).toEqual([]);
  });
});

describe("serializeFrontmatter", () => {
  it("produces valid markdown with frontmatter", () => {
    const meta: MemoryFrontmatter = {
      type: "decision",
      title: "Use PostgreSQL",
      tags: ["database", "infrastructure"],
      created: "2024-01-15T00:00:00Z",
      updated: "2024-01-15T00:00:00Z",
      source: "claude",
    };

    const result = serializeFrontmatter(meta, "We chose PostgreSQL.");
    expect(result).toContain("---");
    expect(result).toContain("type: decision");
    expect(result).toContain("title: Use PostgreSQL");
    expect(result).toContain("tags: [database, infrastructure]");
    expect(result).toContain("source: claude");
    expect(result).toContain("We chose PostgreSQL.");
  });

  it("omits source when not provided", () => {
    const meta: MemoryFrontmatter = {
      type: "note",
      title: "Test",
      tags: [],
      created: "2024-01-01T00:00:00Z",
      updated: "2024-01-01T00:00:00Z",
    };

    const result = serializeFrontmatter(meta, "Content.");
    expect(result).not.toContain("source:");
  });

  it("omits tags line when tags array is empty", () => {
    const meta: MemoryFrontmatter = {
      type: "note",
      title: "Test",
      tags: [],
      created: "2024-01-01T00:00:00Z",
      updated: "2024-01-01T00:00:00Z",
    };

    const result = serializeFrontmatter(meta, "Content.");
    expect(result).not.toContain("tags:");
  });

  it("roundtrips through parse", () => {
    const meta: MemoryFrontmatter = {
      type: "fact",
      title: "Node version",
      tags: ["environment"],
      created: "2024-06-01T00:00:00Z",
      updated: "2024-06-01T00:00:00Z",
      source: "gemini",
    };

    const serialized = serializeFrontmatter(meta, "Node 20.11.0");
    const { meta: parsed, content } = parseFrontmatter(serialized);

    expect(parsed.type).toBe("fact");
    expect(parsed.title).toBe("Node version");
    expect(parsed.tags).toEqual(["environment"]);
    expect(parsed.source).toBe("gemini");
    expect(content).toBe("Node 20.11.0");
  });
});
