import { AppShell } from "@/components/layout/AppShell";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <AppShell title="Runs" crumbs="Dashboards / Runs">
      <TableSkeleton />
    </AppShell>
  );
}
