import { describe, expect, it } from "vitest";

import { buildReport, formatReportMarkdown } from "./report";
import type { EvalTaskResult } from "./types";

const r = (over: Partial<EvalTaskResult>): EvalTaskResult => ({
  taskId: "t",
  resolved: false,
  finalState: "failed",
  costUsd: 0.01,
  latencyMs: 1000,
  detail: "",
  ...over,
});

const results: EvalTaskResult[] = [
  r({ taskId: "a", resolved: true, finalState: "awaiting_human", confidence: "strong", costUsd: 0.005, latencyMs: 40000 }),
  r({ taskId: "b", resolved: true, finalState: "awaiting_human", confidence: "strong", costUsd: 0.007, latencyMs: 50000 }),
  r({ taskId: "c", resolved: false, finalState: "awaiting_human", confidence: "weak", costUsd: 0.006, latencyMs: 45000 }),
  r({ taskId: "d", resolved: false, finalState: "failed", failureType: "cant_reproduce", costUsd: 0.002, latencyMs: 20000 }),
];

describe("buildReport", () => {
  const report = buildReport(results);

  it("computes overall resolve rate", () => {
    expect(report).toMatchObject({ total: 4, resolved: 2 });
    expect(report.resolveRate).toBeCloseTo(0.5);
  });

  it("dual-reports resolve rate when reproduction was strong", () => {
    expect(report.strongCount).toBe(2);
    expect(report.resolveRateWhenStrong).toBeCloseTo(1.0);
  });

  it("bins the calibration curve by confidence", () => {
    expect(report.calibration.find((b) => b.confidence === "strong")).toMatchObject({ n: 2, resolved: 2, rate: 1 });
    expect(report.calibration.find((b) => b.confidence === "weak")).toMatchObject({ n: 1, resolved: 0, rate: 0 });
    expect(report.calibration.find((b) => b.confidence === "none")!.n).toBe(1);
    expect(report.calibration.find((b) => b.confidence === "unreproduced")).toBeUndefined(); // empty bin dropped
  });

  it("counts the failure taxonomy", () => {
    expect(report.taxonomy).toEqual({ cant_reproduce: 1 });
  });

  it("aggregates cost and latency", () => {
    expect(report.totalCostUsd).toBeCloseTo(0.02);
    expect(report.avgCostUsd).toBeCloseTo(0.005);
    expect(report.avgLatencyMs).toBeCloseTo(38750);
  });
});

describe("formatReportMarkdown", () => {
  it("renders the headline, calibration, taxonomy, and per-task table", () => {
    const md = formatReportMarkdown(buildReport(results));
    expect(md).toContain("Resolved: 2/4 (50%)");
    expect(md).toContain("strong-repro: 2/2 (100%)");
    expect(md).toContain("cant_reproduce");
    expect(md).toContain("| a | ✅ |");
  });
});
