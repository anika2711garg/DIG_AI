export type RunState =
  | "created"
  | "ingesting"
  | "localizing"
  | "reproducing"
  | "patching"
  | "verifying"
  | "awaiting_human"
  | "opening_pr"
  | "done"
  | "failed"
  | "cancelled";

export type Mode = "strict" | "permissive" | "vibes";
export type Confidence = "strong" | "weak" | "unreproduced";

export interface Repo {
  id: number;
  fullName: string;
  defaultBranch: string;
  cloneUrl?: string | null;
  status?: string;
}

export interface Run {
  id: number;
  repoId: number;
  issueNumber: number;
  state: RunState;
  mode: Mode;
  confidence?: Confidence | null;
  failureType?: string | null;
  currentAttempt?: number;
  maxAttempts?: number;
  budgetUsd?: string | number;
  spentUsd?: string | number;
  tokensUsed?: number | null;
  tokenBudget?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RunEvent {
  id: number;
  runId: number;
  type: string;
  state?: RunState | null;
  dataJson?: Record<string, unknown> | null;
  at: string;
}

export interface Trace {
  id: number;
  runId: number;
  kind: "model" | "tool";
  name: string;
  inputJson?: unknown;
  outputJson?: unknown;
  success?: string | null;
  errorType?: string | null;
  errorMessage?: string | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  latencyMs?: number | null;
  costUsd?: string | number | null;
  at: string;
}

export interface Approval {
  id: number;
  runId: number;
  status: "pending" | "approved" | "rejected";
  reviewerIdentifier?: string | null;
  reviewerComment?: string | null;
  approvedPatchDigest: string;
  approvedReproductionDigest: string;
  createdAt?: string;
  decidedAt?: string | null;
}

export interface PullRequest {
  id: number;
  runId: number;
  status: "draft" | "opened" | "failed";
  externalPrNumber?: number | null;
  url?: string | null;
}
