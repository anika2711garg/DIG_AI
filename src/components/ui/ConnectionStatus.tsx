import { StatusDot } from "@/components/motion/StatusDot";
import { Tooltip } from "@/components/ui/Tooltip";

export type LinkState = "live" | "polling" | "offline";

const COPY: Record<LinkState, { label: string; tone: "green" | "blue" | "red"; tip: string }> = {
  live: { label: "Live", tone: "green", tip: "Receiving streamed run events." },
  polling: { label: "Polling", tone: "blue", tip: "Refreshing from the event log." },
  offline: { label: "Offline", tone: "red", tip: "Live updates paused. Retrying shortly." },
};

export function ConnectionStatus({ state }: { state: LinkState }) {
  const meta = COPY[state];
  return (
    <Tooltip content={meta.tip}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
        <StatusDot tone={meta.tone} pulse={state !== "offline"} />
        {meta.label}
      </span>
    </Tooltip>
  );
}
