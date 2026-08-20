import { StatusBadge } from "@/components/ui/StatusBadge";
import type { RunState } from "@/lib/types";

export function VerifyTrack({ state }: { state: RunState }) {
  const running = state === "verifying";
  const done = ["awaiting_human", "opening_pr", "done"].includes(state);

  return (
    <div className="rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[#0D111A] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Verification</p>
        <StatusBadge
          label={running ? "Scanning tests" : done ? "Verified" : "Idle"}
          tone={running ? "blue" : done ? "green" : "slate"}
          pulse={running}
        />
      </div>
      <div className={`mt-4 h-1.5 rounded-full bg-[#151B26] ${running ? "scan-track" : ""}`}>
        {done ? <div className="h-full w-full rounded-full bg-[rgba(34,197,94,0.7)]" /> : null}
      </div>
    </div>
  );
}
