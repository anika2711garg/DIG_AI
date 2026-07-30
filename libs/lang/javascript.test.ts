import { describe, expect, it } from "vitest";

import { javascriptAdapter as js } from "./javascript";

describe("javascript adapter — parseStackFrames", () => {
  it("parses V8 frames with a function name", () => {
    expect(js.parseStackFrames("    at add (/app/calc.js:2:10)")).toEqual([
      { file: "/app/calc.js", line: 2, functionName: "add" },
    ]);
  });

  it("parses a frame with no function name and a .ts extension", () => {
    expect(js.parseStackFrames("    at /src/util.ts:7:1")).toEqual([{ file: "/src/util.ts", line: 7 }]);
  });

  it("ignores non-JS files", () => {
    expect(js.parseStackFrames('  File "x.py", line 3')).toEqual([]);
  });
});

describe("javascript adapter — extractSymptom", () => {
  it("pulls the error type and message", () => {
    const s = js.extractSymptom("TypeError: x is not a function\n    at foo (a.js:1:1)");
    expect(s.exceptionType).toBe("TypeError");
    expect(s.messagePatterns).toContain("x is not a function");
  });

  it("captures vitest assertion phrasing", () => {
    const s = js.extractSymptom("AssertionError: expected 4 to be 5");
    expect(s.exceptionType).toBe("AssertionError");
    expect((s.messagePatterns ?? []).some((p) => /expected 4 to be 5/.test(p))).toBe(true);
  });
});

describe("javascript adapter — topLevelSymbols", () => {
  it("extracts exported and bare declarations", () => {
    const src = "export function add(a, b) {}\nconst x = 1\nexport class Calc {}\nfunction helper() {}";
    expect(js.topLevelSymbols(src)).toEqual([
      { kind: "function", name: "add", line: 1 },
      { kind: "class", name: "Calc", line: 3 },
      { kind: "function", name: "helper", line: 4 },
    ]);
  });
});

describe("javascript adapter — meta", () => {
  it("builds a vitest command that emits JUnit", () => {
    expect(js.testCommand("repro.test.js")).toBe(
      "vitest run repro.test.js --reporter=junit --outputFile=.junit.xml",
    );
    expect(js.testCommand()).toBe("vitest run --reporter=junit --outputFile=.junit.xml");
  });
});
