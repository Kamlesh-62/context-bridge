import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { writeMemory, readAllMemories, readMemory, deleteMemory } from "../../src/storage.js";

let memoryDir: string;

beforeEach(async () => {
  memoryDir = await fs.mkdtemp(path.join(os.tmpdir(), "integration-test-"));
});

afterEach(async () => {
  await fs.rm(memoryDir, { recursive: true, force: true });
});

describe("full round-trip", () => {
  it("remember -> recall -> delete workflow", async () => {
    // 1. Save three memories
    await writeMemory(memoryDir, {
      type: "decision",
      title: "Use PostgreSQL for database",
      content: "PostgreSQL is better for our relational data model.",
      tags: ["database", "backend"],
      source: "claude",
    });

    await writeMemory(memoryDir, {
      type: "fact",
      title: "API runs on port 3000",
      content: "The Express server listens on port 3000 by default.",
      tags: ["api", "backend"],
      source: "codex",
    });

    await writeMemory(memoryDir, {
      type: "architecture",
      title: "Monorepo with turborepo",
      content: "We use turborepo for our monorepo setup with apps/ and packages/.",
      tags: ["build", "infrastructure"],
      source: "gemini",
    });

    // 2. Read all
    const all = await readAllMemories(memoryDir);
    expect(all).toHaveLength(3);

    // 3. Verify types are correct
    const types = all.map((item) => item.type).sort();
    expect(types).toEqual(["architecture", "decision", "fact"]);

    // 4. Verify sources are preserved
    const sources = all.map((item) => item.source).sort();
    expect(sources).toEqual(["claude", "codex", "gemini"]);

    // 5. Read one by ID
    const firstId = all[0].id;
    const found = await readMemory(memoryDir, firstId);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(all[0].id);

    // 6. Delete one
    const deleted = await deleteMemory(memoryDir, firstId);
    expect(deleted).toBe(true);

    // 7. Verify count decreased
    const remaining = await readAllMemories(memoryDir);
    expect(remaining).toHaveLength(2);
  });

  it("handles concurrent writes to different files", async () => {
    const writes = Array.from({ length: 10 }, (_, i) =>
      writeMemory(memoryDir, {
        title: `Memory ${i}`,
        content: `Content for memory ${i}`,
        tags: [`tag${i}`],
      }),
    );

    await Promise.all(writes);

    const all = await readAllMemories(memoryDir);
    expect(all).toHaveLength(10);
  });

  it("preserves markdown content through write/read cycle", async () => {
    const markdownContent = `## Setup Instructions

1. Install dependencies: \`npm install\`
2. Run the server: \`npm start\`

\`\`\`bash
export PORT=3000
npm run dev
\`\`\`

> Important: Always use the development server for local testing.`;

    const written = await writeMemory(memoryDir, {
      type: "note",
      title: "Dev setup guide",
      content: markdownContent,
      tags: ["docs", "setup"],
    });

    const idPrefix = written.id;
    const read = await readMemory(memoryDir, idPrefix);

    expect(read).not.toBeNull();
    expect(read!.content).toBe(markdownContent);
  });
});
