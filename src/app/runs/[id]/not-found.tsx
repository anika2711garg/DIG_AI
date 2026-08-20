import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";

export default function RunNotFound() {
  return (
    <AppShell title="Run not found" crumbs="Runs / unknown">
      <div className="py-16 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#64748B]">404</p>
        <h2 className="mt-2 text-xl font-semibold">This run does not exist</h2>
        <p className="mt-2 text-sm text-[#94A3B8]">
          The id is not in the event log, or the worker never created this run.
        </p>
        <div className="mt-6">
          <Button href="/runs" variant="white">
            Back to runs
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
