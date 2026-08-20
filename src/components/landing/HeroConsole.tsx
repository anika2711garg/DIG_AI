"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { LiveIndicator } from "@/components/motion/LiveIndicator";
import { LivePipeline } from "@/components/pipeline/LivePipeline";
import { LIVE_STATUS, PIPELINE_STAGES } from "@/lib/pipeline";

const LINES = [
  { t: "12:04:01", msg: "ingestor.screen — issue text fenced as data" },
  { t: "12:04:04", msg: "localizer.map — 184 files, stack-trace seed hit" },
  { t: "12:04:11", msg: "reproducer.write — failing test proposed" },
  { t: "12:04:19", msg: "sandbox.run — network-off · symptom matched" },
  { t: "12:04:27", msg: "patcher.apply — structured edit through git" },
  { t: "12:04:41", msg: "verifier.suite — baseline-aware · revert check" },
  { t: "12:04:48", msg: "gate.park — awaiting human approval" },
];

export function HeroConsole() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(reduce ? LINES.length : 2);
  const [stage, setStage] = useState(3);

  useEffect(() => {
    if (reduce) return;
    const logs = window.setInterval(() => {
      setVisible((n) => (n >= LINES.length ? 2 : n + 1));
    }, 1800);
    const stages = window.setInterval(() => {
      setStage((n) => (n + 1) % PIPELINE_STAGES.length);
    }, 2600);
    return () => {
      window.clearInterval(logs);
      window.clearInterval(stages);
    };
  }, [reduce]);

  const shown = LINES.slice(0, visible);
  const status = LIVE_STATUS[PIPELINE_STAGES[stage].id];

  return (
    <motion.div
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reduce ? 0.15 : 0.9, delay: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto mt-16 w-full max-w-5xl px-4 pb-20 sm:mt-20 sm:px-6"
    >
      <div className="pointer-events-none absolute left-1/2 top-10 h-56 w-[72%] -translate-x-1/2 rounded-full bg-[rgba(59,130,246,0.16)] blur-[100px]" />
      <div className="image-border relative overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[#0D111A]/88 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-[rgba(148,163,184,0.1)] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#EF4444]/70" />
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]/70" />
            <span className="h-2 w-2 rounded-full bg-[#22C55E]/70" />
            <span className="ml-2 font-mono text-[11px] text-[#64748B]">lumine · agent console</span>
          </div>
          <LiveIndicator label={status} pulse={!reduce} />
        </div>
        <div className="px-4 py-6 sm:px-6">
          <LivePipeline compact />
        </div>
        <div className="border-t border-[rgba(148,163,184,0.1)] bg-[#080B12]/80 px-4 py-3 font-mono text-[12px]">
          <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[#64748B]">
            event stream
            <span className="terminal-cursor" />
          </div>
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {shown.map((line) => (
                <motion.p
                  key={line.t + line.msg}
                  initial={reduce ? false : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[#94A3B8]"
                >
                  <span className="text-[#64748B]">{line.t}</span>
                  <span className="mx-2 text-[#60A5FA]">▸</span>
                  {line.msg}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
