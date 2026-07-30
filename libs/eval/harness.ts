import type { Mode } from "@libs/core";
import { repos, runs, type Db } from "@libs/db";
import type { E2BSandbox } from "@libs/integrations/e2b";
import { detectAdapter } from "@libs/lang/registry";
import type { LlmClient } from "@libs/integrations/llm-client";
import { resolveRun } from "@libs/orchestrator/loop";
import { eq } from "drizzle-orm";

import type { EvalTask, EvalTaskResult } from "./types";

export interface EvalDeps {
  db: Db;
  llm: LlmClient;
  sandbox: E2BSandbox;
  budgetUsd: number;
  mode?: Mode;
}

/** Run `fn` over `items` with bounded concurrency (kind to Postgres + E2B). */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    for (let i = next++; i < items.length; i = next++) {
      results[i] = await fn(items[i]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Run one task through the real loop, then score it against its held-out gold test. */
async function runTask(deps: EvalDeps, task: EvalTask): Promise<EvalTaskResult> {
  const [repo] = await deps.db
    .insert(repos)
    .values({ fullName: `${task.repo}-${task.id}-${Date.now()}` })
    .returning();
  const [run] = await deps.db
    .insert(runs)
    .values({ repoId: repo!.id, issueNumber: task.issue.number, budgetUsd: String(deps.budgetUsd) })
    .returning();

  const start = Date.now();
  let result;
  try {
    result = await resolveRun(
      {
        db: deps.db,
        llm: deps.llm,
        sandbox: deps.sandbox,
        fetchIssue: async () => task.issue,
        budgetUsd: deps.budgetUsd,
        mode: deps.mode ?? "permissive",
      },
      { runId: run!.id, repo: task.repo, issueNumber: task.issue.number, files: task.files },
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await deps.db.delete(runs).where(eq(runs.repoId, repo!.id));
    await deps.db.delete(repos).where(eq(repos.id, repo!.id));
    return {
      taskId: task.id,
      resolved: false,
      finalState: "failed",
      failureType: "infra_error",
      costUsd: 0,
      latencyMs: Date.now() - start,
      detail: `infra error: ${detail}`,
    };
  }
  const latencyMs = Date.now() - start;

  // Independent ground truth: the gold test the agent never saw, on its patch.
  let resolved = false;
  let detail = result.summary;
  if (result.finalState === "awaiting_human" && result.patchedFiles) {
    // Score with the SAME language the loop detected — gold test runs on the adapter's runtime.
    const adapter = detectAdapter(task.files);
    const gold = await deps.sandbox.run({
      template: adapter.e2bTemplate,
      networkEnabled: false,
      files: { ...result.patchedFiles, [task.gold.file]: task.gold.code },
      command: adapter.testCommand(task.gold.file),
    });
    const r = gold.report;
    resolved = Boolean(r && r.tests > 0 && r.failures === 0 && r.errors === 0);
    detail = resolved ? "gold test passed on the patched code" : "gold test did NOT pass";
  }

  await deps.db.delete(runs).where(eq(runs.repoId, repo!.id));
  await deps.db.delete(repos).where(eq(repos.id, repo!.id));

  return {
    taskId: task.id,
    resolved,
    finalState: result.finalState,
    confidence: result.confidence,
    failureType: result.failureType,
    costUsd: result.costUsd,
    latencyMs,
    detail,
  };
}

export async function runEval(
  deps: EvalDeps,
  tasks: EvalTask[],
  concurrency = 2,
): Promise<EvalTaskResult[]> {
  return mapLimit(tasks, concurrency, (t) => runTask(deps, t));
}
