"use client";

import { motion } from "framer-motion";
import {
  Bug,
  GitPullRequest,
  Lock,
  ScanSearch,
  ShieldCheck,
  TestTubes,
} from "lucide-react";

import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { DataFlowLine } from "@/components/motion/DataFlowLine";
import { LivePipeline } from "@/components/pipeline/LivePipeline";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FAILURE_TYPES } from "@/lib/failure-types";
import { staggerContainer } from "@/lib/motion";

const FEATURES = [
  {
    icon: ScanSearch,
    title: "Localize",
    body: "Start from the stack trace if there is one. Then read a few files. Never dump the repo into the prompt.",
  },
  {
    icon: TestTubes,
    title: "Reproduce",
    body: "The test has to fail for the reported reason. A typo in an import is not a reproduction.",
  },
  {
    icon: Bug,
    title: "Patch",
    body: "Structured edits through git. If the merge fails, that's a typed state — not a silent drop.",
  },
  {
    icon: ShieldCheck,
    title: "Verify",
    body: "Network-off. Baseline-aware. Then un-apply the patch and make sure the test fails again.",
  },
  {
    icon: Lock,
    title: "Human gate",
    body: "open_pull_request checks the database, not the prompt. A model cannot skip approval.",
  },
  {
    icon: GitPullRequest,
    title: "Draft PR",
    body: "Fix + test + an honest grade. If verification was incomplete, the PR says so.",
  },
];

const MODES = [
  {
    name: "Strict",
    badge: "Mode A",
    body: "No strong reproduction → the run halts with a typed failure. Maximum integrity.",
  },
  {
    name: "Permissive",
    badge: "Default",
    body: "Weak evidence can continue, but the confidence label stays on the run and the PR.",
  },
  {
    name: "Vibes",
    badge: "Ablation",
    body: "Skip reproduction and claim success. Built only as a baseline to measure against.",
  },
];

const RULES = [
  "Persist the state change before any side effect.",
  "The model proposes. Deterministic code disposes.",
  "No secrets enter the sandbox.",
  "Every external write is idempotent.",
  "Failures are typed, never free text.",
];

export function LandingSections() {
  return (
    <>
      <AnimatedSection id="pipeline" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
        <p className="font-mono text-[11px] text-[var(--text-muted)]">01 — pipeline</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Issue → Reproduce → Patch → Verify → PR
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
          A persisted state machine, not a script. Crash mid-run and it resumes.
          Wait two days for approval and nothing is lost.
        </p>
        <div className="mt-10 rounded-xl border border-[var(--border-strong)] bg-[var(--card)]/88 px-4 py-10 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
          <LivePipeline />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DataFlowLine from="Issue" to="Agent" />
          <DataFlowLine from="Agent" to="Sandbox" />
          <DataFlowLine from="Sandbox" to="Verify" />
          <DataFlowLine from="Approval" to="Pull Request" />
        </div>
      </AnimatedSection>

      <AnimatedSection id="features" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10">
        <p className="font-mono text-[11px] text-[var(--text-muted)]">02 — features</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">The verified loop</h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerContainer}
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <AnimatedCard key={feature.title}>
                <Icon className="mb-4 h-5 w-5 text-[#60A5FA]" strokeWidth={1.6} />
                <h3 className="text-base font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{feature.body}</p>
              </AnimatedCard>
            );
          })}
        </motion.div>
      </AnimatedSection>

      <AnimatedSection id="templates" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10">
        <p className="font-mono text-[11px] text-[var(--text-muted)]">03 — modes</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Reproduction modes</h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mt-8 grid gap-4 md:grid-cols-3"
        >
          {MODES.map((mode) => (
            <AnimatedCard key={mode.name}>
              <StatusBadge label={mode.badge} tone={mode.name === "Permissive" ? "blue" : "slate"} />
              <h3 className="mt-4 text-lg font-medium">{mode.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{mode.body}</p>
            </AnimatedCard>
          ))}
        </motion.div>
      </AnimatedSection>

      <AnimatedSection id="docs" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10">
        <p className="font-mono text-[11px] text-[var(--text-muted)]">04 — rules</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Five rules we never break</h2>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {RULES.map((rule, i) => (
            <div
              key={rule}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3"
            >
              <span className="font-mono text-xs text-[#60A5FA]">0{i + 1}</span>
              <span className="text-sm text-[var(--text-soft)]">{rule}</span>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <p className="mb-3 text-sm text-[var(--text-secondary)]">Failure taxonomy</p>
          <div className="flex flex-wrap gap-2">
            {FAILURE_TYPES.map((type) => (
              <span
                key={type}
                className="card-interactive rounded-md border border-[var(--border)] bg-[var(--card-hover)] px-2.5 py-1 font-mono text-[10px] text-[var(--text-secondary)]"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="pricing" className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-10">
        <p className="font-mono text-[11px] text-[var(--text-muted)]">05 — pricing</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Self-hosted engine</h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mt-8 grid gap-4 md:grid-cols-3"
        >
          <AnimatedCard>
            <p className="text-sm text-[var(--text-secondary)]">Engine</p>
            <p className="mt-2 text-2xl font-semibold">Open</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              You bring Neon, E2B, and the keys. Tokens never leave your environment.
            </p>
          </AnimatedCard>
          <AnimatedCard className="border-[rgba(59,130,246,0.28)]">
            <p className="text-sm text-[var(--accent-text)]">Dashboard</p>
            <p className="mt-2 text-2xl font-semibold">Included</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Runs, traces, approval, and eval — thin windows on the event log.
            </p>
          </AnimatedCard>
          <AnimatedCard>
            <p className="text-sm text-[var(--text-secondary)]">Human gate</p>
            <p className="mt-2 text-2xl font-semibold">Required</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Draft PRs only after a person approves. Autonomy is capped on purpose.
            </p>
          </AnimatedCard>
        </motion.div>
        <div className="mt-10 flex justify-center">
          <Button href="/runs" variant="white">
            Open the dashboard
          </Button>
        </div>
      </AnimatedSection>
    </>
  );
}
