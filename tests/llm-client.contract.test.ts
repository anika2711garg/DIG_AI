import { BudgetExceededError, type BudgetState } from "@libs/core";
import { createDb, repos, runs, traces, type Db } from "@libs/db";
import { LLMStructuredOutputError, LlmClient, type LlmGenerate } from "@libs/integrations/llm-client";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

/**
 * Live integration test for the traced LLM client against real Neon — with a
 * FAKE provider, so it needs the DB but NOT an OpenRouter key. Proves the plan's
 * invariant: every call is traced and every cost lands on runs.spent_usd.
 */
const hasDb = Boolean(process.env.DATABASE_URL_DIRECT);
const okSchema = z.object({ files: z.array(z.string()) });
const models = { cheap: "test/cheap", strong: "test/strong" };
const budget: BudgetState = { limitUsd: 2, spentUsd: 0 };
const base = { system: "s", prompt: "p", schema: okSchema, budget } as const;

describe.skipIf(!hasDb)("LlmClient — live Neon (fake provider)", () => {
  let db: Db;
  let close: () => Promise<void>;
  let repoId: number;
  let runId: number;

  const traceCount = async () =>
    (await db.select().from(traces).where(eq(traces.runId, runId))).length;
  const lastTrace = async () => {
    const rows = await db.select().from(traces).where(eq(traces.runId, runId));
    return rows[rows.length - 1];
  };
  const spent = async () =>
    Number((await db.select().from(runs).where(eq(runs.id, runId)))[0]!.spentUsd);

  beforeAll(async () => {
    ({ db, close } = createDb(process.env.DATABASE_URL_DIRECT!, { max: 1 }));
    const suffix = String(process.hrtime.bigint());
    const [repo] = await db.insert(repos).values({ fullName: `test/llm-${suffix}` }).returning();
    repoId = repo!.id;
    const [run] = await db.insert(runs).values({ repoId, issueNumber: 1, budgetUsd: "2" }).returning();
    runId = run!.id;
  });

  afterAll(async () => {
    if (repoId) {
      await db.delete(runs).where(eq(runs.repoId, repoId));
      await db.delete(repos).where(eq(repos.id, repoId));
    }
    await close?.();
  });

  it("validates output, routes cheap, writes a trace, charges spent_usd", async () => {
    const gen: LlmGenerate = async () => ({
      text: JSON.stringify({ files: ["a.py"] }),
      usage: { tokensIn: 1000, tokensOut: 500 },
    });
    const client = new LlmClient({ db, models, generate: gen });

    const before = await traceCount();
    const r = await client.call({ ...base, runId, stage: "localizing" });

    expect(r.data.files).toEqual(["a.py"]);
    expect(r.model).toBe("test/cheap"); // localizing → cheap
    expect(r.costUsd).toBeCloseTo(0.0028);
    expect(await traceCount()).toBe(before + 1);
    expect(await spent()).toBeCloseTo(0.0028, 4);
  });

  it("rejects an over-budget call before touching the model or DB", async () => {
    let called = 0;
    const gen: LlmGenerate = async () => {
      called++;
      return { text: "{}", usage: { tokensIn: 0, tokensOut: 0 } };
    };
    const client = new LlmClient({ db, models, generate: gen });

    const before = await traceCount();
    await expect(
      client.call({
        ...base,
        runId,
        stage: "patching",
        budget: { limitUsd: 2, spentUsd: 2 },
        estimatedCostUsd: 0.5,
      }),
    ).rejects.toBeInstanceOf(BudgetExceededError);

    expect(called).toBe(0);
    expect(await traceCount()).toBe(before);
  });

  it("traces + charges even when the output fails schema validation", async () => {
    const gen: LlmGenerate = async () => ({
      text: JSON.stringify({ wrong: true }),
      usage: { tokensIn: 200, tokensOut: 100 },
    });
    const client = new LlmClient({ db, models, generate: gen });

    const before = await traceCount();
    const spentBefore = await spent();
    await expect(client.call({ ...base, runId, stage: "localizing" })).rejects.toBeInstanceOf(
      LLMStructuredOutputError,
    );

    expect(await traceCount()).toBe(before + 1);
    expect(await spent()).toBeGreaterThan(spentBefore);
    const t = await lastTrace();
    expect(t!.errorType).toBe("schema_mismatch");
    expect(t!.success).toBe("false");
  });

  it("errors and traces on non-JSON output", async () => {
    const gen: LlmGenerate = async () => ({
      text: "not json at all",
      usage: { tokensIn: 10, tokensOut: 5 },
    });
    const client = new LlmClient({ db, models, generate: gen });

    await expect(client.call({ ...base, runId, stage: "localizing" })).rejects.toBeInstanceOf(
      LLMStructuredOutputError,
    );
    expect((await lastTrace())!.errorType).toBe("invalid_json");
  });
});
