import { describe, it, expect } from "vitest";
import { validateType, normalizeTags, safeSnippet, newId, slugify } from "../../../src/domain.js";

describe("validateType", () => {
  it("accepts valid types", () => {
    expect(validateType("decision")).toBe("decision");
    expect(validateType("fact")).toBe("fact");
    expect(validateType("note")).toBe("note");
    expect(validateType("todo")).toBe("todo");
    expect(validateType("architecture")).toBe("architecture");
  });

  it("defaults to note for invalid types", () => {
    expect(validateType("invalid")).toBe("note");
    expect(validateType("")).toBe("note");
    expect(validateType(null)).toBe("note");
    expect(validateType(undefined)).toBe("note");
  });

  it("is case-insensitive", () => {
    expect(validateType("DECISION")).toBe("decision");
    expect(validateType("Fact")).toBe("fact");
  });
});

describe("normalizeTags", () => {
  it("lowercases and deduplicates tags", () => {
    expect(normalizeTags(["DB", "db", "API"])).toEqual(["db", "api"]);
  });

  it("filters out empty strings", () => {
    expect(normalizeTags(["", "valid", ""])).toEqual(["valid"]);
  });

  it("returns empty array for non-array input", () => {
    expect(normalizeTags(undefined)).toEqual([]);
    expect(normalizeTags(null)).toEqual([]);
    expect(normalizeTags("string")).toEqual([]);
  });

  it("limits to 20 tags", () => {
    const tags = Array.from({ length: 25 }, (_, i) => `tag${i}`);
    expect(normalizeTags(tags)).toHaveLength(20);
  });
});

describe("safeSnippet", () => {
  it("returns short text unchanged", () => {
    expect(safeSnippet("hello")).toBe("hello");
  });

  it("truncates long text with ellipsis", () => {
    const long = "a".repeat(300);
    const snippet = safeSnippet(long);
    expect(snippet.length).toBeLessThanOrEqual(280);
    expect(snippet.endsWith("...")).toBe(true);
  });

  it("collapses whitespace", () => {
    expect(safeSnippet("hello   world\n\nfoo")).toBe("hello world foo");
  });

  it("handles empty/null input", () => {
    expect(safeSnippet("")).toBe("");
    expect(safeSnippet(null)).toBe("");
    expect(safeSnippet(undefined)).toBe("");
  });

  it("respects custom maxChars", () => {
    const snippet = safeSnippet("hello world foo bar", 10);
    expect(snippet.length).toBeLessThanOrEqual(10);
  });
});

describe("newId", () => {
  it("returns a 4-character hex string", () => {
    const id = newId();
    expect(id).toMatch(/^[a-f0-9]{4}$/);
  });

  it("generates mostly unique IDs", () => {
    const ids = new Set(Array.from({ length: 20 }, () => newId()));
    expect(ids.size).toBe(20);
  });
});

describe("slugify", () => {
  it("converts to lowercase kebab-case", () => {
    expect(slugify("Use PostgreSQL")).toBe("use-postgresql");
  });

  it("removes special characters", () => {
    expect(slugify("What's the plan?")).toBe("what-s-the-plan");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("limits to 60 characters", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(60);
  });

  it("handles empty input", () => {
    expect(slugify("")).toBe("");
  });
});
