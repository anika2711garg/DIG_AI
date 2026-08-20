import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { RunView } from "@/components/run/RunView";
import { fetchEvents, fetchRun } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await fetchRun(id);
  if (!run) notFound();
  const events = await fetchEvents(id);

  return (
    <AppShell title={`Run #${run.id}`} crumbs={`Runs / ${run.id}`}>
      <RunView initialRun={run} initialEvents={events} />
    </AppShell>
  );
}
