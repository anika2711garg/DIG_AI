import { assertTransition, isTerminal, type FailureType, type RunState } from "@libs/core";
import { events, interventions, runs, type Db } from "@libs/db";
import { and, eq, isNull, sql } from "drizzle-orm";

import { StaleStateError } from "../orchestrator/state_machine";

/**
 * The single human gate. A stage that needs a person inserts an interventions
 * row AND parks the run at `awaiting_human` in ONE transaction; resolving it
 * (double-click safe via `resolved_at IS NULL`) sets the run's next state. The
 * gate is enforced in code — prompts play no role.
 */
export type InterventionKind = "approve_pr" | "review_repro" | "clarify_issue" | "abort";

/** Park a run for a human. Returns the new intervention id. Atomic. */
export async function requestIntervention(
  db: Db,
  runId: number,
  fromState: RunState,
  kind: InterventionKind,
  request: Record<string, unknown> = {},
): Promise<number> {
  assertTransition(fromState, "awaiting_human");
  const now = new Date();
  return db.transaction(async (tx) => {
    const parked = await tx
      .update(runs)
      .set({ state: "awaiting_human", version: sql`${runs.version} + 1`, updatedAt: now })
      .where(and(eq(runs.id, runId), eq(runs.state, fromState)))
      .returning({ id: runs.id });
    if (parked.length === 0) throw new StaleStateError(runId, fromState, "awaiting_human");

    await tx.insert(events).values({
      runId,
      type: "run.state.awaiting_human",
      state: "awaiting_human",
      dataJson: { from: fromState, to: "awaiting_human", kind },
    });
    const [iv] = await tx
      .insert(interventions)
      .values({ runId, stage: fromState, kind, requestJson: request, status: "pending" })
      .returning({ id: interventions.id });
    return iv!.id;
  });
}

export interface ResolveResult {
  resolved: boolean;
  alreadyResolved?: boolean;
  nextState?: RunState;
}

/** Resolve an intervention and advance the run. Idempotent: a second call
 *  (double-click) is a no-op that reports `alreadyResolved`. */
export async function resolveIntervention(
  db: Db,
  interventionId: number,
  resolution: { approved: boolean; response?: Record<string, unknown>; resolvedBy: string },
): Promise<ResolveResult> {
  const now = new Date();
  return db.transaction(async (tx) => {
    const [iv] = await tx
      .update(interventions)
      .set({
        status: "resolved",
        responseJson: { approved: resolution.approved, ...(resolution.response ?? {}) },
        resolvedAt: now,
        resolvedBy: resolution.resolvedBy,
      })
      .where(and(eq(interventions.id, interventionId), isNull(interventions.resolvedAt)))
      .returning();
    if (!iv) return { resolved: false, alreadyResolved: true };

    let to: RunState | null = null;
    let failureType: FailureType | undefined;
    if (iv.kind === "approve_pr") {
      if (resolution.approved) to = "opening_pr";
      else ((to = "failed"), (failureType = "rejected_by_human"));
    } else if (iv.kind === "abort") {
      to = "failed";
      failureType = "rejected_by_human";
    }
    // review_repro / clarify_issue re-enter a working state — added with those edges later.

    if (to) {
      assertTransition("awaiting_human", to);
      const advanced = await tx
        .update(runs)
        .set({
          state: to,
          version: sql`${runs.version} + 1`,
          updatedAt: now,
          ...(failureType ? { failureType } : {}),
          ...(isTerminal(to) ? { completedAt: now } : {}),
        })
        .where(and(eq(runs.id, iv.runId), eq(runs.state, "awaiting_human")))
        .returning({ id: runs.id });
      if (advanced.length === 0) throw new StaleStateError(iv.runId, "awaiting_human", to);

      await tx.insert(events).values({
        runId: iv.runId,
        type: `run.state.${to}`,
        state: to,
        dataJson: { from: "awaiting_human", to, intervention: interventionId, ...(failureType ? { failureType } : {}) },
      });
    }
    return { resolved: true, nextState: to ?? undefined };
  });
}
