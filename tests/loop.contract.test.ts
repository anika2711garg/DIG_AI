import { createDb, events, repos, runs, traces, type Db } from "@libs/db";
import { E2BSandbox } from "@libs/integrations/e2b";
import { LlmClient, openRouterGenerate } from "@libs/integrations/llm-client";
import { resolveRun, type LoopDeps } from "@libs/orchestrator/loop";
import type { RawIssue } from "@libs/services/ingestor";
import { loadConfig } from "@util/config";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * The Phase-1 payoff: the REAL agent fixes a seeded bug end-to-end —
 * ingest → localize → reproduce → patch → verify → revert — using the real LLM
 * (OpenRouter), the real network-off E2B sandbox, and real Neon. Auto-skips
 * unless all three credentials are present.
 */
const hasAll = Boolean(
  process.env.OPENROUTER_API_KEY && process.env.E2B_API_KEY && process.env.DATABASE_URL_DIRECT,
);

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
    "Expected 5. A minimal check:",
    "",
    "    def test_add():",
    "        assert add(2, 3) == 5",
    "",
    "fails with:",
    "",
    "    AssertionError: assert 4 == 5",
  ].join("\n"),
  labels: ["bug"],
  comments: [],
};

describe.skipIf(!hasAll)("verified loop — live (real LLM + E2B + Neon)", () => {
  let db: Db;
  let close: () => Promise<void>;
  let deps: LoopDeps;
  let repoId: number;
  let runId: number;

  beforeAll(async () => {
    const cfg = loadConfig();
    ({ db, close } = createDb(cfg.databaseUrlDirect, { max: 2 }));
    deps = {
      db,
      llm: new LlmClient({
        db,
        models: { cheap: cfg.llmModelCheap, strong: cfg.llmModelStrong },
        generate: openRouterGenerate(cfg.openrouterApiKey),
      }),
      sandbox: new E2BSandbox(cfg.e2bApiKey),
      fetchIssue: async () => ISSUE,
      budgetUsd: cfg.budgetUsdPerRun,
      mode: "permissive",
    };
    const [repo] = await db.insert(repos).values({ fullName: `demo/calc-${Date.now()}` }).returning();
    repoId = repo!.id;
    const [run] = await db
      .insert(runs)
      .values({ repoId, issueNumber: 1, budgetUsd: String(cfg.budgetUsdPerRun) })
      .returning();
    runId = run!.id;
  });

  afterAll(async () => {
    if (repoId) {
      await db.delete(runs).where(eq(runs.repoId, repoId));
      await db.delete(repos).where(eq(repos.id, repoId));
    }
    await close?.();
  });

  it("fixes the seeded off-by-one bug end to end", async () => {
    const result = await resolveRun(deps, {
      runId,
      repo: "demo/calc",
      issueNumber: 1,
      files: { "calc.py": CALC_BUGGY },
    });

    const timeline = await db.select().from(events).where(eq(events.runId, runId));
    // eslint-disable-next-line no-console
    console.log(
      "\n  timeline: " + timeline.map((e) => e.state).join(" → ") + `\n  ${result.summary}\n`,
    );

    expect(result.finalState).toBe("awaiting_human");
    expect(["strong", "weak"]).toContain(result.confidence);

    const [row] = await db.select().from(runs).where(eq(runs.id, runId));
    expect(row!.state).toBe("awaiting_human");
    expect(row!.confidence).toBe(result.confidence);
    expect(Number(row!.spentUsd)).toBeGreaterThan(0);

    // two model calls were traced (reproduce + patch)
    const modelTraces = await db.select().from(traces).where(eq(traces.runId, runId));
    expect(modelTraces.filter((t) => t.kind === "model").length).toBeGreaterThanOrEqual(2);
  }, 240_000);
});
