import type { RunState } from "@libs/core";
import type { Db } from "@libs/db";
import { sql } from "drizzle-orm";

/**
 * The claim loop. Postgres IS the queue — no Celery/Redis. A worker atomically
 * claims the oldest runnable run with FOR UPDATE SKIP LOCKED, so concurrent
 * workers never collide, and a run whose claim went stale (a crashed worker) is
 * reclaimable after `staleMinutes`.
 */

export interface ClaimedRun {
  id: number;
  repoId: number;
  issueNumber: number;
  state: RunState;
}

/** Runs in these states are not claimable: terminal, or parked for a human. */
const UNCLAIMABLE = ["done", "failed", "cancelled", "awaiting_human"] as const;

const DEFAULT_STALE_MINUTES = 10;

interface ClaimRow {
  id: number;
  repo_id: number;
  issue_number: number;
  state: RunState;
}

/**
 * Atomically claim the oldest runnable run for `workerId`. Returns null if none
 * is available. Uses a single `UPDATE … WHERE id = (SELECT … FOR UPDATE SKIP
 * LOCKED LIMIT 1)` so the select-lock-update is one atomic step.
 */
export async function claimNextRun(
  db: Db,
  workerId: string,
  staleMinutes: number = DEFAULT_STALE_MINUTES,
): Promise<ClaimedRun | null> {
  const unclaimable = sql.join(
    UNCLAIMABLE.map((s) => sql`${s}`),
    sql`, `,
  );
  const result = await db.execute(sql`
    UPDATE runs
    SET claimed_by = ${workerId}, claimed_at = now(), updated_at = now()
    WHERE id = (
      SELECT id FROM runs
      WHERE state NOT IN (${unclaimable})
        AND (claimed_at IS NULL OR claimed_at < now() - (${staleMinutes}::int * interval '1 minute'))
      ORDER BY created_at
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id, repo_id, issue_number, state
  `);

  const row = (result as unknown as ClaimRow[])[0];
  if (!row) return null;
  return {
    id: Number(row.id),
    repoId: Number(row.repo_id),
    issueNumber: Number(row.issue_number),
    state: row.state,
  };
}

/** Release a run's claim (on graceful shutdown, or after parking it). */
export async function releaseRun(db: Db, runId: number): Promise<void> {
  await db.execute(sql`UPDATE runs SET claimed_by = NULL, claimed_at = NULL WHERE id = ${runId}`);
}
