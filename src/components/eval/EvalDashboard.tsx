"use client";

import { motion } from "framer-motion";

import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { EmptyState } from "@/components/ui/EmptyState";
import { FailureBadge } from "@/components/ui/FailureBadge";
import { Inbox } from "lucide-react";
import { FAILURE_TYPES } from "@/lib/failure-types";
import { staggerContainer } from "@/lib/motion";
import type { Run } from "@/lib/types";

export function EvalDashboard({ runs }: { runs: Run[] }) {
  const total = runs.length;
  const resolved = runs.filter((r) => r.state === "done").length;
  const repro = runs.filter((r) => r.confidence === "strong" || r.confidence === "weak").length;
  const verified = runs.filter((r) => ["awaiting_human", "opening_pr", "done"].includes(r.state)).length;
  const avgCost = total ? runs.reduce((sum, r) => sum + Number(r.spentUsd ?? 0), 0) / total : 0;
  const costPerResolved = resolved ? runs.filter((r) => r.state === "done").reduce((sum, r) => sum + Number(r.spentUsd ?? 0), 0) / resolved : 0;
  const strong = runs.filter((r) => r.confidence === "strong").length;
  const weak = runs.filter((r) => r.confidence === "weak").length;
  const unreproduced = runs.filter((r) => r.confidence === "unreproduced").length;
  const failures = runs.filter((r) => r.failureType);
  const taxonomy = FAILURE_TYPES.map((type) => ({
    type,
    count: failures.filter((r) => r.failureType === type).length,
  }));
  const maxFail = Math.max(1, ...taxonomy.map((t) => t.count));
  const modes = ["strict", "permissive", "vibes"] as const;
  const stageRates = [
    { label: "Localization", value: total ? runs.filter((r) => !["created", "ingesting", "failed"].includes(r.state) || r.failureType !== "cant_localize").length / total : 0 },
    { label: "Reproduction", value: total ? repro / total : 0 },
    { label: "Patch", value: total ? runs.filter((r) => ["verifying", "awaiting_human", "opening_pr", "done"].includes(r.state)).length / total : 0 },
    { label: "Verification", value: total ? verified / total : 0 },
  ];

  if (total === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No evaluation data yet"
        description="Metrics appear here after the worker writes persisted run results."
      />
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Metric label="Resolve rate" value={(resolved / total) * 100} suffix="%" />
        <Metric label="Reproduced" value={(repro / total) * 100} suffix="%" />
        <Metric label="Avg cost" value={avgCost} prefix="$" decimals={4} />
        <Metric label="Cost / resolved" value={costPerResolved} prefix="$" decimals={4} />
        <Metric label="Runs" value={total} />
        <Metric label="Strong" value={strong} />
        <Metric label="Weak" value={weak} />
        <Metric label="Unreproduced" value={unreproduced} />
      </motion.div>

      <div>
        <p className="mb-3 text-sm text-[var(--text-secondary)]">Stage performance</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stageRates.map((row) => (
            <div key={row.label} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{row.label}</p>
              <p className="mt-2 text-xl font-semibold">{Math.round(row.value * 100)}%</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm text-[var(--text-secondary)]">Mode comparison</p>
        <div className="grid gap-3 md:grid-cols-3">
          {modes.map((mode) => {
            const subset = runs.filter((r) => r.mode === mode);
            const done = subset.filter((r) => r.state === "done").length;
            return (
              <div key={mode} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <p className="text-sm font-medium capitalize">{mode}</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {subset.length} runs · {subset.length ? Math.round((done / subset.length) * 100) : 0}% resolved
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm text-[var(--text-secondary)]">Failure taxonomy</p>
        <div className="space-y-2">
          {taxonomy.map((row) => (
            <div key={row.type} className="grid grid-cols-[minmax(140px,220px)_1fr_40px] items-center gap-3">
              <FailureBadge type={row.type} />
              <div className="h-2 overflow-hidden rounded-full bg-[var(--card-strong)]">
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: row.count / maxFail }}
                  viewport={{ once: true }}
                  className="h-full origin-left rounded-full bg-[#3B82F6]"
                />
              </div>
              <span className="font-mono text-xs text-[var(--text-secondary)]">{row.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1 },
      }}
      className="card-interactive rounded-xl border border-[var(--border)] bg-[var(--background-mid)] p-5"
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">
        <AnimatedCounter value={value} suffix={suffix} prefix={prefix} decimals={decimals} />
      </p>
    </motion.div>
  );
}
