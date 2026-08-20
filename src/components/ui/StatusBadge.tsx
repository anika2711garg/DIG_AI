import { StatusDot } from "@/components/motion/StatusDot";
import { cn } from "@/lib/cn";

type Tone = "blue" | "green" | "amber" | "red" | "slate";

const TONE: Record<Tone, string> = {
  blue: "border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.08)] text-[var(--accent-text)]",
  green: "border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.08)] text-[var(--tone-green)]",
  amber: "border-[rgba(245,158,11,0.28)] bg-[rgba(245,158,11,0.08)] text-[var(--tone-amber)]",
  red: "border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.08)] text-[var(--tone-red)]",
  slate: "border-[var(--border-strong)] bg-[rgba(148,163,184,0.06)] text-[var(--text-secondary)]",
};

export function StatusBadge({
  label,
  tone = "slate",
  pulse = false,
  className,
}: {
  label: string;
  tone?: Tone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
        TONE[tone],
        className,
      )}
    >
      <StatusDot tone={tone} pulse={pulse} />
      {label}
    </span>
  );
}
