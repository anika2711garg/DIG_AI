import { EvalDashboard } from "@/components/eval/EvalDashboard";
import { AppShell } from "@/components/layout/AppShell";
import { fetchRuns } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function EvalPage() {
  const runs = await fetchRuns();

  return (
    <AppShell title="Evaluation" crumbs="Dashboards / Eval">
      <p className="mb-8 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
        Dual-reported from persisted runs: overall resolve rate and the stages that actually produced
        evidence. Empty until the worker writes results.
      </p>
      <EvalDashboard runs={runs} />
    </AppShell>
  );
}
