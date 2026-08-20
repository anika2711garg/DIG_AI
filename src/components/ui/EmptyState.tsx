import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { StatusDot } from "@/components/motion/StatusDot";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--card)_60%,transparent)] px-6 py-14 text-center",
        className,
      )}
    >
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-hover)]">
        <Icon className="h-5 w-5 text-[var(--text-muted)]" strokeWidth={1.6} />
        <span className="absolute -right-1 -top-1">
          <StatusDot tone="blue" pulse />
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text-soft)]">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
