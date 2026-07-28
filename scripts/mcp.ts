/**
 * The issue-to-PR MCP server over stdio (add it to Claude Desktop / an IDE):
 *   set -a; source .env; set +a; pnpm mcp
 *
 * Exposes get_issue, run_tests, open_pull_request (code-gated), resolve_issue.
 * GitHub-backed tools (get_issue, resolve_issue's fetch, real PR creation) need
 * a GITHUB_TOKEN wired in; run_tests + the approval gate work without one.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createDb } from "@libs/db";
import { E2BSandbox, PYTEST_TEMPLATE } from "@libs/integrations/e2b";
import { LlmClient, openRouterGenerate } from "@libs/integrations/llm-client";
import { createMcpServer } from "@libs/mcp/server";
import { loadConfig } from "@util/config";

async function main() {
  const cfg = loadConfig();
  const { db } = createDb(cfg.databaseUrlDirect);

  const server = createMcpServer({
    db,
    sandbox: new E2BSandbox(cfg.e2bApiKey),
    llm: new LlmClient({
      db,
      models: { cheap: cfg.llmModelCheap, strong: cfg.llmModelStrong },
      generate: openRouterGenerate(cfg.openrouterApiKey),
    }),
    createPr: async () => {
      throw new Error("real GitHub PR creation not configured — set GITHUB_TOKEN and wire Octokit");
    },
    fetchIssue: async () => {
      throw new Error("GitHub issue fetch not configured — set GITHUB_TOKEN");
    },
    template: PYTEST_TEMPLATE,
    githubWritesEnabled: cfg.githubWritesEnabled,
    budgetUsd: cfg.budgetUsdPerRun,
  });

  await server.connect(new StdioServerTransport());
  // stdout is the protocol channel — log to stderr.
  process.stderr.write("issue-to-pr MCP server running on stdio\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
