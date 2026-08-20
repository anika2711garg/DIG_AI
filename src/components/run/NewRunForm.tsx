"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { parseGithubIssue } from "@/lib/github";
import { readPreferences } from "@/lib/preferences";
import type { Repo } from "@/lib/types";

const FIELD =
  "mt-1.5 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--background-mid)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[rgba(96,165,250,0.45)]";

export function NewRunForm({ repos }: { repos: Repo[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [repoId, setRepoId] = useState(repos[0]?.id ? String(repos[0].id) : "");
  const [fullName, setFullName] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [mode, setMode] = useState(() => readPreferences().defaultMode);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function onIssueChange(value: string) {
    const parsed = parseGithubIssue(value);
    if (parsed) {
      setFullName(parsed.fullName);
      setIssueNumber(String(parsed.issueNumber));
      const existing = repos.find((repo) => repo.fullName.toLowerCase() === parsed.fullName.toLowerCase());
      if (existing) setRepoId(String(existing.id));
      return;
    }
    setIssueNumber(value);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      let selectedRepo = Number(repoId);
      if (!selectedRepo && fullName.trim()) {
        const created = await api.createRepo({ fullName: fullName.trim() });
        selectedRepo = created.id;
      }
      const issue = Number(issueNumber);
      if (!selectedRepo || !Number.isInteger(issue) || issue <= 0) {
        throw new Error("Repository and a valid issue number are required");
      }
      const run = await api.createRun({
        repoId: selectedRepo,
        issueNumber: issue,
        mode,
      });
      await api.startRun(run.id).catch(() => undefined);
      push("Run started", "success");
      router.push(`/runs/${run.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start run");
    } finally {
      setPending(false);
    }
  }

  return (
    <form id="new-run" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {repos.length > 0 ? (
        <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Repository
          <select value={repoId} onChange={(e) => setRepoId(e.target.value)} className={FIELD}>
            {repos.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.fullName}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Repository
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="owner/name"
            className={FIELD}
          />
        </label>
      )}
      <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        Issue number or URL
        <input
          value={issueNumber}
          onChange={(e) => onIssueChange(e.target.value)}
          placeholder="412 or github.com/…/issues/412"
          className={FIELD}
        />
      </label>
      <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        <Tooltip content="Strict stops without a strong reproduction. Permissive continues with a grade.">
          <span>Mode</span>
        </Tooltip>
        <select value={mode} onChange={(e) => setMode(e.target.value)} className={FIELD}>
          <option value="permissive">permissive</option>
          <option value="strict">strict</option>
          <option value="vibes">vibes (ablation)</option>
        </select>
      </label>
      <div className="flex items-end">
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Starting…" : "Start run"}
        </Button>
      </div>
      {error ? <p className="text-xs text-[#FCA5A5] sm:col-span-2 lg:col-span-4">{error}</p> : null}
    </form>
  );
}
