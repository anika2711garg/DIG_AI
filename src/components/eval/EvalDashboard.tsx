"use client";

import { motion } from "framer-motion";

import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FAILURE_TYPES } from "@/lib/failure-types";
import { staggerContainer } from "@/lib/motion";
import type { Run } from "@/lib/types";

export function EvalDashboard({ runs }: { runs: Run[] }) {
  const total = runs.length;
  const resolved = runs.filter((r) => r.state === "done").length;
  const repro = runs.filter((r) => r.confidence === "strong" || r.confidence === "weak").length;
  const verified = runs.filter((r) => ["awaiting_human", "opening_pr", "done"].includes(r.state)).length;
  const avgCost = total
    ? runs.reduce((sum, r) => sum + Number(r.spentUsd ?? 0), 0) / total
    : 0;
  const failures = runs.filter((r) => r.failureType);
  const taxonomy = FAILURE_TYPES.map((type) => ({
    type,
    count: failures.filter((r) => r.failureType === type).length,
  }));
  const maxFail = Math.max(1, ...taxonomy.map((t) => t.count));

  return (
    <div className="space-y-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      >
        <Metric label="Resolve rate" value={total ? (resolved / total) * 100 : 0} suffix="%" />
        <Metric label="Reproduction" value={total ? (repro / total) * 100 : 0} suffix="%" />
        <Metric label="Verification" value={total ? (verified / total) * 100 : 0} suffix="%" />
        <Metric label="Avg cost" value={avgCost} prefix="$" decimals={4} />
        <Metric label="Runs" value={total} />
      </motion.div>

      <div>
        <p className="mb-3 text-sm text-[#94A3B8]">Failure taxonomy</p>
        <div className="space-y-2">
          {taxonomy.map((row) => (
            <div key={row.type} className="grid grid-cols-[180px_1fr_40px] items-center gap-3">
              <StatusBadge label={row.type} />
              <div className="h-2 overflow-hidden rounded-full bg-[#151B26]">
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: row.count / maxFail }}
                  viewport={{ once: true }}
                  className="h-full origin-left rounded-full bg-[#3B82F6]"
                />
              </div>
              <span className="font-mono text-xs text-[#94A3B8]">{row.count}</span>
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
      className="card-interactive rounded-xl border border-[rgba(148,163,184,0.12)] bg-[#080B12]/80 p-5"
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-[#64748B]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">
        <AnimatedCounter value={value} suffix={suffix} prefix={prefix} decimals={decimals} />
      </p>
    </motion.div>
  );
}
