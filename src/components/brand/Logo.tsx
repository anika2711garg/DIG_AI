import { cn } from "@/lib/cn";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[#F8FAFC]", className)}>
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
        <path
          d="M12 1.4 14.35 9.65 22.6 12 14.35 14.35 12 22.6 9.65 14.35 1.4 12 9.65 9.65Z"
          fill="currentColor"
        />
      </svg>
      {compact ? null : <span className="text-[15px] font-semibold tracking-[0.18em]">NEONE</span>}
    </span>
  );
}
