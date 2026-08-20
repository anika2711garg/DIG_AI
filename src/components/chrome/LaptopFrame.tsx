import type { ReactNode } from "react";

import { LiveIndicator } from "@/components/motion/LiveIndicator";
import { cn } from "@/lib/cn";

export function LaptopFrame({
  path,
  status = "Agent ready",
  pulse = false,
  tilt = false,
  children,
  className,
}: {
  path: string;
  status?: string;
  pulse?: boolean;
  tilt?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("laptop", tilt && "laptop-float", className)}>
      <div className="laptop-glow pointer-events-none absolute left-1/2 top-[12%] h-[55%] w-[78%] -translate-x-1/2 rounded-full bg-[rgba(59,130,246,0.2)] blur-[110px]" />
      <div className={cn("laptop-lid", tilt && "laptop-lid-tilt")}>
        <div className="laptop-bezel">
          <div className="laptop-camera" aria-hidden />
          <div className="laptop-screen image-border">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/75" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/75" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]/75" />
                <span className="ml-2 truncate font-mono text-[11px] text-[var(--text-muted)]">{path}</span>
              </div>
              <LiveIndicator label={status} pulse={pulse} />
            </div>
            {children}
          </div>
        </div>
      </div>
      <div className="laptop-hinge" aria-hidden />
      <div className="laptop-base" aria-hidden>
        <span className="laptop-trackpad" />
      </div>
    </div>
  );
}
