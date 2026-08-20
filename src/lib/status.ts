import type { RunState } from "./types";

export function runTone(state: RunState): "blue" | "green" | "amber" | "red" | "slate" {
  if (state === "done") return "green";
  if (state === "failed" || state === "cancelled") return "red";
  if (state === "awaiting_human") return "amber";
  if (state === "created") return "slate";
  return "blue";
}

export function runLabel(state: RunState): string {
  return state.replaceAll("_", " ");
}

export function isActiveState(state: RunState): boolean {
  return !["done", "failed", "cancelled", "created"].includes(state);
}
