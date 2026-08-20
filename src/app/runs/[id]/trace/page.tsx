import { GitBranch } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { TraceView } from "@/components/trace/TraceView";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchRun, fetchTraces } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function TracePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await fetchRun(id);
  if (!run) notFound();
  const traces = await fetchTraces(id);

  return (
    <AppShell title={`Trace #${run.id}`} crumbs={`Runs / ${run.id} / Trace`}>
      <Link href={`/runs/${run.id}`} className="mb-4 inline-block text-sm text-[var(--text-secondary)] hover:text-[var(--text)]">
        Back to run
      </Link>
      {traces.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No traces recorded"
          description="Model calls, tool calls, and test commands appear here as the worker writes the trace log."
        />
      ) : (
        <TraceView traces={traces} />
      )}
    </AppShell>
  );
}
