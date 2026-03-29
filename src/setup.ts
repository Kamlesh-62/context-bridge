import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { findProjectRoot } from "./runtime.js";

function buildServerId(projectRoot: string): string {
  const projectName = path.basename(projectRoot).toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return `${projectName}-context-bridge`;
}

type CliName = "claude" | "gemini" | "codex";

function parseSetupArgs(argv: string[]): { clis: CliName[]; help: boolean } {
  const clis: CliName[] = [];
  let help = false;

  for (const arg of argv) {
    switch (arg) {
      case "--claude":
        clis.push("claude");
        break;
      case "--gemini":
        clis.push("gemini");
        break;
      case "--codex":
        clis.push("codex");
        break;
      case "--help":
      case "-h":
        help = true;
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        break;
    }
  }

  // Default: all CLIs
  if (clis.length === 0 && !help) {
    clis.push("claude", "gemini", "codex");
  }

  return { clis, help };
}

async function configureClaude(projectRoot: string, serverId: string): Promise<void> {
  const configPath = path.join(projectRoot, ".mcp.json");

  let config: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      config = parsed as Record<string, unknown>;
    }
  } catch {
    // File doesn't exist or can't be parsed — start fresh
  }

  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    config.mcpServers = {};
  }

  (config.mcpServers as Record<string, unknown>)[serverId] = {
    command: "npx",
    args: ["-y", "context-bridge-mcp"],
  };

  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  console.log(`  Claude Code -> ${configPath}`); // eslint-disable-line no-console
}

function runShellCommand(
  cmd: string,
  args: string[],
  cwd: string,
  quiet = false,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: quiet ? "ignore" : "inherit" });

    child.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(new Error(`"${cmd}" not found — is it installed?`));
        return;
      }
      reject(err);
    });

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function configureGemini(projectRoot: string, serverId: string): Promise<void> {
  // Remove first (ignore errors if not exists)
  try {
    await runShellCommand("gemini", ["mcp", "remove", serverId], projectRoot, true);
  } catch {
    // ignore
  }
  await runShellCommand(
    "gemini",
    ["mcp", "add", serverId, "npx", "--", "-y", "context-bridge-mcp"],
    projectRoot,
  );
  console.log(`  Gemini CLI -> configured`); // eslint-disable-line no-console
}

async function configureCodex(projectRoot: string, serverId: string): Promise<void> {
  // Remove first (ignore errors if not exists)
  try {
    await runShellCommand("codex", ["mcp", "remove", serverId], projectRoot, true);
  } catch {
    // ignore
  }
  await runShellCommand(
    "codex",
    ["mcp", "add", serverId, "--", "npx", "-y", "context-bridge-mcp"],
    projectRoot,
  );
  console.log(`  Codex CLI -> configured`); // eslint-disable-line no-console
}

function printSetupHelp(): void {
  // eslint-disable-next-line no-console
  console.log(
    `
context-bridge setup — Auto-configure your AI CLIs

Usage:
  context-bridge setup            Configure all CLIs
  context-bridge setup --claude    Only Claude Code
  context-bridge setup --gemini    Only Gemini CLI
  context-bridge setup --codex     Only Codex CLI

What it does:
  Claude Code — creates/updates .mcp.json in your project
  Gemini CLI  — runs "gemini mcp add"
  Codex CLI   — runs "codex mcp add"
`.trim(),
  );
}

export async function runSetup(argv: string[]): Promise<number> {
  const { clis, help } = parseSetupArgs(argv);

  if (help) {
    printSetupHelp();
    return 0;
  }

  const projectRoot = await findProjectRoot();
  const serverId = buildServerId(projectRoot);
  // eslint-disable-next-line no-console
  console.log(`\nProject: ${projectRoot}\nServer:  ${serverId}\n`);

  let failures = 0;

  for (const cli of clis) {
    try {
      switch (cli) {
        case "claude":
          await configureClaude(projectRoot, serverId);
          break;
        case "gemini":
          await configureGemini(projectRoot, serverId);
          break;
        case "codex":
          await configureCodex(projectRoot, serverId);
          break;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ${cli}: ${msg}`);
      failures++;
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    failures === 0 ? '\nDone! Try: "Show memory status"' : `\nFinished with ${failures} error(s).`,
  );
  return failures > 0 ? 1 : 0;
}
