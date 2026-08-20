"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { EvidenceCard } from "@/components/run/EvidenceCard";
import { DiffViewer } from "@/components/run/DiffViewer";
import { Button } from "@/components/ui/Button";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { isSensitivePath, pathsFromDiff } from "@/lib/github";
import type { Approval, Run } from "@/lib/types";

export function ApprovalView({
  run,
  approval,
  diff,
}: {
  run: Run;
  approval: Approval | null;
  diff?: string | null;
}) {
  const { push } = useToast();
  const [status, setStatus] = useState(approval?.status ?? "pending");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const awaiting = run.state === "awaiting_human" && status === "pending";
  const files = pathsFromDiff(diff);
  const sensitive = files.filter(isSensitivePath);
  const additions = diff ? diff.split("\n").filter((line) => line.startsWith("+") && !line.startsWith("+++")).length : 0;
  const deletions = diff ? diff.split("\n").filter((line) => line.startsWith("-") && !line.startsWith("---")).length : 0;

  async function decide(kind: "approve" | "reject") {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      if (kind === "approve") {
        if (!approval?.approvedPatchDigest || !approval.approvedReproductionDigest) {
          throw new Error("No digest-bound approval request exists for this run yet.");
        }
        await api.approve(run.id, {
          patchDigest: approval.approvedPatchDigest,
          reproDigest: approval.approvedReproductionDigest,
          reviewer: "dashboard",
        });
        setStatus("approved");
        push("Approval submitted", "success");
      } else {
        await api.reject(run.id);
        setStatus("rejected");
        push("Run rejected", "warning");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval request failed");
    } finally {
      setPending(false);
      setConfirmReject(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border bg-[var(--card)] p-5"
          style={{
            borderColor: awaiting ? "rgba(245,158,11,0.45)" : "var(--border)",
            boxShadow: awaiting ? "0 0 36px rgba(245,158,11,0.12)" : undefined,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Human approval gate</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Draft PR creation is impossible without a valid approval record.
              </p>
            </div>
            <StatusBadge
              label={status}
              tone={status === "approved" ? "green" : status === "rejected" ? "red" : "amber"}
              pulse={awaiting}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="primary" disabled={pending || !awaiting} onClick={() => decide("approve")}>
              {pending && status === "pending" ? "Approving…" : "Approve"}
            </Button>
            <Button variant="danger" disabled={pending || !awaiting} onClick={() => setConfirmReject(true)}>
              Reject
            </Button>
          </div>
          {error ? <p className="mt-3 text-xs text-[var(--tone-red)]">{error}</p> : null}
        </motion.div>
        <DiffViewer diff={diff} />
      </div>

      <div className="space-y-4">
        <EvidenceCard state={run.state} confidence={run.confidence} />
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
          <p className="mb-3 text-sm font-medium">Review summary</p>
          <div className="flex items-center justify-between py-1">
            <span className="text-[var(--text-muted)]">Confidence</span>
            <ConfidenceBadge value={run.confidence} />
          </div>
          <div className="flex items-center justify-between py-1 text-[var(--text-secondary)]">
            <span>Files changed</span>
            <span>{files.length || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-1 text-[var(--text-secondary)]">
            <span>Additions / deletions</span>
            <span>+{additions} / −{deletions}</span>
          </div>
        </div>
        {sensitive.length > 0 ? (
          <div className="rounded-xl border border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.08)] p-4 text-sm">
            <p className="font-medium text-[#F59E0B]">Potential out-of-scope changes detected</p>
            <p className="mt-1 text-[var(--text-secondary)]">Reviewer warning only — not a verdict.</p>
            <ul className="mt-2 font-mono text-[11px] text-[var(--text-muted)]">
              {sensitive.map((file) => (
                <li key={file}>{file}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmReject}
        title="Reject this patch?"
        body="The run will be marked rejected. This cannot open a pull request."
        confirmLabel="Reject"
        danger
        pending={pending}
        onConfirm={() => decide("reject")}
        onClose={() => setConfirmReject(false)}
      />
    </div>
  );
}
