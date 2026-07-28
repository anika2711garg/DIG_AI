import { checkPromptInjection, type InjectionCheckResult } from "../security/injection";

/**
 * The Ingestor turns a raw GitHub issue into a structured, injection-screened
 * IssueDigest. Fully deterministic — code, not a model — so it is trivially
 * testable and can't be steered by the untrusted issue text it processes.
 *
 * The digest carries the injection verdict; the ORCHESTRATOR is what halts a run
 * (→ injection_suspected). Downstream prompts must fence this text as data.
 */

export interface StackFrame {
  file: string;
  line: number;
  functionName?: string;
}

/** Raw issue as fetched from a provider. Kept minimal + provider-agnostic. */
export interface RawIssue {
  repo: string; // "owner/name"
  number: number;
  title: string;
  body: string;
  labels: string[];
  comments: { author: string; body: string }[];
}

export interface IssueDigest {
  repo: string;
  issueNumber: number;
  title: string;
  body: string;
  labels: string[];
  comments: { author: string; body: string }[];
  /** Python traceback frames parsed from the issue + comments, in printed order. */
  stackFrames: StackFrame[];
  injection: InjectionCheckResult;
}

/** Fetches a raw issue — GitHub in production, a fake in tests. */
export type IssueFetcher = (repo: string, issueNumber: number) => Promise<RawIssue>;

// `File "path/to/file.py", line 123, in func_name`  (function part optional)
const PY_FRAME = /File\s+"([^"]+\.py)",\s+line\s+(\d+)(?:,\s+in\s+([A-Za-z_][A-Za-z0-9_]*))?/g;

/** Parse Python traceback frames from arbitrary text. Deterministic. */
export function parseStackFrames(text: string): StackFrame[] {
  const frames: StackFrame[] = [];
  // Fresh lastIndex per call (the regex is module-level + global).
  PY_FRAME.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PY_FRAME.exec(text)) !== null) {
    frames.push({
      file: m[1]!,
      line: Number.parseInt(m[2]!, 10),
      ...(m[3] ? { functionName: m[3] } : {}),
    });
  }
  return frames;
}

/** All untrusted text from an issue, for screening + trace parsing. */
function combinedText(issue: RawIssue): string {
  return [issue.title, issue.body, ...issue.comments.map((c) => c.body)].join("\n");
}

/** Structure a raw issue into a screened digest. Pure. */
export function ingest(issue: RawIssue): IssueDigest {
  const text = combinedText(issue);
  return {
    repo: issue.repo,
    issueNumber: issue.number,
    title: issue.title,
    body: issue.body,
    labels: issue.labels,
    comments: issue.comments,
    stackFrames: parseStackFrames(text),
    injection: checkPromptInjection(text),
  };
}

/** Fetch + ingest. The composable entry point; inject a fake fetcher in tests. */
export async function ingestIssue(
  fetch: IssueFetcher,
  repo: string,
  issueNumber: number,
): Promise<IssueDigest> {
  return ingest(await fetch(repo, issueNumber));
}
