import { events, interventions, prs, runs, type Db } from "@libs/db";
import { and, eq, sql } from "drizzle-orm";

/**
 * The PR code gate. `open_pull_request` PHYSICALLY requires an approval record
 * and passes the kill switch — a confused or compromised model cannot bypass it,
 * because prompts play no role here. And every external write goes through the
 * `prs` table's UNIQUE idempotency key, inserted BEFORE the API call: a crash
 * can never post twice.
 *
 * The GitHub call is injected (`CreateDraftPr`) — a fake in tests, real Octokit
 * in production — so the whole gate is testable with no token.
 */
export class NotApprovedError extends Error {
  constructor(readonly runId: number) {
    super(`run #${runId}: no resolved + approved approve_pr intervention — refusing to open a PR`);
    this.name = "NotApprovedError";
  }
}

export class KillSwitchError extends Error {
  constructor() {
    super("GitHub writes are disabled (kill switch)");
    this.name = "KillSwitchError";
  }
}

export interface DraftPrRequest {
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string;
  base: string;
}

export interface DraftPrResponse {
  number: number;
  url: string;
}

export type CreateDraftPr = (req: DraftPrRequest) => Promise<DraftPrResponse>;

export interface OpenPrResult {
  prNumber: number;
  url: string;
  /** True if a PR already existed for this run (idempotent no-op). */
  reused: boolean;
}

async function isApproved(db: Db, runId: number): Promise<boolean> {
  const rows = await db
    .select()
    .from(interventions)
    .where(
      and(
        eq(interventions.runId, runId),
        eq(interventions.kind, "approve_pr"),
        eq(interventions.status, "resolved"),
      ),
    );
  return rows.some((r) => (r.responseJson as { approved?: boolean } | null)?.approved === true);
}

export async function openPullRequest(
  db: Db,
  createPr: CreateDraftPr,
  runId: number,
  opts: { githubWritesEnabled: boolean; pr: DraftPrRequest },
): Promise<OpenPrResult> {
  // 1. Approval gate — enforced in code.
  if (!(await isApproved(db, runId))) throw new NotApprovedError(runId);

  // 2. Kill switch.
  if (!opts.githubWritesEnabled) throw new KillSwitchError();

  // 3. Idempotency: claim the key row BEFORE any external write.
  const key = `pr:run:${runId}`;
  let row = (await db.select().from(prs).where(eq(prs.idempotencyKey, key)))[0];
  if (row?.externalPrNumber != null) {
    return { prNumber: row.externalPrNumber, url: row.url ?? "", reused: true };
  }
  if (!row) {
    try {
      row = (await db.insert(prs).values({ runId, idempotencyKey: key, status: "draft" }).returning())[0];
    } catch {
      // Concurrent claim — re-read and reuse if it already opened.
      row = (await db.select().from(prs).where(eq(prs.idempotencyKey, key)))[0];
      if (row?.externalPrNumber != null) {
        return { prNumber: row.externalPrNumber, url: row.url ?? "", reused: true };
      }
    }
  }

  // 4. The ONLY external write. (A crash here leaves a draft row with no number;
  //    the retry above re-reads it and re-calls — never a second tracking row.)
  const pr = await createPr(opts.pr);
  await db
    .update(prs)
    .set({ externalPrNumber: pr.number, url: pr.url, status: "opened", updatedAt: new Date() })
    .where(eq(prs.id, row!.id));

  // 5. Complete the run.
  await completeRun(db, runId);
  return { prNumber: pr.number, url: pr.url, reused: false };
}

async function completeRun(db: Db, runId: number): Promise<void> {
  const now = new Date();
  const done = await db
    .update(runs)
    .set({ state: "done", version: sql`${runs.version} + 1`, completedAt: now, updatedAt: now })
    .where(and(eq(runs.id, runId), eq(runs.state, "opening_pr")))
    .returning({ id: runs.id });
  if (done.length > 0) {
    await db.insert(events).values({
      runId,
      type: "run.state.done",
      state: "done",
      dataJson: { from: "opening_pr", to: "done" },
    });
  }
}
