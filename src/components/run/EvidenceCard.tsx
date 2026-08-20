import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Confidence, RunState } from "@/lib/types";

function Mark({ ok, pending }: { ok?: boolean; pending?: boolean }) {
  if (pending) return <span className="text-[var(--text-muted)]">Pending</span>;
  return <span className={ok ? "text-[#22C55E]" : "text-[#EF4444]"}>{ok ? "✓ Pass" : "✕ Fail"}</span>;
}

export function EvidenceCard({
  state,
  confidence,
}: {
  state: RunState;
  confidence?: Confidence | null;
}) {
  const reproduced = confidence === "strong" || confidence === "weak";
  const verified = ["awaiting_human", "opening_pr", "done"].includes(state);
  const failed = state === "failed" || confidence === "unreproduced";
  const pendingRepro = !reproduced && !failed && !["created", "ingesting", "localizing"].includes(state);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center justify-between gap-3">
        <Tooltip content="A failing-test-turned-passing is the only proof the agent accepts.">
          <p className="text-sm font-medium text-[var(--text)]">Evidence</p>
        </Tooltip>
        <ConfidenceBadge value={confidence} />
      </div>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-[var(--background-mid)] px-3 py-2">
          <dt className="text-[var(--text-muted)]">Before patch</dt>
          <dd>
            <Mark ok={false} pending={!reproduced && !failed} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg bg-[var(--background-mid)] px-3 py-2">
          <dt className="text-[var(--text-muted)]">After patch</dt>
          <dd>
            <Mark ok={verified} pending={!verified && !failed} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg bg-[var(--background-mid)] px-3 py-2 sm:col-span-2">
          <Tooltip content="Un-apply the patch and confirm the test fails again.">
            <dt className="text-[var(--text-muted)]">Revert check</dt>
          </Tooltip>
          <dd>
            <Mark ok={verified} pending={!verified && !failed && !pendingRepro} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
