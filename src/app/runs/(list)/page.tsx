export const dynamic = "force-dynamic";

import { Suspense } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { NewRunForm } from "@/components/run/NewRunForm";
import { RunsTable } from "@/components/run/RunsTable";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { fetchRepos, fetchRuns } from "@/lib/server-api";

export default async function RunsPage() {
  const [runs, repos] = await Promise.all([fetchRuns(), fetchRepos()]);

  return (
    <AppShell title="Runs" crumbs="Dashboards / Runs">
      <div className="mb-8 border-b border-[var(--border-subtle)] pb-6">
        <NewRunForm repos={repos} />
      </div>
      <Suspense fallback={<TableSkeleton />}>
        <RunsTable runs={runs} repos={repos} />
      </Suspense>
    </AppShell>
  );
}
