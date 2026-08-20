"use client";

import { motion } from "framer-motion";
import {
  Bug,
  GitPullRequest,
  Lock,
  ScanSearch,
  ShieldCheck,
  TestTubes,
  Workflow,
} from "lucide-react";

import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { DataFlowLine } from "@/components/motion/DataFlowLine";
import { AgentPipeline } from "@/components/pipeline/AgentPipeline";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { staggerContainer } from "@/lib/motion";
import { FAILURE_TYPES } from "@/lib/failure-types";
import Link from "next/link";

const FEATURES = [
  {
    icon: ScanSearch,
    title: "Localize",
    body: "Repo map, stack-trace seeds, and iterative reads — no dumping the tree into a prompt.",
  },
  {
    icon: TestTubes,
    title: "Reproduce",
    body: "A failing test must fail for the reported reason. Typo-crashes do not count.",
  },
  {
    icon: Bug,
    title: "Patch",
    body: "Structured edits through git. The model proposes; deterministic code applies.",
  },
  {
    icon: ShieldCheck,
    title: "Verify",
    body: "Network-off sandbox, baseline-aware suite, then the revert check.",
  },
  {
    icon: Lock,
    title: "Human gate",
    body: "open_pull_request is code-gated. A confused model cannot skip approval.",
  },
  {
    icon: GitPullRequest,
    title: "Draft PR",
    body: "Idempotent draft with the repro test, the diff, and an honest confidence grade.",
  },
];

const MODES = [
  {
    name: "Strict",
    badge: "Mode A",
    body: "No strong reproduction → halt with a typed failure. Maximum integrity.",
  },
  {
    name: "Permissive",
    badge: "Default",
    body: "Weak evidence continues, but the confidence label rides into the PR.",
  },
  {
    name: "Vibes",
    badge: "Ablation",
    body: "Skip reproduction and claim success. Built only to prove why it is worse.",
  },
];

export function LandingSections() {
  return (
    <>
      <AnimatedSection id="pipeline" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <p className="text-center text-[11px] uppercase tracking-[0.22em] text-[#64748B]">Live pipeline</p>
        <h2 className="mt-3 text-center text-3xl font-semibold tracking-tight">
          Issue → Reproduce → Patch → Verify → PR
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-[#94A3B8]">
          The agent is a persisted state machine. Every transition is written before any side effect.
        </p>
        <div className="mt-10 rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[#0D111A]/80 px-4 py-8">
          <AgentPipeline current="verifying" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DataFlowLine from="Issue" to="Agent" />
          <DataFlowLine from="Agent" to="Sandbox" />
          <DataFlowLine from="Sandbox" to="Verify" />
          <DataFlowLine from="Approval" to="Pull Request" />
        </div>
      </AnimatedSection>

      <AnimatedSection id="features" className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#64748B]">Features</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">The verified loop</h2>
          </div>
          <Workflow className="hidden h-5 w-5 text-[#64748B] sm:block" strokeWidth={1.6} />
        </div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerContainer}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <AnimatedCard key={feature.title}>
                <Icon className="mb-4 h-5 w-5 text-[#60A5FA] transition-transform duration-200 group-hover:scale-105" strokeWidth={1.6} />
                <h3 className="text-base font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#94A3B8]">{feature.body}</p>
              </AnimatedCard>
            );
          })}
        </motion.div>
      </AnimatedSection>

      <AnimatedSection id="templates" className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#64748B]">Templates</p>
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
              <p className="mt-2 text-sm leading-6 text-[#94A3B8]">{mode.body}</p>
            </AnimatedCard>
          ))}
        </motion.div>
      </AnimatedSection>

      <AnimatedSection id="docs" className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#64748B]">Docs</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Five rules we never break</h2>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {[
            "Persist before side effect",
            "The model proposes, code disposes",
            "No secrets in the sandbox",
            "Every external write is idempotent",
            "Failures are typed, never free text",
          ].map((rule, i) => (
            <div
              key={rule}
              className="flex items-center gap-3 rounded-xl border border-[rgba(148,163,184,0.12)] bg-[#0D111A] px-4 py-3"
            >
              <span className="font-mono text-xs text-[#60A5FA]">0{i + 1}</span>
              <span className="text-sm text-[#E2E8F0]">{rule}</span>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <p className="mb-3 text-sm text-[#94A3B8]">Failure taxonomy</p>
          <div className="flex flex-wrap gap-2">
            {FAILURE_TYPES.map((type) => (
              <span
                key={type}
                className="card-interactive rounded-full border border-[rgba(148,163,184,0.12)] bg-[#111722] px-2.5 py-1 font-mono text-[10px] text-[#94A3B8]"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="pricing" className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#64748B]">Pricing</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Self-hosted engine</h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mt-8 grid gap-4 md:grid-cols-3"
        >
          <AnimatedCard>
            <p className="text-sm text-[#94A3B8]">Engine</p>
            <p className="mt-2 text-2xl font-semibold">Open</p>
            <p className="mt-2 text-sm text-[#94A3B8]">
              Run the worker, Neon, and the network-off sandbox on your keys.
            </p>
          </AnimatedCard>
          <AnimatedCard className="border-[rgba(59,130,246,0.28)]">
            <p className="text-sm text-[#93C5FD]">Dashboard</p>
            <p className="mt-2 text-2xl font-semibold">Included</p>
            <p className="mt-2 text-sm text-[#94A3B8]">
              Live runs, traces, approval, and eval — thin windows on the event log.
            </p>
          </AnimatedCard>
          <AnimatedCard>
            <p className="text-sm text-[#94A3B8]">Human gate</p>
            <p className="mt-2 text-2xl font-semibold">Required</p>
            <p className="mt-2 text-sm text-[#94A3B8]">
              Draft PRs only after a person approves. Autonomy is capped on purpose.
            </p>
          </AnimatedCard>
        </motion.div>
        <div className="mt-10 flex justify-center">
          <Link href="/runs">
            <Button variant="white">Open the dashboard</Button>
          </Link>
        </div>
      </AnimatedSection>
    </>
  );
}
