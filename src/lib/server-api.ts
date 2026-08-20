import { createApiServer } from "@libs/api/server";

import { getEngineDb } from "./engine-db";
import type { Approval, Repo, Run, RunEvent, Trace } from "./types";

function engine() {
  return createApiServer(getEngineDb());
}

async function read<T>(path: string): Promise<T> {
  const res = await engine().request(path);
  return (await res.json()) as T;
}

export async function fetchRepos(): Promise<Repo[]> {
  try {
    return await read<Repo[]>("/api/v1/repositories");
  } catch {
    return [];
  }
}

export async function fetchRuns(): Promise<Run[]> {
  try {
    const runs = await read<Run[]>("/api/v1/runs");
    return runs.filter((run) => run.issueNumber != null && run.repoId != null);
  } catch {
    return [];
  }
}

export async function fetchRun(id: string): Promise<Run | null> {
  try {
    const run = await read<Run & { error?: unknown }>(`/api/v1/runs/${id}`);
    if ("error" in run && run.error) return null;
    if (run.issueNumber == null || run.repoId == null) return null;
    return run;
  } catch {
    return null;
  }
}

export async function fetchEvents(id: string): Promise<RunEvent[]> {
  try {
    return await read<RunEvent[]>(`/api/v1/runs/${id}/events`);
  } catch {
    return [];
  }
}

export async function fetchTraces(id: string): Promise<Trace[]> {
  try {
    return await read<Trace[]>(`/api/v1/runs/${id}/traces`);
  } catch {
    return [];
  }
}

export async function fetchApproval(id: string): Promise<Approval | null> {
  try {
    const approval = await read<Approval & { error?: unknown }>(`/api/v1/runs/${id}/approval`);
    if ("error" in approval && approval.error) return null;
    return approval;
  } catch {
    return null;
  }
}
