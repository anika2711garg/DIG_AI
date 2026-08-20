"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Trace } from "@/lib/types";

export function TraceView({ traces }: { traces: Trace[] }) {
  return (
    <div className="space-y-2">
      {traces.map((trace) => (
        <TraceRow key={trace.id} trace={trace} />
      ))}
    </div>
  );
}

function TraceRow({ trace }: { trace: Trace }) {
  const [open, setOpen] = useState(false);
  const ok = trace.success !== "false";

  return (
    <div className="rounded-xl border border-[rgba(148,163,184,0.12)] bg-[#0D111A]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <ChevronRight
          className={`h-4 w-4 text-[#64748B] transition-transform ${open ? "rotate-90" : ""}`}
          strokeWidth={1.7}
        />
        <StatusBadge label={trace.kind} tone={trace.kind === "model" ? "blue" : "slate"} />
        <span className="flex-1 truncate text-sm text-[#E2E8F0]">{trace.name}</span>
        <span className="hidden font-mono text-[11px] text-[#64748B] sm:block">
          {trace.latencyMs ?? 0}ms · {trace.tokensIn ?? 0}/{trace.tokensOut ?? 0}
        </span>
        <StatusBadge label={ok ? "ok" : "error"} tone={ok ? "green" : "red"} />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[rgba(148,163,184,0.08)]"
          >
            <div className="grid gap-3 p-4 md:grid-cols-2">
              <pre className="overflow-x-auto rounded-lg bg-[#080B12] p-3 font-mono text-[11px] text-[#94A3B8]">
                {JSON.stringify(trace.inputJson ?? {}, null, 2)}
              </pre>
              <pre className="overflow-x-auto rounded-lg bg-[#080B12] p-3 font-mono text-[11px] text-[#94A3B8]">
                {JSON.stringify(trace.outputJson ?? {}, null, 2)}
              </pre>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
