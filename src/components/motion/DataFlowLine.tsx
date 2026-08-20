"use client";

import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/cn";

export function DataFlowLine({
  from,
  to,
  className,
}: {
  from: string;
  to: string;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-[#64748B]">
        <span>{from}</span>
        <span>{to}</span>
      </div>
      <div className="relative h-px overflow-hidden bg-[rgba(148,163,184,0.16)]">
        {!reduce ? (
          <span className="data-dot absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#60A5FA] shadow-[0_0_10px_#3B82F6]" />
        ) : null}
      </div>
    </div>
  );
}
