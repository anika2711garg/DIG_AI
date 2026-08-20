import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Tooltip({
  content,
  children,
  className,
}: {
  content: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("group/tip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 w-max max-w-64 -translate-x-1/2 rounded-md border border-[var(--border-strong)] bg-[var(--card)] px-2.5 py-1.5 text-left text-[11px] leading-4 text-[var(--text-secondary)] opacity-0 shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition-opacity group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
      >
        {content}
      </span>
    </span>
  );
}
