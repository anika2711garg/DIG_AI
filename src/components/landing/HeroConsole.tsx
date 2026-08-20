"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { LaptopFrame } from "@/components/chrome/LaptopFrame";
import { LivePipeline } from "@/components/pipeline/LivePipeline";
import { useMotionPreference } from "@/lib/use-motion-preference";

const LINES = [
  { t: "12:04:01", msg: "ingestor: issue #412 pulled, stack-trace locations extracted" },
  { t: "12:04:04", msg: "localizer: parser.py:88 ranked first" },
  { t: "12:04:11", msg: "reproducer: failing test written, symptom matched" },
  { t: "12:04:19", msg: "sandbox: network-off run complete" },
  { t: "12:04:27", msg: "patcher: structured edit applied through git" },
  { t: "12:04:41", msg: "verifier: baseline-aware suite + revert check passed" },
  { t: "12:04:48", msg: "gate: parked for human approval" },
];

export function HeroConsole() {
  const reduce = useMotionPreference();
  const [visible, setVisible] = useState(2);

  useEffect(() => {
    if (reduce) {
      return;
    }
    const logs = window.setInterval(() => {
      setVisible((n) => (n >= LINES.length ? 2 : n + 1));
    }, 1800);
    return () => window.clearInterval(logs);
  }, [reduce]);

  const shown = LINES.slice(0, reduce ? LINES.length : visible);

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.95, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto mt-12 w-full max-w-[1500px] px-3 pb-6 sm:mt-16 sm:px-6 lg:px-10"
    >
      <LaptopFrame path="~/itp/worker.log" status="Agent running" pulse={!reduce} tilt>
        <div className="px-4 py-8 sm:px-8 sm:py-10">
          <LivePipeline />
        </div>
        <div className="border-t border-[rgba(148,163,184,0.1)] bg-[#080B12]/80 px-4 py-4 font-mono text-[12px] sm:px-8">
          <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[#64748B]">
            event stream
            <span className="terminal-cursor" />
          </div>
          <div className="min-h-[9.5rem] space-y-1.5">
            <AnimatePresence initial={false}>
              {shown.map((line) => (
                <motion.p
                  key={line.t + line.msg}
                  initial={{ opacity: 0, x: -6 }}
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
      </LaptopFrame>
    </motion.div>
  );
}
