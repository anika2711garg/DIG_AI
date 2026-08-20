import { StatusDot } from "@/components/motion/StatusDot";
import { cn } from "@/lib/cn";

export function LiveIndicator({
  label,
  tone = "blue",
  pulse = true,
  className,
}: {
  label: string;
  tone?: "blue" | "green" | "amber" | "red" | "slate";
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_80%,transparent)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]",
        className,
      )}
    >
      <StatusDot tone={tone} pulse={pulse} />
      {label}
    </span>
  );
}
