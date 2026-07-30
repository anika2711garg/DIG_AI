import { describe, expect, it } from "vitest";

import { detectAdapter, getAdapter } from "./registry";

describe("detectAdapter", () => {
  it("detects Python from a manifest + .py files", () => {
    expect(detectAdapter({ "pyproject.toml": "", "calc.py": "def add(): ..." }).id).toBe("python");
  });

  it("detects JavaScript/TypeScript from package.json", () => {
    expect(detectAdapter({ "package.json": "{}", "calc.js": "export const x=1" }).id).toBe("javascript");
  });

  it("detects TypeScript from tsconfig + .ts files", () => {
    expect(detectAdapter({ "tsconfig.json": "{}", "src/calc.ts": "export const x=1" }).id).toBe("javascript");
  });

  it("falls back to Python when nothing scores", () => {
    expect(detectAdapter({ "README.md": "hi" }).id).toBe("python");
  });
});

describe("getAdapter", () => {
  it("returns a known adapter and undefined otherwise", () => {
    expect(getAdapter("javascript")?.testFramework).toBe("vitest");
    expect(getAdapter("cobol")).toBeUndefined();
  });
});
