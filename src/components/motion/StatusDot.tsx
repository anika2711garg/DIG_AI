import { cn } from "@/lib/cn";

type Tone = "blue" | "green" | "amber" | "red" | "slate";

const TONE: Record<Tone, string> = {
  blue: "bg-[#3B82F6]",
  green: "bg-[#22C55E]",
  amber: "bg-[#F59E0B]",
  red: "bg-[#EF4444]",
  slate: "bg-[#64748B]",
};

export function StatusDot({
  tone = "blue",
  pulse = false,
  className,
}: {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)}>
      <span className={cn("relative z-10 block h-2 w-2 rounded-full", TONE[tone])} />
      {pulse ? <span className={cn("status-pulse absolute inset-0 rounded-full", TONE[tone])} /> : null}
    </span>
  );
}
