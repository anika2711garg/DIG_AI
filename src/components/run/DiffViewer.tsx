export function DiffViewer({ diff }: { diff?: string | null }) {
  const lines = diff && diff.trim().length > 0 ? diff.split("\n") : [];

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--background-mid)] px-4 py-10 text-center">
        <p className="text-sm text-[var(--text-secondary)]">No patch diff is attached to this run yet.</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">The canonical diff appears here after the patcher writes a structured edit.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-mid)]">
      <div className="border-b border-[var(--border)] px-4 py-2 font-mono text-[11px] text-[var(--text-muted)]">
        canonical.diff
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-6">
        {lines.map((line, i) => {
          const added = line.startsWith("+") && !line.startsWith("+++");
          const removed = line.startsWith("-") && !line.startsWith("---");
          return (
            <div
              key={`${i}-${line}`}
              className={
                added
                  ? "bg-[rgba(34,197,94,0.08)] text-[#86EFAC] hover:bg-[rgba(34,197,94,0.14)]"
                  : removed
                    ? "bg-[rgba(239,68,68,0.08)] text-[#FCA5A5] hover:bg-[rgba(239,68,68,0.14)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--card-hover)]"
              }
            >
              {line}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
