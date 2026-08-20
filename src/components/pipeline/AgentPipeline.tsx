"use client";

import { motion, useReducedMotion } from "framer-motion";

import { StatusDot } from "@/components/motion/StatusDot";
import { cn } from "@/lib/cn";
import { PIPELINE_STAGES, stageStatus } from "@/lib/pipeline";
import type { RunState } from "@/lib/types";

function toneFor(status: ReturnType<typeof stageStatus>) {
  if (status === "complete") return "green" as const;
  if (status === "active") return "blue" as const;
  if (status === "awaiting") return "amber" as const;
  if (status === "failed") return "red" as const;
  return "slate" as const;
}

export function AgentPipeline({
  current = "reproducing",
  compact = false,
}: {
  current?: RunState;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <ol
      className={cn(
        "flex w-full flex-wrap items-center justify-center gap-y-4",
        compact ? "gap-x-2" : "gap-x-3",
      )}
    >
      {PIPELINE_STAGES.map((stage, index) => {
        const status = stageStatus(stage.id, current);
        const tone = toneFor(status);
        const flowing = status === "complete" || status === "active" || status === "awaiting";

        return (
          <li key={stage.id} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full border bg-[#0D111A]",
                  status === "active" && "border-[rgba(59,130,246,0.55)]",
                  status === "complete" && "border-[rgba(34,197,94,0.45)]",
                  status === "awaiting" && "border-[rgba(245,158,11,0.5)]",
                  status === "failed" && "border-[rgba(239,68,68,0.5)]",
                  status === "inactive" && "border-[rgba(148,163,184,0.16)]",
                )}
              >
                <StatusDot tone={tone} pulse={status === "active" || status === "awaiting"} />
              </div>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase tracking-[0.14em]",
                  status === "inactive" ? "text-[#64748B]" : "text-[#E2E8F0]",
                  compact && "hidden sm:block",
                )}
              >
                {compact ? stage.short : stage.label}
              </span>
            </div>
            {index < PIPELINE_STAGES.length - 1 ? (
              <div className="relative mx-2 h-px w-8 overflow-hidden bg-[rgba(148,163,184,0.16)] sm:w-12">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-[#60A5FA] to-transparent"
                  initial={{ x: "-100%" }}
                  animate={
                    reduce || !flowing
                      ? { x: flowing ? "0%" : "-100%", opacity: flowing ? 0.5 : 0 }
                      : { x: ["-100%", "120%"] }
                  }
                  transition={
                    reduce || !flowing
                      ? { duration: 0.3 }
                      : { duration: 2.2, repeat: Infinity, ease: "linear" }
                  }
                  style={{ width: "70%" }}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
