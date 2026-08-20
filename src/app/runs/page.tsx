import { Inbox } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { NewRunForm } from "@/components/run/NewRunForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fetchRepos, fetchRuns } from "@/lib/server-api";
import { isActiveState, runLabel, runTone } from "@/lib/status";

export default async function RunsPage() {
  const [runs, repos] = await Promise.all([fetchRuns(), fetchRepos()]);

  return (
    <AppShell title="Order List" crumbs="Dashboards / Runs">
      <div className="mb-5">
        <NewRunForm repos={repos} />
      </div>
      {runs.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No runs yet"
          description="Start a run from a repository and issue number. The worker persists every state change before it touches the sandbox."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.12)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#111722] text-[11px] uppercase tracking-[0.14em] text-[#64748B]">
              <tr>
                <th className="px-4 py-3 font-medium">Run</th>
                <th className="px-4 py-3 font-medium">Issue</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-t border-[rgba(148,163,184,0.08)] hover:bg-[#111722]">
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
    </AppShell>
  );
}
