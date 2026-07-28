import { createDb, events, repos, runs, type Db } from "@libs/db";
import { StaleStateError, StateMachineOrchestrator } from "@libs/orchestrator/state_machine";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Live integration test for the state-machine transition against real Neon.
 * Auto-skips without DATABASE_URL_DIRECT. Run with:
 *   set -a; source .env; set +a; pnpm test:db
 */
const hasDb = Boolean(process.env.DATABASE_URL_DIRECT);

describe.skipIf(!hasDb)("transition() — live Neon", () => {
  let db: Db;
  let close: () => Promise<void>;
  let orch: StateMachineOrchestrator;
  let repoId: number;
  let runId: number;

  beforeAll(async () => {
    ({ db, close } = createDb(process.env.DATABASE_URL_DIRECT!, { max: 1 }));
    orch = new StateMachineOrchestrator(db);
    const suffix = String(process.hrtime.bigint());
    const [repo] = await db.insert(repos).values({ fullName: `test/orch-${suffix}` }).returning();
    repoId = repo!.id;
    const [run] = await db
      .insert(runs)
      .values({ repoId, issueNumber: 1, budgetUsd: "2" })
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

  it("commits the state change + audit event atomically, bumping version", async () => {
    await orch.transition(runId, "created", "ingesting");

    const [run] = await db.select().from(runs).where(eq(runs.id, runId));
    expect(run!.state).toBe("ingesting");
    expect(run!.version).toBe(2);
    expect(run!.startedAt).not.toBeNull();

    const evs = await db.select().from(events).where(eq(events.runId, runId));
    const stamped = evs.find((e) => e.state === "ingesting");
    expect(stamped).toBeDefined();
    expect(stamped!.dataJson).toMatchObject({ from: "created", to: "ingesting" });
  });

  it("rejects a stale transition via the optimistic guard", async () => {
    // The run is now 'ingesting'; a second created→ingesting must fail.
    await expect(orch.transition(runId, "created", "ingesting")).rejects.toBeInstanceOf(
      StaleStateError,
    );
  });

  it("records a typed failure and stamps completedAt", async () => {
    await orch.transition(runId, "ingesting", "failed", { reason: "vague issue" }, "cant_reproduce");

    const [run] = await db.select().from(runs).where(eq(runs.id, runId));
    expect(run!.state).toBe("failed");
    expect(run!.failureType).toBe("cant_reproduce");
    expect(run!.completedAt).not.toBeNull();
  });

  it("won't move a terminal run (failed is a dead end)", async () => {
    await expect(orch.transition(runId, "failed", "opening_pr")).rejects.toBeTruthy();
  });
});
