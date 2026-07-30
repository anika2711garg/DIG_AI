import { describe, expect, it } from "vitest";

import { goAdapter as go } from "./go";

describe("go adapter — parseStackFrames", () => {
  it("parses panic/test frames with file:line", () => {
    expect(go.parseStackFrames("\tcalc.go:12 +0x1d")).toEqual([{ file: "calc.go", line: 12 }]);
    expect(go.parseStackFrames("    /app/pkg/util.go:7")).toEqual([{ file: "/app/pkg/util.go", line: 7 }]);
  });

  it("ignores non-Go files", () => {
    expect(go.parseStackFrames('  File "x.py", line 3')).toEqual([]);
  });
});

describe("go adapter — extractSymptom", () => {
  it("captures a panic message", () => {
    const s = go.extractSymptom("panic: runtime error: index out of range");
    expect(s.exceptionType).toBe("panic");
    expect((s.messagePatterns ?? []).some((p) => /index out of range/.test(p))).toBe(true);
  });

  it("captures testing 'expected/got' phrasing", () => {
    const s = go.extractSymptom("calc_test.go:10: expected 5, got 4");
    expect((s.messagePatterns ?? []).some((p) => /expected 5/.test(p))).toBe(true);
  });
});

describe("go adapter — topLevelSymbols", () => {
  it("extracts funcs, methods and types", () => {
    const src = "package calc\n\nfunc Add(a, b int) int {}\nfunc (c Calc) Do() {}\ntype Calc struct {}";
    expect(go.topLevelSymbols(src)).toEqual([
      { kind: "func", name: "Add", line: 3 },
      { kind: "func", name: "Do", line: 4 },
      { kind: "type", name: "Calc", line: 5 },
    ]);
  });
});

describe("go adapter — meta", () => {
  it("runs the package via gotestsum and writes JUnit", () => {
    expect(go.testCommand()).toBe("gotestsum --junitfile .junit.xml -- ./...");
    expect(go.testCommand("repro_test.go")).toBe("gotestsum --junitfile .junit.xml -- ./...");
  });
});
