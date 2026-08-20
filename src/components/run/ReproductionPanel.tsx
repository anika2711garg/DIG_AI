import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Confidence, RunState } from "@/lib/types";

export function ReproductionPanel({
  state,
  confidence,
}: {
  state: RunState;
  confidence?: Confidence | null;
}) {
  const failed = confidence === "unreproduced" || state === "failed";
  const passing =
    ["verifying", "awaiting_human", "opening_pr", "done"].includes(state) && !failed;
  const tone = passing ? "green" : failed ? "red" : "slate";

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
        background: "var(--card)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <Tooltip content="A failing test must match the reported bug before a patch is trusted.">
          <p className="text-sm font-medium">Reproduction</p>
        </Tooltip>
        <StatusBadge
          label={passing ? "PASSING TEST" : failed ? "FAILED TEST" : "PENDING"}
          tone={tone}
          pulse={state === "reproducing"}
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-secondary)]">
          {confidence
            ? "The grade rides on the run and the PR."
            : "A failing-test-turned-passing is the only proof the agent accepts."}
        </p>
        <ConfidenceBadge value={confidence} />
      </div>
    </div>
  );
}
