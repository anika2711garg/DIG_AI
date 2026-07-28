import type { Confidence } from "@libs/core";
import type { TestCaseResult, TestReport } from "@util/junit";

/**
 * The reproduction grader — the signature gate, done by CODE not the model.
 *
 * A reproduction is only "strong" when a test genuinely FAILS (an assertion /
 * exception, not an import or collection error) AND the failure matches the
 * reported symptom. Anything else is downgraded honestly:
 *   - passed / skipped / not-found  → unreproduced (nothing reproduced)
 *   - error (import/syntax/typo)     → unreproduced (a broken test ≠ the bug)
 *   - failed, symptom matched        → strong
 *   - failed, symptom unmatched/none → weak
 */

export interface ReportedSymptom {
  /** Exception type the issue reports (e.g. "AssertionError", "KeyError"). */
  exceptionType?: string;
  /** Reported message / expected-vs-actual fragments (e.g. "assert 4 == 5"). */
  messagePatterns?: string[];
}

export interface ReproVerdict {
  confidence: Confidence;
  reason: string;
  matchedCase?: TestCaseResult;
}

/** The case the model's test produced: prefer an explicit match, else the first
 *  failing case, else the first errored case. */
function findTarget(report: TestReport, targetTestId?: string): TestCaseResult | undefined {
  if (targetTestId) {
    const explicit = report.cases.find((c) => c.id === targetTestId || c.name === targetTestId);
    if (explicit) return explicit;
  }
  return (
    report.cases.find((c) => c.status === "failed") ??
    report.cases.find((c) => c.status === "error")
  );
}

function failureText(c: TestCaseResult): string {
  return `${c.type ?? ""}\n${c.message ?? ""}\n${c.details ?? ""}`.toLowerCase();
}

function matchSymptom(c: TestCaseResult, symptom: ReportedSymptom): string[] {
  const hay = failureText(c);
  const hits: string[] = [];
  if (symptom.exceptionType && hay.includes(symptom.exceptionType.toLowerCase())) {
    hits.push(`exception ${symptom.exceptionType}`);
  }
  for (const p of symptom.messagePatterns ?? []) {
    if (p.trim().length > 0 && hay.includes(p.toLowerCase())) hits.push(`message "${p}"`);
  }
  return hits;
}

export function gradeReproduction(
  report: TestReport,
  symptom: ReportedSymptom,
  targetTestId?: string,
): ReproVerdict {
  const target = findTarget(report, targetTestId);
  if (!target) {
    return { confidence: "unreproduced", reason: "no failing test found in the report" };
  }
  if (target.status === "passed" || target.status === "skipped") {
    return {
      confidence: "unreproduced",
      reason: `test ${target.status} — did not reproduce the bug`,
      matchedCase: target,
    };
  }
  if (target.status === "error") {
    // Import/collection/syntax error — the test is broken, not the code.
    return {
      confidence: "unreproduced",
      reason: "test errored (import/collection/syntax) — not a genuine failure",
      matchedCase: target,
    };
  }

  // status === "failed": a genuine assertion/exception failure.
  const hits = matchSymptom(target, symptom);
  if (hits.length > 0) {
    return {
      confidence: "strong",
      reason: `fails for the reported reason (${hits.join(", ")})`,
      matchedCase: target,
    };
  }
  const hasSymptom =
    Boolean(symptom.exceptionType) || (symptom.messagePatterns?.some((p) => p.trim()) ?? false);
  return {
    confidence: "weak",
    reason: hasSymptom
      ? "fails, but not clearly for the reported reason"
      : "fails, but there is no reported symptom to match against",
    matchedCase: target,
  };
}

// Exception line in a Python traceback: `AssertionError: assert 4 == 5`
// (optionally pytest's `E   ` prefix). The LAST one is the actually-raised error.
const EXC_LINE = /^\s*(?:E\s+)?([A-Za-z_][\w.]*(?:Error|Exception|Warning))(?::\s*(.+))?\s*$/gm;

/** Extract the reported symptom (exception type + message fragments) from issue
 *  text or a traceback — used to reason-match a reproduction. Deterministic. */
export function extractSymptom(text: string): ReportedSymptom {
  let exceptionType: string | undefined;
  const patterns = new Set<string>();

  EXC_LINE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = EXC_LINE.exec(text)) !== null) {
    exceptionType = m[1];
    if (m[2]) patterns.add(m[2].trim());
  }
  for (const a of text.match(/assert [^\n]+/gi) ?? []) patterns.add(a.trim());

  return {
    ...(exceptionType ? { exceptionType } : {}),
    messagePatterns: [...patterns],
  };
}
