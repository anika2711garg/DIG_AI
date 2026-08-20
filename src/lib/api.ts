import type { Approval, Repo, Run, RunEvent, Trace } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  listRepos: () => request<Repo[]>("/api/v1/repositories"),
  createRepo: (body: { fullName: string; defaultBranch?: string; cloneUrl?: string }) =>
    request<Repo>("/api/v1/repositories", { method: "POST", body: JSON.stringify(body) }),
  listRuns: () => request<Run[]>("/api/v1/runs"),
  getRun: (id: number | string) => request<Run>(`/api/v1/runs/${id}`),
  createRun: (body: { repoId: number; issueNumber: number; mode?: string; budgetUsd?: number }) =>
    request<Run>("/api/v1/runs", { method: "POST", body: JSON.stringify(body) }),
  startRun: (id: number | string) =>
    request<Run>(`/api/v1/runs/${id}/start`, { method: "POST", body: JSON.stringify({}) }),
  cancelRun: (id: number | string) =>
    request<Run>(`/api/v1/runs/${id}/cancel`, { method: "POST", body: JSON.stringify({}) }),
  listEvents: (id: number | string) => request<RunEvent[]>(`/api/v1/runs/${id}/events`),
  listTraces: (id: number | string) => request<Trace[]>(`/api/v1/runs/${id}/traces`),
  getApproval: (id: number | string) => request<Approval>(`/api/v1/runs/${id}/approval`),
  approve: (id: number | string, body: { patchDigest: string; reproDigest: string; reviewer?: string }) =>
    request<Approval>(`/api/v1/runs/${id}/approve`, { method: "POST", body: JSON.stringify(body) }),
  reject: (id: number | string) =>
    request<{ status: string }>(`/api/v1/runs/${id}/reject`, { method: "POST", body: JSON.stringify({}) }),
  createPullRequest: (id: number | string) =>
    request<unknown>(`/api/v1/runs/${id}/pull-request`, { method: "POST", body: JSON.stringify({}) }),
};
