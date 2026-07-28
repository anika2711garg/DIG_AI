import type { FailureType } from "@libs/core";
import type { TestReport, TestStatus } from "@util/junit";

/**
 * The Verifier's deterministic core. It judges a fix against a pre-recorded
 * BASELINE (the suite on clean code) so pre-existing failures never count
 * against the patch — only NEW regressions do. It also detects flaky tests
 * (reruns that disagree) and enforces the revert check: after un-applying the
 * patch, the reproduction test must fail again, proving it pins the bug.
 *
 * Wrong rarely and loudly, never wrong silently.
 */

const isFailing = (s: TestStatus): boolean => s === "failed" || s === "error";

function statusMap(report: TestReport): Map<string, TestStatus> {
  return new Map(report.cases.map((c) => [c.id, c.status]));
}

const statusOf = (report: TestReport, id: string): TestStatus | undefined =>
  report.cases.find((c) => c.id === id)?.status;

export interface BaselineComparison {
  /** Passing/new in baseline → now failing. These count against the fix. */
  regressions: string[];
  /** Already failing in baseline → still failing. Do NOT count. */
  preExistingFailures: string[];
  /** Failing in baseline → now passing. The fix helping. */
  newlyFixed: string[];
}

export function compareToBaseline(baseline: TestReport, afterPatch: TestReport): BaselineComparison {
  const before = statusMap(baseline);
  const cmp: BaselineComparison = { regressions: [], preExistingFailures: [], newlyFixed: [] };

  for (const c of afterPatch.cases) {
    const was = before.get(c.id);
    const wasFailing = was !== undefined && isFailing(was);
    if (isFailing(c.status)) {
      if (wasFailing) cmp.preExistingFailures.push(c.id);
      else cmp.regressions.push(c.id); // passing or new → now failing
    } else if (c.status === "passed" && wasFailing) {
      cmp.newlyFixed.push(c.id);
    }
  }
  return cmp;
}

/** Tests whose status disagreed across repeated identical runs. */
export function detectFlaky(runs: TestReport[]): string[] {
  if (runs.length < 2) return [];
  const byId = new Map<string, Set<TestStatus>>();
  for (const r of runs) {
    for (const c of r.cases) {
      const set = byId.get(c.id) ?? new Set<TestStatus>();
      set.add(c.status);
      byId.set(c.id, set);
    }
  }
  return [...byId].filter(([, statuses]) => statuses.size > 1).map(([id]) => id);
}

export interface VerifyInput {
  reproTestId: string;
  baseline: TestReport;
  afterPatch: TestReport;
  /** Repro test run after un-applying the patch (the revert check). Optional. */
  afterRevert?: TestReport;
  /** Test ids known to be flaky — excluded from the regression judgment. */
  flaky?: string[];
}

export interface VerifyVerdict {
  verified: boolean;
  failureType?: FailureType;
  reason: string;
  reproPassesAfterPatch: boolean;
  regressions: string[];
  reproFailsAfterRevert?: boolean;
}

export function verify(input: VerifyInput): VerifyVerdict {
  const flaky = new Set(input.flaky ?? []);
  const reproStatus = statusOf(input.afterPatch, input.reproTestId);
  const reproPassesAfterPatch = reproStatus === "passed";

  const cmp = compareToBaseline(input.baseline, input.afterPatch);
  const regressions = cmp.regressions.filter((id) => id !== input.reproTestId && !flaky.has(id));

  if (!reproPassesAfterPatch) {
    return {
      verified: false,
      reason: `reproduction test did not pass after the patch (status: ${reproStatus ?? "absent"})`,
      reproPassesAfterPatch,
      regressions,
    };
  }

  if (regressions.length > 0) {
    return {
      verified: false,
      failureType: "tests_regressed",
      reason: `patch regressed ${regressions.length} test(s): ${regressions.join(", ")}`,
      reproPassesAfterPatch,
      regressions,
    };
  }

  if (input.afterRevert) {
    const revertStatus = statusOf(input.afterRevert, input.reproTestId);
    const reproFailsAfterRevert = revertStatus !== undefined && isFailing(revertStatus);
    if (!reproFailsAfterRevert) {
      return {
        verified: false,
        failureType: "revert_check_failed",
        reason: `after reverting the patch, the repro test did not fail again (status: ${revertStatus ?? "absent"}) — it does not pin the bug`,
        reproPassesAfterPatch,
        regressions,
        reproFailsAfterRevert,
      };
    }
    return {
      verified: true,
      reason: "repro passes, no regressions, revert-check confirms the test pins the bug",
      reproPassesAfterPatch,
      regressions,
      reproFailsAfterRevert,
    };
  }

  return {
    verified: true,
    reason: "repro passes, no regressions (revert-check not run)",
    reproPassesAfterPatch,
    regressions,
  };
}
