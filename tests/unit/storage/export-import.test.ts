import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  writeMemory,
  readAllMemories,
  exportMemories,
  importMemories,
} from "../../../src/storage.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "transfer-test-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("exportMemories", () => {
  it("exports all memories as JSON", async () => {
    await writeMemory(tmpDir, { title: "First", content: "Content 1", tags: ["a"] });
    await writeMemory(tmpDir, { title: "Second", content: "Content 2", type: "decision" });

    const json = await exportMemories(tmpDir);
    const data = JSON.parse(json);

    expect(data.version).toBe(1);
    expect(data.exported).toBeDefined();
    expect(data.memories).toHaveLength(2);
    expect(data.memories[0].title).toBeDefined();
    expect(data.memories[1].title).toBeDefined();
  });

  it("exports empty array for empty directory", async () => {
    const json = await exportMemories(tmpDir);
    const data = JSON.parse(json);

    expect(data.memories).toEqual([]);
  });
});

describe("importMemories", () => {
  it("imports memories from JSON", async () => {
    const exportData = JSON.stringify({
      version: 1,
      memories: [
        { title: "Imported 1", content: "Content 1", type: "fact", tags: ["test"] },
        { title: "Imported 2", content: "Content 2", type: "decision" },
      ],
    });

    const count = await importMemories(tmpDir, exportData);
    expect(count).toBe(2);

    const items = await readAllMemories(tmpDir);
    expect(items).toHaveLength(2);
  });

  it("skips duplicates by title", async () => {
    await writeMemory(tmpDir, { title: "Already exists", content: "Original" });

    const exportData = JSON.stringify({
      version: 1,
      memories: [
        { title: "Already exists", content: "Duplicate" },
        { title: "New one", content: "Fresh" },
      ],
    });

    const count = await importMemories(tmpDir, exportData);
    expect(count).toBe(1);

    const items = await readAllMemories(tmpDir);
    expect(items).toHaveLength(2);
  });

  it("handles case-insensitive duplicate detection", async () => {
    await writeMemory(tmpDir, { title: "Use PostgreSQL", content: "Content" });

    const exportData = JSON.stringify({
      version: 1,
      memories: [{ title: "use postgresql", content: "Duplicate" }],
    });

    const count = await importMemories(tmpDir, exportData);
    expect(count).toBe(0);
  });

  it("throws on invalid format", async () => {
    await expect(importMemories(tmpDir, '{"foo": "bar"}')).rejects.toThrow("Invalid export format");
  });

  it("roundtrips through export + import", async () => {
    await writeMemory(tmpDir, {
      title: "Decision A",
      content: "We decided A",
      type: "decision",
      tags: ["arch"],
    });
    await writeMemory(tmpDir, {
      title: "Fact B",
      content: "B is true",
      type: "fact",
    });

    const json = await exportMemories(tmpDir);

    // Import into a fresh directory
    const tmpDir2 = await fs.mkdtemp(path.join(os.tmpdir(), "transfer-test2-"));
    try {
      const count = await importMemories(tmpDir2, json);
      expect(count).toBe(2);

      const items = await readAllMemories(tmpDir2);
      expect(items).toHaveLength(2);

      const titles = items.map((i) => i.title).sort();
      expect(titles).toEqual(["Decision A", "Fact B"]);
    } finally {
      await fs.rm(tmpDir2, { recursive: true, force: true });
    }
  });
});
