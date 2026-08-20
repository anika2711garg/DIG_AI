import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";

export function CostIndicator({
  spent,
  budget,
}: {
  spent?: string | number | null;
  budget?: string | number | null;
}) {
  const used = Number(spent ?? 0);
  const cap = Number(budget ?? 0);
  const ratio = cap > 0 ? used / cap : 0;
  const pct = Math.round(ratio * 100);
  const tone = ratio >= 1 ? "bg-[#EF4444]" : ratio >= 0.8 ? "bg-[#F59E0B]" : "bg-[#3B82F6]";

  return (
    <Tooltip content="Estimated model/API cost for this run.">
      <div className="min-w-[8.5rem]">
        <p className="font-mono text-[11px] text-[var(--text-secondary)]">
          ${used.toFixed(4)}
          {cap > 0 ? ` / $${cap.toFixed(2)}` : ""}
        </p>
        {cap > 0 ? (
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-[var(--card-strong)]">
            <div className={cn("h-full", tone)} style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        ) : null}
      </div>
    </Tooltip>
  );
}
