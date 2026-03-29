#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import process from "node:process";
import { startServer } from "./server/index.js";
import { log } from "./logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));
const VERSION: string = pkg.version;

async function run(): Promise<void> {
  const arg = process.argv[2]?.toLowerCase();

  if (arg === "--version" || arg === "-v") {
    console.log(VERSION); // eslint-disable-line no-console
    return;
  }

  if (arg === "--help" || arg === "-h" || arg === "help") {
    printHelp();
    return;
  }

  if (!arg || arg === "serve") {
    await startServer();
    return;
  }

  if (arg === "setup") {
    const { runSetup } = await import("./setup.js");
    const code = await runSetup(process.argv.slice(3));
    if (code !== 0) process.exitCode = code;
    return;
  }

  if (arg === "init") {
    const { runInit } = await import("./init.js");
    const code = await runInit();
    if (code !== 0) process.exitCode = code;
    return;
  }

  log(`unknown command: "${arg}"`);
  printHelp();
  process.exitCode = 1;
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log(
    `
context-bridge — Shared project memory for AI coding CLIs

Usage:
  context-bridge           Start the MCP server (default)
  context-bridge setup     Auto-configure your AI CLIs
  context-bridge init      Create .ai/memory/ with a starter memory
  context-bridge --help    Show this message
  context-bridge --version Show version

Tools available via MCP:
  remember   Save something to project memory
  recall     Search and retrieve memories
  memory     List, update, or delete memories
  export     Back up all memories as JSON
  import     Restore memories from a backup
`.trim(),
  );
}

run().catch((err) => {
  log("fatal:", err);
  process.exit(1);
});
