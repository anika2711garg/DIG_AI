import type { Confidence, FailureType, RunState } from "@libs/core";
import type { RawIssue } from "@libs/services/ingestor";

/**
 * An eval task: the buggy repo + issue the agent SEES, and a held-out gold test
 * it never sees (SWE-bench's FAIL_TO_PASS model). A task is "resolved" only when
 * the gold test passes on the agent's patched code — independent ground truth,
 * not the agent's own verdict.
 */
export interface EvalTask {
  id: string;
  repo: string;
  issue: RawIssue;
  files: Record<string, string>;
  /** Held-out test: passes ONLY when the bug is truly fixed. */
  gold: { file: string; code: string };
  /** Notes on what the task exercises (for the report). */
  note?: string;
}

export interface EvalTaskResult {
  taskId: string;
  /** Gold test passes on the agent's patched code. */
  resolved: boolean;
  finalState: RunState;
  confidence?: Confidence;
  failureType?: FailureType;
  costUsd: number;
  latencyMs: number;
  detail: string;
}

export interface CalibrationBin {
  confidence: string;
  n: number;
  resolved: number;
  rate: number;
}

export interface EvalReport {
  total: number;
  resolved: number;
  resolveRate: number;
  /** Dual report: resolve rate among tasks the agent reproduced STRONGLY. */
  strongCount: number;
  resolveRateWhenStrong: number;
  totalCostUsd: number;
  avgCostUsd: number;
  avgLatencyMs: number;
  /** failureType → count, across failed runs. */
  taxonomy: Record<string, number>;
  /** Stated confidence vs actual resolution — the calibration curve. */
  calibration: CalibrationBin[];
  results: EvalTaskResult[];
}
