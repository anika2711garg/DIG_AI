import { describe, expect, it } from "vitest";

import { applyEditBlocks, type ApplyFail, type ApplyOk } from "./patcher";

const files = () => ({
  "app/calc.py": "def add(a, b):\n    return a + b - 1\n",
  "app/util.py": "X = 1\nY = 1\n",
});

const ok = (r: ReturnType<typeof applyEditBlocks>): ApplyOk => {
  if (!r.ok) throw new Error(`expected ok, got: ${r.reason}`);
  return r;
};
const bad = (r: ReturnType<typeof applyEditBlocks>): ApplyFail => {
  if (r.ok) throw new Error("expected failure");
  return r;
};

describe("applyEditBlocks — happy path", () => {
  it("applies a unique edit and reports the changed file", () => {
    const r = ok(
      applyEditBlocks(files(), [
        { file: "app/calc.py", oldText: "return a + b - 1", newText: "return a + b" },
      ]),
    );
    expect(r.files["app/calc.py"]).toBe("def add(a, b):\n    return a + b\n");
    expect(r.changedFiles).toEqual(["app/calc.py"]);
    expect(r.sensitiveFiles).toEqual([]);
  });

  it("applies edits across multiple files", () => {
    const r = ok(
      applyEditBlocks(files(), [
        { file: "app/calc.py", oldText: "a + b - 1", newText: "a + b" },
        { file: "app/util.py", oldText: "X = 1", newText: "X = 2" },
      ]),
    );
    expect(r.changedFiles.sort()).toEqual(["app/calc.py", "app/util.py"]);
    expect(r.files["app/util.py"]).toBe("X = 2\nY = 1\n");
  });

  it("inserts newText literally (no $&/$1 interpolation)", () => {
    const r = ok(
      applyEditBlocks({ "a.py": "x = 1\n" }, [
        { file: "a.py", oldText: "x = 1", newText: "x = '$&$1\\0'" },
      ]),
    );
    expect(r.files["a.py"]).toBe("x = '$&$1\\0'\n");
  });

  it("flags a changed sensitive file", () => {
    const r = ok(
      applyEditBlocks({ ".github/workflows/ci.yml": "on: push\n" }, [
        { file: ".github/workflows/ci.yml", oldText: "on: push", newText: "on: pull_request" },
      ]),
    );
    expect(r.sensitiveFiles).toEqual([".github/workflows/ci.yml"]);
  });
});

describe("applyEditBlocks — typed failures (never silent)", () => {
  it("fails when oldText is not found (no whole-file overwrite)", () => {
    const r = bad(
      applyEditBlocks(files(), [
        { file: "app/calc.py", oldText: "return a * b", newText: "return a + b" },
      ]),
    );
    expect(r.failureType).toBe("patch_apply_failed");
    expect(r.reason).toMatch(/not found/);
  });

  it("fails when oldText is ambiguous (multiple matches)", () => {
    const r = bad(
      applyEditBlocks({ "d.py": "= 1\n= 1\n" }, [{ file: "d.py", oldText: "= 1", newText: "= 2" }]),
    );
    expect(r.reason).toMatch(/matches 2 times/);
  });

  it("fails when the file is missing", () => {
    const r = bad(applyEditBlocks(files(), [{ file: "nope.py", oldText: "x", newText: "y" }]));
    expect(r.reason).toMatch(/file not found/);
  });

  it("fails on an empty oldText", () => {
    const r = bad(applyEditBlocks(files(), [{ file: "app/calc.py", oldText: "", newText: "y" }]));
    expect(r.reason).toMatch(/empty oldText/);
  });

  it("rejects a path-traversal target", () => {
    const r = bad(
      applyEditBlocks(files(), [{ file: "../../etc/passwd", oldText: "x", newText: "y" }]),
    );
    expect(r.reason).toMatch(/unsafe path/);
  });

  it("is atomic — a later failing block discards earlier edits", () => {
    const start = files();
    const r = applyEditBlocks(start, [
      { file: "app/calc.py", oldText: "a + b - 1", newText: "a + b" }, // would apply
      { file: "app/util.py", oldText: "NOPE", newText: "z" }, // fails
    ]);
    expect(r.ok).toBe(false);
    // Original input object is never mutated.
    expect(start["app/calc.py"]).toContain("a + b - 1");
  });
});
