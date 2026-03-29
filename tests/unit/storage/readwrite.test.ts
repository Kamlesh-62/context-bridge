import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  writeMemory,
  readAllMemories,
  readMemory,
  updateMemory,
  deleteMemory,
} from "../../../src/storage.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "memory-test-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("writeMemory", () => {
  it("creates a .md file and returns the item", async () => {
    const item = await writeMemory(tmpDir, {
      type: "decision",
      title: "Use PostgreSQL",
      content: "We chose PostgreSQL for relational data.",
      tags: ["database"],
      source: "claude",
    });

    expect(item.type).toBe("decision");
    expect(item.title).toBe("Use PostgreSQL");
    expect(item.content).toBe("We chose PostgreSQL for relational data.");
    expect(item.tags).toEqual(["database"]);
    expect(item.source).toBe("claude");
    expect(item.id).toMatch(/^[a-f0-9]{8}-use-postgresql$/);

    // Verify file exists
    const files = await fs.readdir(tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/\.md$/);
  });

  it("creates the directory if it doesn't exist", async () => {
    const nestedDir = path.join(tmpDir, "nested", "dir");
    const item = await writeMemory(nestedDir, {
      title: "Test",
      content: "Content",
    });

    expect(item.title).toBe("Test");
    const files = await fs.readdir(nestedDir);
    expect(files).toHaveLength(1);
  });

  it("defaults type to note", async () => {
    const item = await writeMemory(tmpDir, {
      title: "A note",
      content: "Just a note.",
    });

    expect(item.type).toBe("note");
  });
});

describe("readAllMemories", () => {
  it("reads all .md files", async () => {
    await writeMemory(tmpDir, { title: "First", content: "Content 1" });
    await writeMemory(tmpDir, { title: "Second", content: "Content 2" });

    const items = await readAllMemories(tmpDir);
    expect(items).toHaveLength(2);
  });

  it("returns empty array for non-existent directory", async () => {
    const items = await readAllMemories("/tmp/nonexistent-dir-12345");
    expect(items).toEqual([]);
  });

  it("skips non-md files", async () => {
    await writeMemory(tmpDir, { title: "Valid", content: "Content" });
    await fs.writeFile(path.join(tmpDir, "notes.txt"), "not a memory");

    const items = await readAllMemories(tmpDir);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Valid");
  });
});

describe("readMemory", () => {
  it("reads a specific memory by ID prefix", async () => {
    const written = await writeMemory(tmpDir, {
      title: "Find me",
      content: "Found!",
      tags: ["test"],
    });

    const idPrefix = written.id.split("-")[0];
    const found = await readMemory(tmpDir, idPrefix);

    expect(found).not.toBeNull();
    expect(found!.title).toBe("Find me");
    expect(found!.content).toBe("Found!");
  });

  it("returns null for non-existent ID", async () => {
    const found = await readMemory(tmpDir, "nonexistent");
    expect(found).toBeNull();
  });
});

describe("updateMemory", () => {
  it("updates title and content", async () => {
    const written = await writeMemory(tmpDir, {
      title: "Old title",
      content: "Old content",
      tags: ["original"],
    });

    const idPrefix = written.id.split("-")[0];
    const updated = await updateMemory(tmpDir, idPrefix, {
      title: "New title",
      content: "New content",
    });

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe("New title");
    expect(updated!.content).toBe("New content");
    expect(updated!.tags).toEqual(["original"]); // unchanged
  });

  it("updates tags without changing other fields", async () => {
    const written = await writeMemory(tmpDir, {
      type: "decision",
      title: "Keep this title",
      content: "Keep this content",
      tags: ["old-tag"],
    });

    const idPrefix = written.id.split("-")[0];
    const updated = await updateMemory(tmpDir, idPrefix, {
      tags: ["new-tag", "another"],
    });

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe("Keep this title");
    expect(updated!.content).toBe("Keep this content");
    expect(updated!.type).toBe("decision");
    expect(updated!.tags).toEqual(["new-tag", "another"]);
  });

  it("returns null for non-existent ID", async () => {
    const result = await updateMemory(tmpDir, "nonexistent", { title: "X" });
    expect(result).toBeNull();
  });

  it("preserves created timestamp but updates updated", async () => {
    const written = await writeMemory(tmpDir, {
      title: "Timestamp test",
      content: "Content",
    });

    const idPrefix = written.id.split("-")[0];
    const updated = await updateMemory(tmpDir, idPrefix, { content: "Changed" });

    expect(updated).not.toBeNull();
    expect(updated!.created).toBe(written.created);
    expect(updated!.updated).not.toBe(written.updated);
  });
});

describe("deleteMemory", () => {
  it("deletes a memory by ID prefix", async () => {
    const written = await writeMemory(tmpDir, {
      title: "Delete me",
      content: "Gone",
    });

    const idPrefix = written.id.split("-")[0];
    const deleted = await deleteMemory(tmpDir, idPrefix);
    expect(deleted).toBe(true);

    const items = await readAllMemories(tmpDir);
    expect(items).toHaveLength(0);
  });

  it("returns false for non-existent ID", async () => {
    const deleted = await deleteMemory(tmpDir, "nonexistent");
    expect(deleted).toBe(false);
  });
});
