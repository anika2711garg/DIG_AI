"use client";

import { Inbox } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { CostIndicator } from "@/components/ui/CostIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import { FailureBadge } from "@/components/ui/FailureBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatStamp, formatExact } from "@/lib/relative-time";
import { usePreferences } from "@/lib/preferences";
import { isActiveState, runLabel, runTone } from "@/lib/status";
import type { Confidence, Repo, Run } from "@/lib/types";

type StatusFilter = "all" | "running" | "awaiting" | "completed" | "failed";

function matchesStatus(run: Run, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "awaiting") return run.state === "awaiting_human";
  if (filter === "completed") return run.state === "done";
  if (filter === "failed") return run.state === "failed" || run.state === "cancelled";
  return isActiveState(run.state);
}

export function RunsTable({ runs, repos = [] }: { runs: Run[]; repos?: Repo[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const { timestamps } = usePreferences();
  const query = params.get("q") ?? "";
  const status = (params.get("status") as StatusFilter | null) ?? "all";
  const confidence = (params.get("confidence") as Confidence | "all" | null) ?? "all";
  const sort = params.get("sort") ?? "newest";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    router.replace(`/runs${next.toString() ? `?${next}` : ""}`, { scroll: false });
  }

  const filtered = useMemo(() => {
    const repoName = (id: number) => repos.find((repo) => repo.id === id)?.fullName ?? `#${id}`;
    const needle = query.trim().toLowerCase();
    const list = runs.filter((run) => {
      if (!matchesStatus(run, status)) return false;
      if (confidence !== "all" && run.confidence !== confidence) return false;
      if (!needle) return true;
      const haystack = [String(run.id), String(run.issueNumber), run.mode, run.state, run.confidence ?? "", repoName(run.repoId)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
    return list.sort((a, b) => {
      if (sort === "oldest") return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
      if (sort === "cost") return Number(b.spentUsd ?? 0) - Number(a.spentUsd ?? 0);
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [confidence, query, repos, runs, sort, status]);

  if (runs.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No runs yet"
        description="Start an Issue-to-PR run to see the agent pipeline here."
        action={
          <Button href="/runs#new-run" variant="white">
            Start a Run
          </Button>
        }
      />
    );
  }

  const field =
    "rounded-lg border border-[var(--border-strong)] bg-[var(--background-mid)] px-3 py-2 text-sm text-[var(--text)]";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Search
          <input
            value={query}
            onChange={(event) => setParam("q", event.target.value)}
            placeholder="id, issue, repo, state"
            className={`mt-1.5 block w-44 ${field}`}
          />
        </label>
        <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Status
          <select value={status} onChange={(event) => setParam("status", event.target.value)} className={`mt-1.5 block ${field}`}>
            <option value="all">All</option>
            <option value="running">Running</option>
            <option value="awaiting">Awaiting approval</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Confidence
          <select value={confidence} onChange={(event) => setParam("confidence", event.target.value)} className={`mt-1.5 block ${field}`}>
            <option value="all">All</option>
            <option value="strong">Strong</option>
            <option value="weak">Weak</option>
            <option value="unreproduced">Unreproduced</option>
          </select>
        </label>
        <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Sort
          <select value={sort} onChange={(event) => setParam("sort", event.target.value)} className={`mt-1.5 block ${field}`}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="cost">Cost</option>
          </select>
        </label>
        {query || status !== "all" || confidence !== "all" || sort !== "newest" ? (
          <button type="button" onClick={() => router.replace("/runs")} className="self-end text-xs text-[var(--accent-text)]">
            Clear filters
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No runs match these filters"
          description="Try another status or clear the current query."
          action={
            <Button variant="secondary" onClick={() => router.replace("/runs")}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-[var(--card-hover)] text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Run</th>
                <th className="px-4 py-3 font-medium">Repo</th>
                <th className="px-4 py-3 font-medium">Issue</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
                <th className="px-4 py-3 font-medium">Cost</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((run) => (
                <tr key={run.id} className="border-t border-[var(--border-subtle)] hover:bg-[var(--card-hover)]">
                  <td className="px-4 py-3">
                    <Link href={`/runs/${run.id}`} className="font-mono text-[var(--accent-text)]">
                      #{run.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {repos.find((repo) => repo.id === run.repoId)?.fullName ?? `#${run.repoId}`}
                  </td>
                  <td className="px-4 py-3 text-[var(--text)]">#{run.issueNumber}</td>
                  <td className="px-4 py-3">
                    <ConfidenceBadge value={run.confidence} />
                    <div className="mt-1">
                      <FailureBadge type={run.failureType} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <CostIndicator spent={run.spentUsd} budget={run.budgetUsd} />
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]" title={formatExact(run.createdAt)}>
                    {formatStamp(run.createdAt, timestamps)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={runLabel(run.state)}
                      tone={runTone(run.state)}
                      pulse={isActiveState(run.state)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
