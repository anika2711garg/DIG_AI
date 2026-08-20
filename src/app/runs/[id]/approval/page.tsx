import Link from "next/link";
import { notFound } from "next/navigation";

import { ApprovalView } from "@/components/approval/ApprovalView";
import { AppShell } from "@/components/layout/AppShell";
import { fetchApproval, fetchRun } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function ApprovalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await fetchRun(id);
  if (!run) notFound();
  const approval = await fetchApproval(id);

  return (
    <AppShell title={`Approval #${run.id}`} crumbs={`Runs / ${run.id} / Approval`}>
      <Link href={`/runs/${run.id}`} className="mb-4 inline-block text-sm text-[var(--text-secondary)] hover:text-[var(--text)]">
        Back to run
      </Link>
      <ApprovalView run={run} approval={approval} />
    </AppShell>
  );
}
