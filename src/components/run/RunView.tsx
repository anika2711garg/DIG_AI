"use client";

import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AgentPipeline } from "@/components/pipeline/AgentPipeline";
import { EventStream } from "@/components/run/EventStream";
import { EvidenceCard } from "@/components/run/EvidenceCard";
import { ReproductionPanel } from "@/components/run/ReproductionPanel";
import { VerifyTrack } from "@/components/run/VerifyTrack";
import { ConnectionStatus, type LinkState } from "@/components/ui/ConnectionStatus";
import { CopyButton } from "@/components/ui/CopyButton";
import { CostIndicator } from "@/components/ui/CostIndicator";
import { FailureBadge } from "@/components/ui/FailureBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import { api } from "@/lib/api";
import { issueUrl } from "@/lib/github";
import { LIVE_STATUS } from "@/lib/pipeline";
import { formatDuration } from "@/lib/relative-time";
import { isActiveState, runLabel, runTone } from "@/lib/status";
import type { Repo, Run, RunEvent, RunState } from "@/lib/types";

const SSE_EVENT_TYPES = [
  "run.created",
  "run.state.created",
  "run.state.ingesting",
  "run.state.localizing",
  "run.state.reproducing",
  "run.state.patching",
  "run.state.verifying",
  "run.state.awaiting_human",
  "run.state.opening_pr",
  "run.state.done",
  "run.state.failed",
  "run.state.cancelled",
];

function asRunState(value: unknown): RunState | undefined {
  return typeof value === "string" && Object.hasOwn(LIVE_STATUS, value) ? (value as RunState) : undefined;
}

export function RunView({ initialRun, initialEvents }: { initialRun: Run; initialEvents: RunEvent[] }) {
  const [run, setRun] = useState(initialRun);
  const [events, setEvents] = useState(initialEvents);
  const [elapsed, setElapsed] = useState(0);
  const [link, setLink] = useState<LinkState>("polling");
  const [repo, setRepo] = useState<Repo | null>(null);

  useEffect(() => {
    api.listRepos()
      .then((repos) => setRepo(repos.find((item) => item.id === initialRun.repoId) ?? null))
      .catch(() => undefined);
  }, [initialRun.repoId]);

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
          setLink((current) => (current === "offline" ? "polling" : current));
        }
      } catch {
        if (!cancelled) setLink("offline");
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
    source.onopen = () => setLink("live");
    const ingest = (message: MessageEvent) => {
      try {
        const data = JSON.parse(message.data) as Record<string, unknown>;
        const eventId = Number(message.lastEventId);
        const eventType = message.type && message.type !== "message" ? message.type : "event";
        const nextState =
          asRunState(data.state) ??
          asRunState(data.to) ??
          asRunState(eventType.startsWith("run.state.") ? eventType.slice("run.state.".length) : undefined);
        setEvents((prev) => {
          if (Number.isFinite(eventId) && eventId > 0 && prev.some((event) => event.id === eventId)) {
            return prev;
          }
          return [
            ...prev,
            {
              id: Number.isFinite(eventId) && eventId > 0 ? eventId : (prev.at(-1)?.id ?? 0) + 1,
              runId: run.id,
              type: eventType,
              state: nextState,
              dataJson: data,
              at: new Date().toISOString(),
            },
          ];
        });
        if (nextState) {
          setRun((current) => (current.state === nextState ? current : { ...current, state: nextState }));
        }
      } catch {
        /* ignore malformed SSE */
      }
    };
    source.onmessage = ingest;
    for (const type of SSE_EVENT_TYPES) {
      source.addEventListener(type, ingest);
    }
    source.onerror = () => {
      setLink("polling");
      source.close();
    };
    return () => source.close();
  }, [run.id]);

  const tone = runTone(run.state);
  const latest = events.at(-1);
  const github = repo ? issueUrl(repo.fullName, run.issueNumber) : null;

  const resources = useMemo(
    () => [
      { label: "Issue", value: `#${run.issueNumber}` },
      { label: "Mode", value: run.mode },
      { label: "Elapsed", value: formatDuration(elapsed) },
      { label: "Attempt", value: `${run.currentAttempt ?? 1} / ${run.maxAttempts ?? 3}` },
    ],
    [elapsed, run.currentAttempt, run.issueNumber, run.maxAttempts, run.mode],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/runs" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text)]">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.7} />
          All runs
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <ConnectionStatus state={link} />
          <StatusBadge label={runLabel(run.state)} tone={tone} pulse={isActiveState(run.state)} />
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] text-[var(--text-muted)]">{repo?.fullName ?? `repo #${run.repoId}`}</p>
          <h2 className="mt-1 text-lg font-medium text-[var(--text)]">Issue #{run.issueNumber}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{LIVE_STATUS[run.state]}</p>
          {latest ? (
            <p className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">Latest: {latest.type}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={String(run.id)} label={`#${run.id}`} />
          {github ? (
            <a
              href={github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--accent-text)]"
            >
              GitHub <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          <FailureBadge type={run.failureType} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {resources.map((item) => (
          <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{item.label}</p>
            <p className="mt-1 font-mono text-sm text-[var(--text)]">{item.value}</p>
          </div>
        ))}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">Budget</p>
          <div className="mt-2">
            <CostIndicator spent={run.spentUsd} budget={run.budgetUsd} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-6">
        <AgentPipeline current={run.state} compact />
        <p className="mt-3 text-center font-mono text-[11px] text-[var(--text-muted)]">
          Attempt {run.currentAttempt ?? 1} / {run.maxAttempts ?? 3}
        </p>
      </div>

      <EvidenceCard state={run.state} confidence={run.confidence} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ReproductionPanel state={run.state} confidence={run.confidence} />
        <VerifyTrack state={run.state} />
      </div>

      <EventStream events={events} />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={`/runs/${run.id}/trace`} className="text-[var(--accent-text)] hover:underline">
          Open trace
        </Link>
        <Link href={`/runs/${run.id}/approval`} className="text-[var(--accent-text)] hover:underline">
          Approval gate
        </Link>
        <Tooltip content="Tokens consumed by model calls on this run.">
          <span className="text-[var(--text-muted)]">
            {run.tokensUsed ?? 0} / {run.tokenBudget ?? "—"} tokens
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
