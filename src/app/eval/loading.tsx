import { AppShell } from "@/components/layout/AppShell";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <AppShell title="Evaluation" crumbs="Dashboards / Eval">
      <TableSkeleton rows={4} />
    </AppShell>
  );
}
