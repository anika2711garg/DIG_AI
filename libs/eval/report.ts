import type { CalibrationBin, EvalReport, EvalTaskResult } from "./types";

/** Aggregate task results into the report. Pure. */
export function buildReport(results: EvalTaskResult[]): EvalReport {
  const total = results.length;
  const resolved = results.filter((r) => r.resolved).length;
  const strong = results.filter((r) => r.confidence === "strong");
  const strongResolved = strong.filter((r) => r.resolved).length;

  const taxonomy: Record<string, number> = {};
  for (const r of results) {
    if (r.failureType) taxonomy[r.failureType] = (taxonomy[r.failureType] ?? 0) + 1;
  }

  const calibration: CalibrationBin[] = ["strong", "weak", "unreproduced", "none"]
    .map((c): CalibrationBin => {
      const inBin = results.filter((r) => (r.confidence ?? "none") === c);
      const res = inBin.filter((r) => r.resolved).length;
      return { confidence: c, n: inBin.length, resolved: res, rate: inBin.length ? res / inBin.length : 0 };
    })
    .filter((b) => b.n > 0);

  const totalCostUsd = results.reduce((s, r) => s + r.costUsd, 0);
  const totalLatency = results.reduce((s, r) => s + r.latencyMs, 0);

  return {
    total,
    resolved,
    resolveRate: total ? resolved / total : 0,
    strongCount: strong.length,
    resolveRateWhenStrong: strong.length ? strongResolved / strong.length : 0,
    totalCostUsd,
    avgCostUsd: total ? totalCostUsd / total : 0,
    avgLatencyMs: total ? totalLatency / total : 0,
    taxonomy,
    calibration,
    results,
  };
}

const pct = (x: number): string => `${(x * 100).toFixed(0)}%`;
const usd = (x: number): string => `$${x.toFixed(4)}`;
const secs = (ms: number): string => `${(ms / 1000).toFixed(1)}s`;

export function formatReportMarkdown(report: EvalReport): string {
  const l: string[] = [];
  l.push("# Issue-to-PR — eval report", "");
  l.push(
    `**Resolved: ${report.resolved}/${report.total} (${pct(report.resolveRate)})**  ·  ` +
      `strong-repro: ${report.calibration.find((b) => b.confidence === "strong")?.resolved ?? 0}/${report.strongCount} (${pct(report.resolveRateWhenStrong)})  ·  ` +
      `cost/task: ${usd(report.avgCostUsd)}  ·  latency/task: ${secs(report.avgLatencyMs)}  ·  total: ${usd(report.totalCostUsd)}`,
    "",
    "> Dual-reported: overall *and* resolved-when-reproduction-strong. Seeded tasks, real LLM + network-off sandbox.",
    "",
  );

  l.push("## Calibration (stated confidence → actual resolution)", "");
  l.push("| confidence | n | resolved | rate |", "| --- | --: | --: | --: |");
  for (const b of report.calibration) l.push(`| ${b.confidence} | ${b.n} | ${b.resolved} | ${pct(b.rate)} |`);
  l.push("");

  l.push("## Failure taxonomy", "");
  const tax = Object.entries(report.taxonomy);
  if (tax.length === 0) {
    l.push("_no failed runs_", "");
  } else {
    l.push("| type | n |", "| --- | --: |");
    for (const [t, n] of tax.sort((a, b) => b[1] - a[1])) l.push(`| ${t} | ${n} |`);
    l.push("");
  }

  l.push("## Tasks", "");
  l.push(
    "| id | resolved | final state | confidence | failure | cost | latency |",
    "| --- | :-: | --- | --- | --- | --: | --: |",
  );
  for (const r of report.results) {
    l.push(
      `| ${r.taskId} | ${r.resolved ? "✅" : "❌"} | ${r.finalState} | ${r.confidence ?? "—"} | ${r.failureType ?? "—"} | ${usd(r.costUsd)} | ${secs(r.latencyMs)} |`,
    );
  }
  l.push("");
  return l.join("\n");
}
