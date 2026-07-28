import { createDb, repos, runs, type Db } from "@libs/db";
import { claimNextRun, releaseRun } from "@libs/orchestrator/worker";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Live integration test for the FOR UPDATE SKIP LOCKED claim loop against Neon.
 * Uses a small connection pool so concurrent claims run on separate sessions —
 * the only way to actually exercise SKIP LOCKED. Auto-skips without DATABASE_URL.
 */
const hasDb = Boolean(process.env.DATABASE_URL_DIRECT);

describe.skipIf(!hasDb)("claimNextRun() — live Neon (SKIP LOCKED)", () => {
  let db: Db;
  let close: () => Promise<void>;
  let repoId: number;
  let runA: number;
  let runB: number;

  beforeAll(async () => {
    // max > 1 so Promise.all claims use distinct connections (real concurrency).
    ({ db, close } = createDb(process.env.DATABASE_URL_DIRECT!, { max: 4 }));
    const suffix = String(process.hrtime.bigint());
    const [repo] = await db.insert(repos).values({ fullName: `test/claim-${suffix}` }).returning();
    repoId = repo!.id;
    const mkRun = (state?: "awaiting_human") =>
      db
        .insert(runs)
        .values({ repoId, issueNumber: 1, budgetUsd: "2", ...(state ? { state } : {}) })
        .returning({ id: runs.id });
    runA = (await mkRun())[0]!.id;
    runB = (await mkRun())[0]!.id;
    await mkRun("awaiting_human"); // parked — must never be claimed
  });

  afterAll(async () => {
    if (repoId) {
      await db.delete(runs).where(eq(runs.repoId, repoId));
      await db.delete(repos).where(eq(repos.id, repoId));
    }
    await close?.();
  });

  it("hands concurrent workers distinct runs, never the parked one", async () => {
    const [c1, c2] = await Promise.all([claimNextRun(db, "w1"), claimNextRun(db, "w2")]);
    expect(c1).not.toBeNull();
    expect(c2).not.toBeNull();
    expect(c1!.id).not.toBe(c2!.id); // SKIP LOCKED → no collision
    expect(new Set([c1!.id, c2!.id])).toEqual(new Set([runA, runB]));
  });

  it("returns null when only fresh-claimed or parked runs remain", async () => {
    // runA and runB are now claimed (fresh); the only other run is parked.
    const c3 = await claimNextRun(db, "w3");
    expect(c3).toBeNull();
  });

  it("reclaims a run after its claim is released", async () => {
    await releaseRun(db, runA);
    const c = await claimNextRun(db, "w4");
    expect(c).not.toBeNull();
    expect(c!.id).toBe(runA);
  });
});
