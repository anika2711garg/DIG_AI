import type { TestCaseResult, TestReport } from "@util/junit";
import { describe, expect, it } from "vitest";

import { extractSymptom, gradeReproduction, type ReportedSymptom } from "./reproducer";

const mkCase = (over: Partial<TestCaseResult>): TestCaseResult => ({
  id: "tests/test_bug.py::test_repro",
  name: "test_repro",
  classname: "tests.test_bug",
  time: 0.01,
  status: "passed",
  message: null,
  type: null,
  details: null,
  ...over,
});

const report = (...cases: TestCaseResult[]): TestReport => ({
  tests: cases.length,
  passed: cases.filter((c) => c.status === "passed").length,
  failures: cases.filter((c) => c.status === "failed").length,
  errors: cases.filter((c) => c.status === "error").length,
  skipped: cases.filter((c) => c.status === "skipped").length,
  durationSec: 0,
  cases,
});

const symptom: ReportedSymptom = {
  exceptionType: "AssertionError",
  messagePatterns: ["assert 4 == 5"],
};

describe("gradeReproduction — the honest gate", () => {
  it("STRONG when the test fails for the reported reason", () => {
    const v = gradeReproduction(
      report(mkCase({ status: "failed", message: "assert 4 == 5", details: "E  AssertionError" })),
      symptom,
    );
    expect(v.confidence).toBe("strong");
    expect(v.matchedCase?.name).toBe("test_repro");
  });

  it("UNREPRODUCED when the test passes (nothing reproduced)", () => {
    const v = gradeReproduction(report(mkCase({ status: "passed" })), symptom);
    expect(v.confidence).toBe("unreproduced");
  });

  it("UNREPRODUCED when the test ERRORS (import/typo ≠ a genuine failure)", () => {
    const v = gradeReproduction(
      report(mkCase({ status: "error", type: "ImportError", message: "cannot import name 'foo'" })),
      symptom,
    );
    expect(v.confidence).toBe("unreproduced");
    expect(v.reason).toMatch(/errored/);
  });

  it("WEAK when it fails but not for the reported reason", () => {
    const v = gradeReproduction(
      report(mkCase({ status: "failed", message: "ZeroDivisionError: division by zero" })),
      symptom,
    );
    expect(v.confidence).toBe("weak");
  });

  it("WEAK when it fails but there is no reported symptom to match", () => {
    const v = gradeReproduction(
      report(mkCase({ status: "failed", message: "assert 1 == 2" })),
      { messagePatterns: [] },
    );
    expect(v.confidence).toBe("weak");
    expect(v.reason).toMatch(/no reported symptom/);
  });

  it("UNREPRODUCED when the report has no failing test at all", () => {
    expect(gradeReproduction(report(), symptom).confidence).toBe("unreproduced");
  });

  it("prefers the explicitly targeted test id", () => {
    const v = gradeReproduction(
      report(
        mkCase({ id: "a::other", name: "other", status: "failed", message: "assert 4 == 5" }),
        mkCase({ id: "a::mine", name: "mine", status: "failed", message: "nope" }),
      ),
      symptom,
      "a::mine",
    );
    expect(v.matchedCase?.name).toBe("mine");
    expect(v.confidence).toBe("weak"); // 'mine' fails but doesn't match the symptom
  });
});

describe("extractSymptom", () => {
  it("pulls the raised exception type + message from a traceback", () => {
    const s = extractSymptom(
      'Traceback (most recent call last):\n  File "calc.py", line 2, in add\nAssertionError: assert 4 == 5',
    );
    expect(s.exceptionType).toBe("AssertionError");
    expect(s.messagePatterns).toContain("assert 4 == 5");
  });

  it("takes the LAST exception (the actually-raised one)", () => {
    const s = extractSymptom("During handling ...\nValueError: bad\n\nKeyError: 'missing'");
    expect(s.exceptionType).toBe("KeyError");
  });

  it("returns no exception type when there is no traceback", () => {
    expect(extractSymptom("it just returns the wrong number").exceptionType).toBeUndefined();
  });
});
