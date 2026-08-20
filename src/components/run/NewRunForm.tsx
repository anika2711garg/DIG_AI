"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { Repo } from "@/lib/types";

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
      if (!selectedRepo || !issueNumber) {
        throw new Error("Repository and issue number are required");
      }
      const run = await api.createRun({
        repoId: selectedRepo,
        issueNumber: Number(issueNumber),
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
    <form
      onSubmit={onSubmit}
      className="grid gap-3 rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[#0D111A] p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {repos.length > 0 ? (
        <label className="text-xs text-[#94A3B8]">
          Repository
          <select
            value={repoId}
            onChange={(e) => setRepoId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#080B12] px-3 py-2 text-sm text-[#F8FAFC]"
          >
            {repos.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.fullName}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="text-xs text-[#94A3B8]">
          Repository
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="owner/name"
            className="mt-1 w-full rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#080B12] px-3 py-2 text-sm text-[#F8FAFC]"
          />
        </label>
      )}
      <label className="text-xs text-[#94A3B8]">
        Issue number
        <input
          value={issueNumber}
          onChange={(e) => setIssueNumber(e.target.value)}
          placeholder="412"
          inputMode="numeric"
          className="mt-1 w-full rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#080B12] px-3 py-2 text-sm text-[#F8FAFC]"
        />
      </label>
      <label className="text-xs text-[#94A3B8]">
        Mode
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#080B12] px-3 py-2 text-sm text-[#F8FAFC]"
        >
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
