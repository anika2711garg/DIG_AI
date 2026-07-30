import { repos, runs, type Db } from "@libs/db";
import type { E2BSandbox } from "@libs/integrations/e2b";
import { detectAdapter } from "@libs/lang/registry";
import type { LlmClient } from "@libs/integrations/llm-client";
import { resolveRun } from "@libs/orchestrator/loop";
import { ingest, type IssueFetcher } from "@libs/services/ingestor";
import { openPullRequest, type CreateDraftPr, type DraftPrRequest } from "@libs/services/pr";
import { eq } from "drizzle-orm";
import { z } from "zod";

/**
 * The MCP tool set — the ONLY way a model/client touches the world. Crucially,
 * `open_pull_request` calls the SAME code-gated function as everything else, so
 * an MCP client cannot bypass the human approval gate: the check reads the DB,
 * not the tool arguments.
 */
export interface McpDeps {
  db: Db;
  sandbox: E2BSandbox;
  llm: LlmClient;
  createPr: CreateDraftPr;
  fetchIssue: IssueFetcher;
  githubWritesEnabled: boolean;
  budgetUsd: number;
}

export interface McpTool {
  description: string;
  /** Zod raw shape — McpServer.registerTool converts it to JSON Schema. */
  inputShape: z.ZodRawShape;
  handler: (input: unknown) => Promise<unknown>;
}

function tool<S extends z.ZodRawShape>(
  description: string,
  inputShape: S,
  handler: (input: z.infer<z.ZodObject<S>>) => Promise<unknown>,
): McpTool {
  return { description, inputShape, handler: handler as (input: unknown) => Promise<unknown> };
}

export function buildTools(deps: McpDeps): Record<string, McpTool> {
  return {
    get_issue: tool(
      "Fetch and structure a GitHub issue: title, body, parsed stack frames, and the injection screen.",
      { repo: z.string(), issueNumber: z.number().int() },
      async ({ repo, issueNumber }) => ingest(await deps.fetchIssue(repo, issueNumber)),
    ),

    run_tests: tool(
      "Run the repo's test suite in a NETWORK-OFF sandbox; the language (pytest/vitest/…) is auto-detected from the files. Returns a structured TestReport. Verdicts come from code, never the model.",
      { files: z.record(z.string()), command: z.string().optional() },
      async ({ files, command }) => {
        const adapter = detectAdapter(files);
        const r = await deps.sandbox.run({
          template: adapter.e2bTemplate,
          networkEnabled: false,
          files,
          command: command ?? adapter.testCommand(),
        });
        return { exitCode: r.exitCode, timedOut: r.timedOut, report: r.report };
      },
    ),

    open_pull_request: tool(
      "Open a DRAFT pull request for a run. CODE-GATED: physically requires a resolved human approval and the kill switch — the arguments cannot bypass it.",
      {
        runId: z.number().int(),
        owner: z.string(),
        repo: z.string(),
        title: z.string(),
        body: z.string(),
        head: z.string(),
        base: z.string().default("main"),
      },
      async ({ runId, owner, repo, title, body, head, base }) => {
        const pr: DraftPrRequest = { owner, repo, title, body, head, base };
        return openPullRequest(deps.db, deps.createPr, runId, {
          githubWritesEnabled: deps.githubWritesEnabled,
          pr,
        });
      },
    ),

    resolve_issue: tool(
      "Drive the whole loop for an issue: ingest → localize → reproduce → patch → verify → revert. Parks at awaiting_human for approval.",
      { repo: z.string(), issueNumber: z.number().int(), files: z.record(z.string()) },
      async ({ repo, issueNumber, files }) => {
        let repoRow = (await deps.db.select().from(repos).where(eq(repos.fullName, repo)))[0];
        if (!repoRow) {
          repoRow = (await deps.db.insert(repos).values({ fullName: repo }).returning())[0];
        }
        const [run] = await deps.db
          .insert(runs)
          .values({ repoId: repoRow!.id, issueNumber, budgetUsd: String(deps.budgetUsd) })
          .returning();
        return resolveRun(
          {
            db: deps.db,
            llm: deps.llm,
            sandbox: deps.sandbox,
            fetchIssue: deps.fetchIssue,
            budgetUsd: deps.budgetUsd,
            mode: "permissive",
          },
          { runId: run!.id, repo, issueNumber, files },
        );
      },
    ),
  };
}
