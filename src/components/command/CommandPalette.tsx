"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useTheme } from "@/lib/theme";

interface Command {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const { cycleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(
    () => [
      { id: "runs", label: "Go to Runs", hint: "Dashboard", run: () => router.push("/runs") },
      { id: "eval", label: "Go to Evaluation", run: () => router.push("/eval") },
      { id: "settings", label: "Open Settings", run: () => router.push("/settings") },
      { id: "new", label: "Start New Run", run: () => router.push("/runs#new-run") },
      { id: "approval", label: "Go to Approval queue", hint: "Filter awaiting", run: () => router.push("/runs?status=awaiting") },
      { id: "traces", label: "Go to Traces", hint: "Open a run first", run: () => router.push("/runs") },
      { id: "theme", label: "Toggle Theme", run: () => cycleTheme() },
    ],
    [cycleTheme, router],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = commands.filter((item) => item.label.toLowerCase().includes(needle) || item.hint?.toLowerCase().includes(needle));
    const runId = Number(query.trim());
    if (Number.isInteger(runId) && runId > 0) {
      return [{ id: "goto", label: `Open run #${runId}`, run: () => router.push(`/runs/${runId}`) }, ...list];
    }
    return list;
  }, [commands, query, router]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
        setQuery("");
        setActive(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((i) => Math.min(filtered.length - 1, i + 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      }
      if (event.key === "Enter") {
        event.preventDefault();
        filtered[active]?.run();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, filtered, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-start justify-center px-4 pt-[12vh]">
      <button type="button" aria-label="Close command palette" className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
      >
        <input
          ref={input}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          placeholder="Search commands or a run id…"
          className="w-full border-b border-[var(--border)] bg-transparent px-4 py-3 text-sm text-[var(--text)] outline-none"
        />
        <ul className="max-h-72 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">No matching commands</li>
          ) : (
            filtered.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    item.run();
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                    index === active ? "bg-[var(--card-hover)] text-[var(--text)]" : "text-[var(--text-secondary)]"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.hint ? <span className="text-[11px] text-[var(--text-muted)]">{item.hint}</span> : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
