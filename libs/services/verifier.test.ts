import type { TestCaseResult, TestReport, TestStatus } from "@util/junit";
import { describe, expect, it } from "vitest";

import { compareToBaseline, detectFlaky, verify } from "./verifier";

const c = (id: string, status: TestStatus): TestCaseResult => ({
  id,
  name: id,
  classname: "c",
  time: 0,
  status,
  message: null,
  type: null,
  details: null,
});

const report = (...cases: TestCaseResult[]): TestReport => ({
  tests: cases.length,
  passed: 0,
  failures: 0,
  errors: 0,
  skipped: 0,
  durationSec: 0,
  cases,
});

describe("compareToBaseline — baseline-aware", () => {
  it("flags a test that passed in baseline but now fails as a regression", () => {
    const cmp = compareToBaseline(report(c("t", "passed")), report(c("t", "failed")));
    expect(cmp.regressions).toEqual(["t"]);
  });

  it("does NOT count a pre-existing baseline failure against the fix", () => {
    const cmp = compareToBaseline(report(c("t", "failed")), report(c("t", "failed")));
    expect(cmp.regressions).toEqual([]);
    expect(cmp.preExistingFailures).toEqual(["t"]);
  });

  it("counts a brand-new failing test as a regression", () => {
    const cmp = compareToBaseline(report(), report(c("new", "error")));
    expect(cmp.regressions).toEqual(["new"]);
  });

  it("records a baseline failure that now passes as newly fixed", () => {
    const cmp = compareToBaseline(report(c("t", "failed")), report(c("t", "passed")));
    expect(cmp.newlyFixed).toEqual(["t"]);
  });
});

describe("detectFlaky", () => {
  it("finds tests whose status disagreed across runs", () => {
    expect(
      detectFlaky([report(c("a", "passed"), c("b", "passed")), report(c("a", "failed"), c("b", "passed"))]),
    ).toEqual(["a"]);
  });

  it("returns [] for consistent or single runs", () => {
    expect(detectFlaky([report(c("a", "passed"))])).toEqual([]);
    expect(detectFlaky([report(c("a", "passed")), report(c("a", "passed"))])).toEqual([]);
  });
});

describe("verify — the verdict", () => {
  const REPRO = "tests::repro";
  const baseline = report(c("suite::keep", "passed"));

  it("verifies when repro passes, no regressions, and revert fails", () => {
    const v = verify({
      reproTestId: REPRO,
      baseline,
      afterPatch: report(c("suite::keep", "passed"), c(REPRO, "passed")),
      afterRevert: report(c(REPRO, "failed")),
    });
    expect(v.verified).toBe(true);
    expect(v.reproFailsAfterRevert).toBe(true);
  });

  it("is not verified when the repro test doesn't pass after the patch", () => {
    const v = verify({
      reproTestId: REPRO,
      baseline,
      afterPatch: report(c("suite::keep", "passed"), c(REPRO, "failed")),
    });
    expect(v.verified).toBe(false);
    expect(v.failureType).toBeUndefined(); // fix didn't work → retry, not a typed death
  });

  it("fails tests_regressed when the patch breaks a previously-passing test", () => {
    const v = verify({
      reproTestId: REPRO,
      baseline,
      afterPatch: report(c("suite::keep", "failed"), c(REPRO, "passed")),
    });
    expect(v.verified).toBe(false);
    expect(v.failureType).toBe("tests_regressed");
    expect(v.regressions).toEqual(["suite::keep"]);
  });

  it("fails revert_check_failed when the repro still passes after revert", () => {
    const v = verify({
      reproTestId: REPRO,
      baseline,
      afterPatch: report(c("suite::keep", "passed"), c(REPRO, "passed")),
      afterRevert: report(c(REPRO, "passed")), // should have failed
    });
    expect(v.verified).toBe(false);
    expect(v.failureType).toBe("revert_check_failed");
  });

  it("ignores pre-existing failures and flaky tests", () => {
    const v = verify({
      reproTestId: REPRO,
      baseline: report(c("suite::keep", "passed"), c("suite::alreadyBad", "failed"), c("suite::flk", "passed")),
      afterPatch: report(c("suite::keep", "passed"), c("suite::alreadyBad", "failed"), c("suite::flk", "failed"), c(REPRO, "passed")),
      afterRevert: report(c(REPRO, "failed")),
      flaky: ["suite::flk"],
    });
    expect(v.verified).toBe(true);
    expect(v.regressions).toEqual([]);
  });
});
