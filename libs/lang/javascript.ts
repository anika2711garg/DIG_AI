import { NODE_TEMPLATE } from "@libs/integrations/e2b";
import type { StackFrame } from "@libs/services/ingestor";
import type { Symbol } from "@libs/services/localizer";
import type { ReportedSymptom } from "@libs/services/reproducer";

import type { LanguageAdapter } from "./types";

// V8 stack frames: `at fn (/path/file.js:12:5)` or `at /path/file.ts:3:1`
const JS_FRAME = /at (?:(\S+) )?\(?([^\s()]+\.(?:m?[jt]sx?|cjs)):(\d+):\d+\)?/g;

function parseStackFrames(text: string): StackFrame[] {
  const frames: StackFrame[] = [];
  JS_FRAME.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = JS_FRAME.exec(text)) !== null) {
    frames.push({ file: m[2]!, line: Number.parseInt(m[3]!, 10), ...(m[1] ? { functionName: m[1] } : {}) });
  }
  return frames;
}

// Error lines: `TypeError: x is not a function`, `AssertionError: ...`.
const JS_ERR = /^\s*([A-Za-z_][\w.]*(?:Error|Exception))(?::\s*(.+))?\s*$/gm;

function extractSymptom(text: string): ReportedSymptom {
  let exceptionType: string | undefined;
  const patterns = new Set<string>();
  JS_ERR.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = JS_ERR.exec(text)) !== null) {
    exceptionType = m[1];
    if (m[2]) patterns.add(m[2].trim());
  }
  // vitest/jest assertion phrasing, e.g. "expected 4 to be 5".
  for (const e of text.match(/expected [^\n]+/gi) ?? []) patterns.add(e.trim());
  return { ...(exceptionType ? { exceptionType } : {}), messagePatterns: [...patterns] };
}

// Top-level `export function/class/const foo`, or bare `function/class foo`.
const JS_SYMBOL =
  /^export\s+(?:default\s+)?(function|class|const|let|var)\s+([A-Za-z_$][\w$]*)|^(function|class)\s+([A-Za-z_$][\w$]*)/;

function topLevelSymbols(content: string): Symbol[] {
  const symbols: Symbol[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = JS_SYMBOL.exec(lines[i]!);
    if (m) symbols.push({ kind: (m[1] ?? m[3])!, name: (m[2] ?? m[4])!, line: i + 1 });
  }
  return symbols;
}

export const javascriptAdapter: LanguageAdapter = {
  id: "javascript",
  displayName: "JavaScript / TypeScript",
  sourceExtensions: [".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs"],
  manifestFiles: ["package.json", "tsconfig.json"],
  e2bTemplate: NODE_TEMPLATE,
  testFramework: "vitest",
  reproTestExample: "repro.test.js",
  testCommand: (file) =>
    `vitest run ${file ?? ""} --reporter=junit --outputFile=.junit.xml`.replace(/\s+/g, " ").trim(),
  parseStackFrames,
  extractSymptom,
  topLevelSymbols,
  detect: (files) => {
    let score = 0;
    for (const p of Object.keys(files)) {
      const base = p.split("/").pop()!;
      if (base === "package.json") score += 5;
      if (base === "tsconfig.json") score += 3;
      if (/\.(m?[jt]sx?|cjs)$/.test(p) && !p.endsWith(".d.ts")) score += 1;
    }
    return score;
  },
};
