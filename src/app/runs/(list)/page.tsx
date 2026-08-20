export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { NewRunForm } from "@/components/run/NewRunForm";
import { RunsTable } from "@/components/run/RunsTable";
import { fetchRepos, fetchRuns } from "@/lib/server-api";

export default async function RunsPage() {
  const [runs, repos] = await Promise.all([fetchRuns(), fetchRepos()]);

  return (
    <AppShell title="Runs" crumbs="Dashboards / Runs">
      <div className="mb-8 border-b border-[rgba(148,163,184,0.08)] pb-6">
        <NewRunForm repos={repos} />
      </div>
      <RunsTable runs={runs} />
    </AppShell>
  );
}
