import type { StackFrame } from "./ingestor";

/**
 * The Localizer's deterministic core. Two pure functions the plan calls for:
 *   - buildRepoMap: top-level def/class signatures per Python file (the map the
 *     model gets instead of raw files).
 *   - rankFiles: lexical ranking SEEDED by stack-trace paths — files named in
 *     the traceback dominate; otherwise keyword overlap with the issue.
 *
 * The model later picks from the top slice; here code produces the shortlist.
 */

export interface Symbol {
  kind: "def" | "class";
  name: string;
  line: number;
}

export interface FileSignature {
  path: string;
  symbols: Symbol[];
}

export type RepoMap = FileSignature[];

const TOP_LEVEL_SYMBOL = /^(def|class)\s+([A-Za-z_]\w*)/;

/** Extract module-level def/class signatures from each Python file. */
export function buildRepoMap(files: Record<string, string>): RepoMap {
  const map: RepoMap = [];
  for (const [path, content] of Object.entries(files)) {
    if (!path.endsWith(".py")) continue;
    const symbols: Symbol[] = [];
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const m = TOP_LEVEL_SYMBOL.exec(lines[i]!);
      if (m) symbols.push({ kind: m[1] as "def" | "class", name: m[2]!, line: i + 1 });
    }
    map.push({ path, symbols });
  }
  return map;
}

export interface RankedFile {
  path: string;
  score: number;
  reasons: string[];
}

export interface LocalizeInput {
  title: string;
  body: string;
  stackFrames: StackFrame[];
}

/** Weight for a file named in the traceback — dominates lexical signal. */
const STACK_TRACE_WEIGHT = 100;
const PATH_KEYWORD_WEIGHT = 5;

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "when", "then", "but", "not",
  "are", "was", "get", "got", "has", "have", "you", "your", "from", "its",
  "should", "would", "does", "did", "into", "out", "why", "how",
]);

const basename = (p: string): string => p.split("/").pop() ?? p;

function keywords(text: string): string[] {
  const seen = new Set<string>();
  for (const raw of text.toLowerCase().split(/[^a-z0-9_]+/)) {
    if (raw.length > 2 && !STOPWORDS.has(raw)) seen.add(raw);
  }
  return [...seen];
}

/** True if a repo file corresponds to a traceback frame path. */
function matchesFrame(filePath: string, framePath: string): boolean {
  return (
    filePath === framePath ||
    filePath.endsWith(`/${framePath}`) ||
    framePath.endsWith(`/${filePath}`) ||
    basename(filePath) === basename(framePath)
  );
}

/** Rank files by likely relevance to the issue. Deterministic and stable. */
export function rankFiles(files: Record<string, string>, issue: LocalizeInput): RankedFile[] {
  const kws = keywords(`${issue.title}\n${issue.body}`);

  // Patch candidates are source files (Python-only v1), never docs/config.
  const sources = Object.entries(files).filter(([path]) => path.endsWith(".py"));

  const ranked: RankedFile[] = sources.map(([path, content]) => {
    let score = 0;
    const reasons: string[] = [];

    for (const frame of issue.stackFrames) {
      if (matchesFrame(path, frame.file)) {
        score += STACK_TRACE_WEIGHT;
        reasons.push(`stack trace: ${frame.file}${frame.functionName ? ` (${frame.functionName})` : ""}`);
        break;
      }
    }

    const haystack = content.toLowerCase();
    const nameHay = basename(path).toLowerCase();
    for (const kw of kws) {
      if (nameHay.includes(kw)) {
        score += PATH_KEYWORD_WEIGHT;
        reasons.push(`filename: ${kw}`);
      }
      if (haystack.includes(kw)) {
        score += 1;
        reasons.push(`keyword: ${kw}`);
      }
    }

    return { path, score, reasons };
  });

  // Highest score first; ties broken by path for stable, deterministic output.
  return ranked
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
}
