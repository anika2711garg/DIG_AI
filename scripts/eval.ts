/**
 * Run the eval harness and write a report:
 *   set -a; source .env; set +a; pnpm eval
 *
 * Runs every seeded task through the real loop, scores each against its held-out
 * gold test, and prints + writes eval/report.{md,json}.
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createDb } from "@libs/db";
import { runEval, type EvalDeps } from "@libs/eval/harness";
import { buildReport, formatReportMarkdown } from "@libs/eval/report";
import { SEED_TASKS } from "@libs/eval/seed-tasks";
import { E2BSandbox } from "@libs/integrations/e2b";
import { LlmClient, openRouterGenerate } from "@libs/integrations/llm-client";
import { loadConfig } from "@util/config";

async function main() {
  const cfg = loadConfig();
  const { db, close } = createDb(cfg.databaseUrlDirect, { max: 4 });
  try {
    const deps: EvalDeps = {
      db,
      llm: new LlmClient({
        db,
        models: { cheap: cfg.llmModelCheap, strong: cfg.llmModelStrong },
        generate: openRouterGenerate(cfg.openrouterApiKey),
      }),
      sandbox: new E2BSandbox(cfg.e2bApiKey),
      budgetUsd: cfg.budgetUsdPerRun,
      mode: cfg.defaultMode,
    };

    console.log(`running eval on ${SEED_TASKS.length} tasks (concurrency 2)…\n`);
    const results = await runEval(deps, SEED_TASKS, 2);
    const report = buildReport(results);
    const md = formatReportMarkdown(report);

    console.log(md);
    mkdirSync("eval", { recursive: true });
    writeFileSync("eval/report.md", md);
    writeFileSync("eval/report.json", JSON.stringify(report, null, 2));
    console.log("wrote eval/report.md + eval/report.json");
  } finally {
    await close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
