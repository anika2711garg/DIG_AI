import { createDb, interventions, prs, repos, runs, type Db } from "@libs/db";
import { requestIntervention, resolveIntervention } from "@libs/services/interventions";
import {
  KillSwitchError,
  NotApprovedError,
  openPullRequest,
  type CreateDraftPr,
} from "@libs/services/pr";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Live Neon tests for the human gate + code-gated, idempotent draft PR.
 * Auto-skips without DATABASE_URL_DIRECT. The GitHub call is a fake — no token.
 */
const hasDb = Boolean(process.env.DATABASE_URL_DIRECT);
const PR = { owner: "o", repo: "r", title: "fix(#1)", body: "b", head: "h", base: "main" };

describe.skipIf(!hasDb)("PR gate + interventions — live Neon", () => {
  let db: Db;
  let close: () => Promise<void>;
  let repoId: number;

  const mkRun = async (state: "verifying") =>
    (
      await db.insert(runs).values({ repoId, issueNumber: 1, budgetUsd: "2", state }).returning()
    )[0]!.id;
  const stateOf = async (id: number) =>
    (await db.select().from(runs).where(eq(runs.id, id)))[0]!.state;
  const approvedRun = async () => {
    const id = await mkRun("verifying");
    const iv = await requestIntervention(db, id, "verifying", "approve_pr", {});
    await resolveIntervention(db, iv, { approved: true, resolvedBy: "x" });
    return id;
  };

  beforeAll(async () => {
    ({ db, close } = createDb(process.env.DATABASE_URL_DIRECT!, { max: 5 }));
    const [repo] = await db.insert(repos).values({ fullName: `test/pr-${process.hrtime.bigint()}` }).returning();
    repoId = repo!.id;
  });

  afterAll(async () => {
    if (repoId) {
      await db.delete(runs).where(eq(runs.repoId, repoId));
      await db.delete(repos).where(eq(repos.id, repoId));
    }
    await close?.();
  });

  describe("approval → PR happy path", () => {
    let runId: number;
    let ivId: number;
    let calls = 0;
    const createPr: CreateDraftPr = async () => ((calls += 1), { number: 4242, url: "https://gh/pull/4242" });

    beforeAll(async () => {
      runId = await mkRun("verifying");
    });

    it("requestIntervention parks the run + creates a pending approve_pr", async () => {
      ivId = await requestIntervention(db, runId, "verifying", "approve_pr", { note: "review" });
      expect(await stateOf(runId)).toBe("awaiting_human");
      const [iv] = await db.select().from(interventions).where(eq(interventions.id, ivId));
      expect(iv).toMatchObject({ kind: "approve_pr", status: "pending" });
    });

    it("refuses to open a PR while the approval is still pending", async () => {
      await expect(
        openPullRequest(db, createPr, runId, { githubWritesEnabled: true, pr: PR }),
      ).rejects.toBeInstanceOf(NotApprovedError);
      expect(calls).toBe(0);
    });

    it("resolveIntervention(approved) advances the run to opening_pr", async () => {
      const res = await resolveIntervention(db, ivId, { approved: true, resolvedBy: "atul" });
      expect(res).toMatchObject({ resolved: true, nextState: "opening_pr" });
      expect(await stateOf(runId)).toBe("opening_pr");
    });

    it("resolving again is a double-click no-op", async () => {
      const res = await resolveIntervention(db, ivId, { approved: true, resolvedBy: "atul" });
      expect(res).toMatchObject({ resolved: false, alreadyResolved: true });
    });

    it("opens the PR once and completes the run", async () => {
      const r = await openPullRequest(db, createPr, runId, { githubWritesEnabled: true, pr: PR });
      expect(r).toMatchObject({ prNumber: 4242, reused: false });
      expect(calls).toBe(1);
      expect(await stateOf(runId)).toBe("done");
    });

    it("is idempotent — a second open reuses, no second API call", async () => {
      const r = await openPullRequest(db, createPr, runId, { githubWritesEnabled: true, pr: PR });
      expect(r).toMatchObject({ prNumber: 4242, reused: true });
      expect(calls).toBe(1);
    });
  });

  it("kill switch blocks the write even when approved", async () => {
    const runId = await approvedRun();
    let calls = 0;
    const createPr: CreateDraftPr = async () => ((calls += 1), { number: 1, url: "" });
    await expect(
      openPullRequest(db, createPr, runId, { githubWritesEnabled: false, pr: PR }),
    ).rejects.toBeInstanceOf(KillSwitchError);
    expect(calls).toBe(0);
  }, 20_000);

  it("a rejected approval fails the run (rejected_by_human)", async () => {
    const runId = await mkRun("verifying");
    const iv = await requestIntervention(db, runId, "verifying", "approve_pr", {});
    const res = await resolveIntervention(db, iv, { approved: false, resolvedBy: "x" });
    expect(res.nextState).toBe("failed");
    const [row] = await db.select().from(runs).where(eq(runs.id, runId));
    expect(row!.failureType).toBe("rejected_by_human");
  }, 20_000);

  it("crash before the API is safe — retry reconciles with ZERO duplicate rows", async () => {
    const runId = await approvedRun();
    let calls = 0;
    const crashThenOk: CreateDraftPr = async () => {
      calls += 1;
      if (calls === 1) throw new Error("crash mid-open");
      return { number: 77, url: "u77" };
    };
    await expect(
      openPullRequest(db, crashThenOk, runId, { githubWritesEnabled: true, pr: PR }),
    ).rejects.toThrow("crash mid-open");
    const retry = await openPullRequest(db, crashThenOk, runId, { githubWritesEnabled: true, pr: PR });
    expect(retry).toMatchObject({ prNumber: 77, reused: false });
    expect(calls).toBe(2);

    const rows = await db.select().from(prs).where(eq(prs.runId, runId));
    expect(rows).toHaveLength(1); // exactly one tracking row — no duplicate PR
    expect(rows[0]!.externalPrNumber).toBe(77);
  }, 20_000);
});
