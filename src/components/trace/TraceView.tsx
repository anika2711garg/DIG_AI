"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, ChevronRight, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

import { CopyButton } from "@/components/ui/CopyButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatExact, formatRelative } from "@/lib/relative-time";
import { readPreferences } from "@/lib/preferences";
import type { Trace } from "@/lib/types";

export function TraceView({ traces }: { traces: Trace[] }) {
  const prefs = readPreferences();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | "model" | "tool">("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return traces.filter((trace) => {
      if (kind !== "all" && trace.kind !== kind) return false;
      if (!needle) return true;
      return [trace.name, trace.kind, JSON.stringify(trace.inputJson), JSON.stringify(trace.outputJson)]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [kind, query, traces]);

  const field =
    "rounded-lg border border-[var(--border-strong)] bg-[var(--background-mid)] px-3 py-2 text-sm text-[var(--text)]";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search traces"
          className={`w-48 ${field}`}
        />
        <select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)} className={field}>
          <option value="all">All types</option>
          <option value="model">Model</option>
          <option value="tool">Tool</option>
        </select>
        {query || kind !== "all" ? (
          <Button variant="ghost" onClick={() => { setQuery(""); setKind("all"); }}>
            Clear filters
          </Button>
        ) : null}
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No traces match these filters"
          description="Clear the query or type filter to see the full log."
        />
      ) : (
        filtered.map((trace) => <TraceRow key={trace.id} trace={trace} compact={prefs.compactTraces} />)
      )}
    </div>
  );
}

function TraceRow({ trace, compact }: { trace: Trace; compact: boolean }) {
  const [open, setOpen] = useState(!compact);
  const [wrap, setWrap] = useState(false);
  const ok = trace.success !== "false";
  const input = JSON.stringify(trace.inputJson ?? {}, null, 2);
  const output = JSON.stringify(trace.outputJson ?? {}, null, 2);
  const Icon = trace.kind === "model" ? Bot : Wrench;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <ChevronRight
          className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${open ? "rotate-90" : ""}`}
          strokeWidth={1.7}
        />
        <Icon className="h-4 w-4 text-[var(--accent-text)]" strokeWidth={1.6} />
        <StatusBadge label={trace.kind} tone={trace.kind === "model" ? "blue" : "slate"} />
        <span className="flex-1 truncate text-sm text-[var(--text-soft)]">{trace.name}</span>
        <span className="hidden font-mono text-[11px] text-[var(--text-muted)] sm:block" title={formatExact(trace.at)}>
          {formatRelative(trace.at)} · {trace.latencyMs ?? 0}ms · {trace.tokensIn ?? 0}/{trace.tokensOut ?? 0}
          {trace.costUsd != null ? ` · $${Number(trace.costUsd).toFixed(4)}` : ""}
        </span>
        <StatusBadge label={ok ? "ok" : "error"} tone={ok ? "green" : "red"} />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[var(--border-subtle)]"
          >
            <div className="flex justify-end gap-2 px-4 pt-3">
              <button type="button" onClick={() => setWrap((v) => !v)} className="text-[11px] text-[var(--text-muted)]">
                {wrap ? "No wrap" : "Wrap"}
              </button>
              <CopyButton value={JSON.stringify({ input: trace.inputJson, output: trace.outputJson }, null, 2)} label="Copy JSON" />
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-2">
              <pre className={`overflow-x-auto rounded-lg bg-[var(--background-mid)] p-3 font-mono text-[11px] text-[var(--text-secondary)] ${wrap ? "whitespace-pre-wrap" : ""}`}>
                {input}
              </pre>
              <pre className={`overflow-x-auto rounded-lg bg-[var(--background-mid)] p-3 font-mono text-[11px] text-[var(--text-secondary)] ${wrap ? "whitespace-pre-wrap" : ""}`}>
                {output}
              </pre>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
