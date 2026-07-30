import { RUST_TEMPLATE } from "@libs/integrations/e2b";
import type { StackFrame } from "@libs/services/ingestor";
import type { Symbol } from "@libs/services/localizer";
import type { ReportedSymptom } from "@libs/services/reproducer";

import type { LanguageAdapter } from "./types";

const MANIFESTS = new Set(["Cargo.toml", "Cargo.lock"]);

// Rust panic/backtrace frames: `src/lib.rs:5:9`, `at ./src/lib.rs:5`.
const RS_FRAME = /([\w./-]+\.rs):(\d+)(?::\d+)?/g;

function parseStackFrames(text: string): StackFrame[] {
  const frames: StackFrame[] = [];
  RS_FRAME.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RS_FRAME.exec(text)) !== null) {
    frames.push({ file: m[1]!, line: Number.parseInt(m[2]!, 10) });
  }
  return frames;
}

// `thread '…' panicked at …: <msg>`, assertion phrasing (`left == right`, `assertion failed`).
function extractSymptom(text: string): ReportedSymptom {
  const patterns = new Set<string>();
  let exceptionType: string | undefined;
  const panic = /panicked at [^\n:]*:\s*(.+)/i.exec(text);
  if (panic) {
    exceptionType = "panic";
    patterns.add(panic[1]!.trim());
  }
  for (const e of text.match(/(?:assertion failed|left ==? right|expected|got)\b[^\n]*/gi) ?? [])
    patterns.add(e.trim());
  return { ...(exceptionType ? { exceptionType } : {}), messagePatterns: [...patterns] };
}

// Top-level `pub fn name(`, `fn name(`, `pub struct/enum/trait Name`.
const RS_SYMBOL = /^\s*(?:pub\s+)?fn\s+([A-Za-z_]\w*)\s*[(<]|^\s*(?:pub\s+)?(?:struct|enum|trait)\s+([A-Za-z_]\w*)/;

function topLevelSymbols(content: string): Symbol[] {
  const symbols: Symbol[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = RS_SYMBOL.exec(lines[i]!);
    if (m) symbols.push({ kind: m[1] ? "fn" : "type", name: (m[1] ?? m[2])!, line: i + 1 });
  }
  return symbols;
}

export const rustAdapter: LanguageAdapter = {
  id: "rust",
  displayName: "Rust",
  sourceExtensions: [".rs"],
  manifestFiles: ["Cargo.toml"],
  e2bTemplate: RUST_TEMPLATE,
  testFramework: "cargo test (#[test] fns; integration tests in tests/)",
  reproTestExample: "tests/repro.rs",
  // nextest writes JUnit to target/nextest/<profile>/; we point a `ci` profile at
  // junit.xml and copy it to the sandbox's expected .junit.xml. `;` (not `&&`) so a
  // failing test — a non-zero exit — still copies the report.
  testCommand: () =>
    'mkdir -p .config && printf \'[profile.ci.junit]\\npath = "junit.xml"\\n\' > .config/nextest.toml && cargo nextest run --profile ci ; cp target/nextest/ci/junit.xml .junit.xml 2>/dev/null || true',
  parseStackFrames,
  extractSymptom,
  topLevelSymbols,
  detect: (files) => {
    let score = 0;
    for (const p of Object.keys(files)) {
      if (MANIFESTS.has(p.split("/").pop()!)) score += 5;
      if (p.endsWith(".rs")) score += 1;
    }
    return score;
  },
};
