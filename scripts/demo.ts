/**
 * Watch the agent fix a bug end to end, on a seeded repo:
 *   set -a; source .env; set +a; pnpm demo
 *
 * Uses the real LLM (OpenRouter) + network-off E2B sandbox + Neon. No GitHub
 * needed — the issue + repo are seeded, exactly the "cached demo repo" approach.
 */
import { createDb, events, repos, runs, traces } from "@libs/db";
import { E2BSandbox, PYTEST_TEMPLATE } from "@libs/integrations/e2b";
import { LlmClient, openRouterGenerate } from "@libs/integrations/llm-client";
import { resolveRun } from "@libs/orchestrator/loop";
import type { RawIssue } from "@libs/services/ingestor";
import { loadConfig } from "@util/config";
import { eq } from "drizzle-orm";

const CALC_BUGGY = "def add(a, b):\n    return a + b - 1\n\n\ndef sub(a, b):\n    return a - b\n";

const ISSUE: RawIssue = {
  repo: "demo/calc",
  number: 1,
  title: "add() is off by one",
  body: [
    "Calling add() returns a result that's one too small.",
    "",
    ">>> from calc import add",
    ">>> add(2, 3)",
    "4",
    "",
    "Expected 5. It fails with:  AssertionError: assert 4 == 5",
  ].join("\n"),
  labels: ["bug"],
  comments: [],
};

const rule = (s: string) => console.log(`\n\x1b[36m── ${s} ──\x1b[0m`);

async function main() {
  const cfg = loadConfig();
  const { db, close } = createDb(cfg.databaseUrlDirect, { max: 2 });

  const [repo] = await db.insert(repos).values({ fullName: `demo/calc-${Date.now()}` }).returning();
  const [run] = await db
    .insert(runs)
    .values({ repoId: repo!.id, issueNumber: 1, budgetUsd: String(cfg.budgetUsdPerRun) })
    .returning();

  rule("ISSUE");
  console.log(`#${ISSUE.number}  ${ISSUE.title}\n${ISSUE.body}`);
  rule("BUGGY CODE (calc.py)");
  console.log(CALC_BUGGY.trimEnd());

  console.log("\n\x1b[2mrunning the agent…\x1b[0m");
  const result = await resolveRun(
    {
      db,
      llm: new LlmClient({
        db,
        models: { cheap: cfg.llmModelCheap, strong: cfg.llmModelStrong },
        generate: openRouterGenerate(cfg.openrouterApiKey),
      }),
      sandbox: new E2BSandbox(cfg.e2bApiKey),
      fetchIssue: async () => ISSUE,
      template: PYTEST_TEMPLATE,
      budgetUsd: cfg.budgetUsdPerRun,
      mode: cfg.defaultMode,
    },
    { runId: run!.id, repo: "demo/calc", issueNumber: 1, files: { "calc.py": CALC_BUGGY } },
  );

  const modelTraces = await db.select().from(traces).where(eq(traces.runId, run!.id));
  const out = (stage: string) =>
    (modelTraces.find((t) => t.name.startsWith(stage))?.outputJson as { output?: unknown })?.output;

  const repro = out("reproducing") as { testFileName?: string; testCode?: string } | undefined;
  if (repro?.testCode) {
    rule(`REPRODUCTION TEST the model wrote (${repro.testFileName})`);
    console.log(repro.testCode.trimEnd());
  }
  const patch = out("patching") as { edits?: { file: string; oldText: string; newText: string }[] } | undefined;
  if (patch?.edits) {
    rule("PATCH the model proposed");
    for (const e of patch.edits) console.log(`${e.file}:  "${e.oldText}"  →  "${e.newText}"`);
  }

  const timeline = await db.select().from(events).where(eq(events.runId, run!.id));
  rule("STATE TIMELINE");
  console.log("  " + timeline.map((e) => e.state).join(" → "));

  rule("RESULT");
  console.log(`  ${result.finalState}  ·  confidence: ${result.confidence ?? "—"}`);
  console.log(`  ${result.summary}`);

  // tidy up the demo rows
  await db.delete(runs).where(eq(runs.repoId, repo!.id));
  await db.delete(repos).where(eq(repos.id, repo!.id));
  await close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
