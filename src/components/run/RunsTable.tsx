"use client";

import { Inbox } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { isActiveState, runLabel, runTone } from "@/lib/status";
import type { Run } from "@/lib/types";

export function RunsTable({ runs }: { runs: Run[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return runs;
    return runs.filter((run) => {
      const haystack = [String(run.id), String(run.issueNumber), run.mode, run.state, run.confidence ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, runs]);

  if (runs.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No runs yet"
        description="Start a run from a repository and issue number. The worker persists every state change before it touches the sandbox."
      />
    );
  }

  return (
    <div className="space-y-4">
      <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#64748B]">
        Filter
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="id, issue, mode, or state"
          className="mt-1.5 w-full rounded-lg border border-[rgba(148,163,184,0.14)] bg-[#080B12] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none focus:border-[rgba(96,165,250,0.45)] sm:max-w-sm"
        />
      </label>
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[rgba(148,163,184,0.16)] px-4 py-8 text-center text-sm text-[#94A3B8]">
          No runs match “{query.trim()}”.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[rgba(148,163,184,0.12)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#111722]/80 text-[11px] uppercase tracking-[0.14em] text-[#64748B]">
              <tr>
                <th className="px-4 py-3 font-medium">Run</th>
                <th className="px-4 py-3 font-medium">Issue</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((run) => (
                <tr key={run.id} className="border-t border-[rgba(148,163,184,0.08)] hover:bg-[#111722]/70">
                  <td className="px-4 py-3">
                    <Link href={`/runs/${run.id}`} className="font-mono text-[#93C5FD]">
                      #{run.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#E2E8F0]">#{run.issueNumber}</td>
                  <td className="px-4 py-3 text-[#94A3B8]">{run.mode}</td>
                  <td className="px-4 py-3 text-[#94A3B8]">{run.confidence ?? "—"}</td>
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
