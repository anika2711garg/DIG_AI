import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { buildTools, type McpDeps } from "./tools";

/**
 * Wire the tool registry into an MCP server. Any MCP client (Claude, IDEs) can
 * drive the engine through these tools — and `open_pull_request` still calls the
 * code-gated function, so the human gate holds no matter who calls it.
 */
export function createMcpServer(deps: McpDeps): McpServer {
  const server = new McpServer({ name: "issue-to-pr", version: "0.0.0" });

  for (const [name, t] of Object.entries(buildTools(deps))) {
    server.registerTool(name, { description: t.description, inputSchema: t.inputShape }, async (args) => {
      try {
        const result = await t.handler(args);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    });
  }

  return server;
}
