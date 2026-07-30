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

  it("detects Go from go.mod + .go files", () => {
    expect(detectAdapter({ "go.mod": "module calc", "calc.go": "package calc" }).id).toBe("go");
  });

  it("detects Rust from Cargo.toml + .rs files", () => {
    expect(detectAdapter({ "Cargo.toml": "[package]", "src/lib.rs": "pub fn x() {}" }).id).toBe("rust");
  });

  it("falls back to Python when nothing scores", () => {
    expect(detectAdapter({ "README.md": "hi" }).id).toBe("python");
  });
});

describe("getAdapter", () => {
  it("returns known adapters and undefined otherwise", () => {
    expect(getAdapter("javascript")?.testFramework).toBe("vitest");
    expect(getAdapter("go")?.id).toBe("go");
    expect(getAdapter("rust")?.id).toBe("rust");
    expect(getAdapter("cobol")).toBeUndefined();
  });
});
