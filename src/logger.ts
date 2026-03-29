/** Log to stderr (required for MCP stdio servers). */
export function log(...args: unknown[]): void {
  console.error("[context-bridge]", ...args);
}
