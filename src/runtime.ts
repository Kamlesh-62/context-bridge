import fs from "node:fs/promises";
import path from "node:path";
import { CONFIG } from "./config.js";

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Find the project root directory.
 * Priority:
 *  1. MEMORY_PROJECT_ROOT env var
 *  2. Nearest ancestor containing .git
 *  3. Current working directory
 */
export async function findProjectRoot(): Promise<string> {
  const explicit = process.env.MEMORY_PROJECT_ROOT;
  if (explicit?.trim()) return path.resolve(explicit.trim());

  let dir = process.cwd();
  for (;;) {
    try {
      const stat = await fs.stat(path.join(dir, ".git"));
      if (stat.isDirectory() || stat.isFile()) return dir;
    } catch {
      // keep walking up
    }
    const parent = path.dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
}

/** Resolve the .ai/memory directory path for a project root. */
export function resolveMemoryDir(projectRoot: string): string {
  const envPath = process.env.MEMORY_DIR_PATH;
  if (envPath?.trim()) {
    return path.isAbsolute(envPath.trim())
      ? envPath.trim()
      : path.join(projectRoot, envPath.trim());
  }
  return path.join(projectRoot, CONFIG.memoryDir);
}
