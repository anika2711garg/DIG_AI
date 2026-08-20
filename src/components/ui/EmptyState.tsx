import type { LucideIcon } from "lucide-react";

import { StatusDot } from "@/components/motion/StatusDot";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[rgba(148,163,184,0.16)] bg-[#0D111A]/60 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(148,163,184,0.12)] bg-[#111722]">
        <Icon className="h-5 w-5 text-[#64748B]" strokeWidth={1.6} />
        <span className="absolute -right-1 -top-1">
          <StatusDot tone="blue" pulse />
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-[#E2E8F0]">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-[#64748B]">{description}</p>
      </div>
    </div>
  );
}
