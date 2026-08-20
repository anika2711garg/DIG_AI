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
        "inline-flex items-center gap-2 rounded-full border border-[rgba(148,163,184,0.12)] bg-[#0D111A]/80 px-2.5 py-1 text-[11px] text-[#94A3B8]",
        className,
      )}
    >
      <StatusDot tone={tone} pulse={pulse} />
      {label}
    </span>
  );
}
