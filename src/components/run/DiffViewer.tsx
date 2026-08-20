export function DiffViewer({ diff }: { diff?: string | null }) {
  const lines = diff && diff.trim().length > 0 ? diff.split("\n") : [];

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[rgba(148,163,184,0.16)] bg-[#080B12] px-4 py-10 text-center">
        <p className="text-sm text-[#94A3B8]">No patch diff is attached to this run yet.</p>
        <p className="mt-1 text-xs text-[#64748B]">The canonical diff appears here after the patcher writes a structured edit.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[#080B12]">
      <div className="border-b border-[rgba(148,163,184,0.1)] px-4 py-2 font-mono text-[11px] text-[#64748B]">
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
                    : "text-[#94A3B8] hover:bg-[#111722]"
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
