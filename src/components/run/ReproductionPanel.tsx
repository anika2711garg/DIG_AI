import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Confidence, RunState } from "@/lib/types";

export function ReproductionPanel({
  state,
  confidence,
}: {
  state: RunState;
  confidence?: Confidence | null;
}) {
  const failed = state === "reproducing" || confidence === "unreproduced";
  const passing = state === "verifying" || state === "awaiting_human" || state === "opening_pr" || state === "done";
  const tone = passing && confidence !== "unreproduced" ? "green" : failed ? "red" : "slate";

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor:
          tone === "green"
            ? "rgba(34,197,94,0.28)"
            : tone === "red"
              ? "rgba(239,68,68,0.28)"
              : "rgba(148,163,184,0.12)",
        background: "#0D111A",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Reproduction</p>
        <StatusBadge
          label={passing ? "PASSING TEST" : failed ? "FAILED TEST" : "PENDING"}
          tone={tone}
          pulse={state === "reproducing"}
        />
      </div>
      <p className="mt-3 text-sm text-[#94A3B8]">
        {confidence
          ? `Confidence grade: ${confidence}. The label rides on the run and the PR.`
          : "A failing-test-turned-passing is the only proof the agent accepts."}
      </p>
    </div>
  );
}
