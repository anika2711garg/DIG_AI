"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { Repo } from "@/lib/types";

const FIELD =
  "mt-1.5 w-full rounded-lg border border-[rgba(148,163,184,0.14)] bg-[#080B12] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none focus:border-[rgba(96,165,250,0.45)]";

export function NewRunForm({ repos }: { repos: Repo[] }) {
  const router = useRouter();
  const [repoId, setRepoId] = useState(repos[0]?.id ? String(repos[0].id) : "");
  const [fullName, setFullName] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [mode, setMode] = useState("permissive");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
      router.push(`/runs/${run.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start run");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {repos.length > 0 ? (
        <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#64748B]">
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
        <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#64748B]">
          Repository
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="owner/name"
            className={FIELD}
          />
        </label>
      )}
      <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#64748B]">
        Issue number
        <input
          value={issueNumber}
          onChange={(e) => setIssueNumber(e.target.value)}
          placeholder="412"
          inputMode="numeric"
          className={FIELD}
        />
      </label>
      <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#64748B]">
        Mode
        <select value={mode} onChange={(e) => setMode(e.target.value)} className={FIELD}>
          <option value="permissive">permissive</option>
          <option value="strict">strict</option>
          <option value="vibes">vibes</option>
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
