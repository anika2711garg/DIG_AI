"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";

export function ErrorState({
  title,
  explanation,
  onRetry,
  detail,
}: {
  title: string;
  explanation: string;
  onRetry?: () => void;
  detail?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.06)] px-4 py-6">
      <p className="text-sm font-medium text-[var(--text)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{explanation}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
        {detail ? (
          <Button variant="ghost" onClick={() => setOpen((v) => !v)}>
            {open ? "Hide details" : "Technical details"}
          </Button>
        ) : null}
      </div>
      {open && detail ? (
        <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--background-mid)] p-3 font-mono text-[11px] text-[var(--text-muted)]">
          {detail}
        </pre>
      ) : null}
    </div>
  );
}
