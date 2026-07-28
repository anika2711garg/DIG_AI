import { describe, expect, it } from "vitest";

import { buildRepoMap, rankFiles } from "./localizer";

describe("buildRepoMap", () => {
  it("extracts top-level def/class signatures with line numbers", () => {
    const files = {
      "calc.py": "import math\n\ndef add(a, b):\n    return a + b\n\nclass Calculator:\n    def run(self):\n        pass\n",
    };
    expect(buildRepoMap(files)).toEqual([
      {
        path: "calc.py",
        symbols: [
          { kind: "def", name: "add", line: 3 },
          { kind: "class", name: "Calculator", line: 6 },
        ],
      },
    ]);
  });

  it("ignores indented (nested) definitions — top-level only", () => {
    const map = buildRepoMap({ "m.py": "class A:\n    def method(self):\n        pass\n" });
    expect(map[0]!.symbols).toEqual([{ kind: "class", name: "A", line: 1 }]);
  });

  it("skips non-Python files", () => {
    expect(buildRepoMap({ "server.js": "function f(){}" })).toEqual([]);
  });
});

describe("rankFiles", () => {
  const files = {
    "app/calc.py": "def add(a, b):\n    return a + b - 1\n",
    "app/util.py": "def helper():\n    return 1\n",
    "README.md": "This project does addition.\n",
  };

  it("ranks a stack-trace file first, above lexical matches", () => {
    const ranked = rankFiles(files, {
      title: "add is wrong",
      body: "addition broken",
      stackFrames: [{ file: "app/calc.py", line: 2, functionName: "add" }],
    });
    expect(ranked[0]!.path).toBe("app/calc.py");
    expect(ranked[0]!.score).toBeGreaterThanOrEqual(100);
    expect(ranked[0]!.reasons.some((r) => r.startsWith("stack trace"))).toBe(true);
  });

  it("falls back to lexical overlap when there is no traceback", () => {
    const ranked = rankFiles(files, {
      title: "addition returns wrong value",
      body: "the add function is broken",
      stackFrames: [],
    });
    expect(ranked[0]!.path).toBe("app/calc.py"); // matches 'add'/'addition'
    expect(ranked.map((r) => r.path)).not.toContain("app/util.py"); // no keyword hit
  });

  it("matches a frame by basename even if the path differs", () => {
    const ranked = rankFiles(files, {
      title: "x",
      body: "y",
      stackFrames: [{ file: "calc.py", line: 2 }], // bare basename
    });
    expect(ranked[0]!.path).toBe("app/calc.py");
  });

  it("produces deterministic, stable output", () => {
    const input = { title: "add", body: "add", stackFrames: [] };
    expect(rankFiles(files, input)).toEqual(rankFiles(files, input));
  });

  it("drops files with zero signal", () => {
    const ranked = rankFiles(files, { title: "zzz", body: "qqq", stackFrames: [] });
    expect(ranked).toEqual([]);
  });
});
