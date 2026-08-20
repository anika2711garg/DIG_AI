"use client";

import { useEffect, useState } from "react";

import { AgentPipeline } from "@/components/pipeline/AgentPipeline";
import { LIVE_STATUS, PIPELINE_STAGES } from "@/lib/pipeline";
import type { RunState } from "@/lib/types";
import { useMotionPreference } from "@/lib/use-motion-preference";

const DEMO_STATES = PIPELINE_STAGES.map((stage) => stage.id);

export function LivePipeline({ compact = false }: { compact?: boolean }) {
  const reduce = useMotionPreference();
  const [index, setIndex] = useState(3);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % DEMO_STATES.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [reduce]);

  const current = DEMO_STATES[index] as RunState;

  return (
    <div className="space-y-5">
      <AgentPipeline current={current} compact={compact} />
      <p className="text-center font-mono text-[11px] tracking-[0.14em] text-[var(--text-muted)]">
        {LIVE_STATUS[current]}
      </p>
    </div>
  );
}
