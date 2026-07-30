import { GO_TEMPLATE } from "@libs/integrations/e2b";
import type { StackFrame } from "@libs/services/ingestor";
import type { Symbol } from "@libs/services/localizer";
import type { ReportedSymptom } from "@libs/services/reproducer";

import type { LanguageAdapter } from "./types";

const MANIFESTS = new Set(["go.mod", "go.sum"]);

// Go panic/test frames: `\tcalc.go:12 +0x1d`, `/app/calc.go:12`, `calc_test.go:8:`.
const GO_FRAME = /([\w./-]+\.go):(\d+)/g;

function parseStackFrames(text: string): StackFrame[] {
  const frames: StackFrame[] = [];
  GO_FRAME.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = GO_FRAME.exec(text)) !== null) {
    frames.push({ file: m[1]!, line: Number.parseInt(m[2]!, 10) });
  }
  return frames;
}

// `panic: ...` plus testing phrasing (`expected X`, `want X`, `got Y`).
function extractSymptom(text: string): ReportedSymptom {
  const patterns = new Set<string>();
  let exceptionType: string | undefined;
  const panic = /panic:\s*(.+)/i.exec(text);
  if (panic) {
    exceptionType = "panic";
    patterns.add(panic[1]!.trim());
  }
  for (const e of text.match(/(?:expected|want|got|wanted)\b[^\n]*/gi) ?? []) patterns.add(e.trim());
  return { ...(exceptionType ? { exceptionType } : {}), messagePatterns: [...patterns] };
}

// Top-level `func Name(`, `func (r Recv) Name(`, `type Name struct/interface`.
const GO_SYMBOL = /^func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)\s*\(|^type\s+([A-Za-z_]\w*)\s+/;

function topLevelSymbols(content: string): Symbol[] {
  const symbols: Symbol[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = GO_SYMBOL.exec(lines[i]!);
    if (m) symbols.push({ kind: m[1] ? "func" : "type", name: (m[1] ?? m[2])!, line: i + 1 });
  }
  return symbols;
}

export const goAdapter: LanguageAdapter = {
  id: "go",
  displayName: "Go",
  sourceExtensions: [".go"],
  manifestFiles: ["go.mod"],
  e2bTemplate: GO_TEMPLATE,
  testFramework: "go testing (func TestXxx(t *testing.T))",
  reproTestExample: "repro_test.go",
  // Go runs tests per-package, not per-file; gotestsum wraps `go test` and writes JUnit.
  testCommand: () => "gotestsum --junitfile .junit.xml -- ./...",
  parseStackFrames,
  extractSymptom,
  topLevelSymbols,
  detect: (files) => {
    let score = 0;
    for (const p of Object.keys(files)) {
      if (MANIFESTS.has(p.split("/").pop()!)) score += 5;
      if (p.endsWith(".go")) score += 1;
    }
    return score;
  },
};
