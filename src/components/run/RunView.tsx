"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { LiveIndicator } from "@/components/motion/LiveIndicator";
import { AgentPipeline } from "@/components/pipeline/AgentPipeline";
import { EventStream } from "@/components/run/EventStream";
import { ReproductionPanel } from "@/components/run/ReproductionPanel";
import { VerifyTrack } from "@/components/run/VerifyTrack";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api } from "@/lib/api";
import { LIVE_STATUS } from "@/lib/pipeline";
import { isActiveState, runLabel, runTone } from "@/lib/status";
import type { Run, RunEvent } from "@/lib/types";

export function RunView({ initialRun, initialEvents }: { initialRun: Run; initialEvents: RunEvent[] }) {
  const [run, setRun] = useState(initialRun);
  const [events, setEvents] = useState(initialEvents);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = run.startedAt ? new Date(run.startedAt).getTime() : Date.now();
    const tick = () => setElapsed(Math.max(0, Date.now() - started));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [run.startedAt]);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const [nextRun, nextEvents] = await Promise.all([api.getRun(run.id), api.listEvents(run.id)]);
        if (!cancelled) {
          setRun(nextRun);
          setEvents(nextEvents);
        }
      } catch {
        /* keep last good snapshot */
      }
    };
    const id = window.setInterval(pull, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [run.id]);

  useEffect(() => {
    const source = new EventSource(`/api/v1/runs/${run.id}/stream`);
    source.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data) as Record<string, unknown>;
        setEvents((prev) => [
          ...prev,
          {
            id: Number(message.lastEventId || prev.length + 1),
            runId: run.id,
            type: message.type || "event",
            state: typeof data.state === "string" ? (data.state as Run["state"]) : run.state,
            dataJson: data,
            at: new Date().toISOString(),
          },
        ]);
      } catch {
        /* ignore malformed SSE */
      }
    };
    return () => source.close();
  }, [run.id, run.state]);

  const seconds = useMemo(() => Math.floor(elapsed / 1000), [elapsed]);
  const tone = runTone(run.state);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/runs" className="inline-flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC]">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.7} />
          All runs
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={runLabel(run.state)} tone={tone} pulse={isActiveState(run.state)} />
          <LiveIndicator
            label={LIVE_STATUS[run.state]}
            tone={tone}
            pulse={isActiveState(run.state)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Issue" value={`#${run.issueNumber}`} />
        <Metric label="Mode" value={run.mode} />
        <Metric label="Elapsed" value={`${seconds}s`} />
        <Metric label="Spend" value={`$${Number(run.spentUsd ?? 0).toFixed(4)}`} />
      </div>

      <div className="rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[#0D111A] px-4 py-6">
        <AgentPipeline current={run.state} compact />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReproductionPanel state={run.state} confidence={run.confidence} />
        <VerifyTrack state={run.state} />
      </div>

      <EventStream events={events} />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={`/runs/${run.id}/trace`} className="text-[#93C5FD] hover:underline">
          Open trace
        </Link>
        <Link href={`/runs/${run.id}/approval`} className="text-[#93C5FD] hover:underline">
          Approval gate
        </Link>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgba(148,163,184,0.12)] bg-[#0D111A] px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[#64748B]">{label}</p>
      <p className="mt-1 font-mono text-sm text-[#F8FAFC]">{value}</p>
    </div>
  );
}
