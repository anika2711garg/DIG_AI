import type { RunState } from "./types";

export const PIPELINE_STAGES: Array<{
  id: RunState;
  label: string;
  short: string;
}> = [
  { id: "created", label: "Created", short: "Create" },
  { id: "ingesting", label: "Ingesting", short: "Ingest" },
  { id: "localizing", label: "Localizing", short: "Localize" },
  { id: "reproducing", label: "Reproducing", short: "Reproduce" },
  { id: "patching", label: "Patching", short: "Patch" },
  { id: "verifying", label: "Verifying", short: "Verify" },
  { id: "awaiting_human", label: "Awaiting approval", short: "Approve" },
  { id: "opening_pr", label: "Opening PR", short: "PR" },
  { id: "done", label: "Done", short: "Done" },
];

const ORDER = PIPELINE_STAGES.map((s) => s.id);

export function stageIndex(state: RunState): number {
  if (state === "failed" || state === "cancelled") return -1;
  return ORDER.indexOf(state);
}

export function stageStatus(
  stage: RunState,
  current: RunState,
): "complete" | "active" | "failed" | "awaiting" | "inactive" {
  if (current === "failed" && stage === current) return "failed";
  if (current === "cancelled") return stage === "created" ? "complete" : "inactive";
  if (stage === "awaiting_human" && current === "awaiting_human") return "awaiting";
  const currentIdx = stageIndex(current);
  const idx = stageIndex(stage);
  if (currentIdx === -1) {
    return idx === 0 ? "complete" : "inactive";
  }
  if (idx < currentIdx) return "complete";
  if (idx === currentIdx) return current === "done" ? "complete" : "active";
  return "inactive";
}

export const LIVE_STATUS: Record<RunState, string> = {
  created: "Run created — waiting to start",
  ingesting: "Ingesting issue",
  localizing: "Localizing repository",
  reproducing: "Running reproduction test",
  patching: "Generating patch",
  verifying: "Verification running",
  awaiting_human: "Awaiting approval",
  opening_pr: "Opening draft pull request",
  done: "PR created",
  failed: "Run failed",
  cancelled: "Run cancelled",
};
