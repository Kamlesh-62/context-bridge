import fs from "node:fs/promises";
import path from "node:path";
import { findProjectRoot, resolveMemoryDir } from "./runtime.js";
import { writeMemory, ensureMemoryDir } from "./storage.js";

async function readPackageJson(
  projectRoot: string,
): Promise<{ name?: string; description?: string } | null> {
  try {
    const raw = await fs.readFile(path.join(projectRoot, "package.json"), "utf8");
    const pkg = JSON.parse(raw);
    return { name: pkg.name, description: pkg.description };
  } catch {
    return null;
  }
}

export async function runInit(): Promise<number> {
  const projectRoot = await findProjectRoot();
  const memoryDir = resolveMemoryDir(projectRoot);

  // eslint-disable-next-line no-console
  console.log(`\nProject: ${projectRoot}`);

  await ensureMemoryDir(memoryDir);

  // Check if memories already exist
  try {
    const files = await fs.readdir(memoryDir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));
    if (mdFiles.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`\nMemory dir already has ${mdFiles.length} file(s). Skipping init.`);
      return 0;
    }
  } catch {
    // directory is new, continue
  }

  // Build starter memory from project info
  const pkg = await readPackageJson(projectRoot);
  const projectName = pkg?.name || path.basename(projectRoot);
  const lines: string[] = [`Project: ${projectName}`];

  if (pkg?.description) {
    lines.push(`Description: ${pkg.description}`);
  }

  lines.push(`Root: ${projectRoot}`);
  lines.push("", "This is the first memory. Add more with the `remember` tool.");

  const item = await writeMemory(memoryDir, {
    type: "note",
    title: `Project overview: ${projectName}`,
    content: lines.join("\n"),
    tags: ["project", "overview"],
  });

  // eslint-disable-next-line no-console
  console.log(`Created: ${memoryDir}`);
  // eslint-disable-next-line no-console
  console.log(`Saved: ${item.title} -> ${item.id}.md`);
  // eslint-disable-next-line no-console
  console.log(`\nTry: "Show memory status"`);

  return 0;
}
