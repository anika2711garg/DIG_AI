import { assertTransition, isTerminal, type FailureType, type RunState } from "@libs/core";
import type { Db } from "@libs/db";
import { events, runs } from "@libs/db";
import { and, eq, sql } from "drizzle-orm";

/**
 * Thrown when a run's current state no longer matches the expected `from` —
 * another worker already moved it, or the caller holds a stale view. This is the
 * optimistic-concurrency signal; the orchestrator treats it as "not mine".
 */
export class StaleStateError extends Error {
  constructor(
    readonly runId: number,
    readonly from: RunState,
    readonly to: RunState,
  ) {
    super(`Run #${runId}: cannot transition ${from} → ${to} — current state is not '${from}'`);
    this.name = "StaleStateError";
  }
}

export class StateMachineOrchestrator {
  constructor(private readonly db: Db) {}

  /**
   * Move a run from `from` to `to` — atomically, persist-before-side-effect.
   *
   * In ONE transaction:
   *   1. `assertTransition(from, to)` — the edge must be legal in code.
   *   2. `UPDATE runs … WHERE id = runId AND state = from` — the DB-level
   *      optimistic guard; also bumps `version` and stamps timestamps.
   *   3. 0 rows updated ⇒ {@link StaleStateError} (someone else moved it).
   *   4. append an audit event.
   *
   * The whole thing commits before any stage side effect runs, so a crash can
   * never leave the state advanced without its event, or vice versa.
   */
  async transition(
    runId: number,
    from: RunState,
    to: RunState,
    dataJson?: Record<string, unknown>,
    failureType?: FailureType,
  ): Promise<void> {
    assertTransition(from, to);
    const now = new Date();

    await this.db.transaction(async (tx) => {
      const updated = await tx
        .update(runs)
        .set({
          state: to,
          version: sql`${runs.version} + 1`,
          updatedAt: now,
          ...(failureType ? { failureType } : {}),
          ...(to === "ingesting" ? { startedAt: now } : {}),
          ...(isTerminal(to) ? { completedAt: now } : {}),
        })
        .where(and(eq(runs.id, runId), eq(runs.state, from)))
        .returning({ id: runs.id });

      if (updated.length === 0) {
        throw new StaleStateError(runId, from, to);
      }

      await tx.insert(events).values({
        runId,
        type: `run.state.${to}`,
        state: to,
        dataJson: {
          from,
          to,
          ...(failureType ? { failureType } : {}),
          ...(dataJson ?? {}),
        },
      });
    });
  }
}
