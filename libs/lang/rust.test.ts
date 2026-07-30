import { describe, expect, it } from "vitest";

import { rustAdapter as rs } from "./rust";

describe("rust adapter — parseStackFrames", () => {
  it("parses panic frames with file:line[:col]", () => {
    expect(rs.parseStackFrames("thread 'main' panicked at src/lib.rs:5:9")).toEqual([
      { file: "src/lib.rs", line: 5 },
    ]);
    expect(rs.parseStackFrames("   at ./src/calc.rs:12")).toEqual([{ file: "./src/calc.rs", line: 12 }]);
  });

  it("ignores non-Rust files", () => {
    expect(rs.parseStackFrames('  File "x.py", line 3')).toEqual([]);
  });
});

describe("rust adapter — extractSymptom", () => {
  it("captures a panic message", () => {
    const s = rs.extractSymptom("thread 'main' panicked at src/lib.rs:5: assertion failed: `(left == right)`");
    expect(s.exceptionType).toBe("panic");
    expect((s.messagePatterns ?? []).some((p) => /assertion failed/.test(p))).toBe(true);
  });
});

describe("rust adapter — topLevelSymbols", () => {
  it("extracts fns and types", () => {
    const src = "pub fn add(a: i32, b: i32) -> i32 {}\nfn helper() {}\npub struct Calc {}";
    expect(rs.topLevelSymbols(src)).toEqual([
      { kind: "fn", name: "add", line: 1 },
      { kind: "fn", name: "helper", line: 2 },
      { kind: "type", name: "Calc", line: 3 },
    ]);
  });
});

describe("rust adapter — meta", () => {
  it("emits a nextest command that produces .junit.xml", () => {
    const cmd = rs.testCommand();
    expect(cmd).toContain("cargo nextest run --profile ci");
    expect(cmd).toContain(".config/nextest.toml");
    expect(cmd).toContain("cp target/nextest/ci/junit.xml .junit.xml");
  });
});
