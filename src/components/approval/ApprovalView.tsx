"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { DiffViewer } from "@/components/run/DiffViewer";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api } from "@/lib/api";
import type { Approval, Run } from "@/lib/types";

export function ApprovalView({
  run,
  approval,
}: {
  run: Run;
  approval: Approval | null;
}) {
  const [status, setStatus] = useState(approval?.status ?? "pending");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const awaiting = run.state === "awaiting_human" && status === "pending";

  async function decide(kind: "approve" | "reject") {
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
      } else {
        await api.reject(run.id);
        setStatus("rejected");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border bg-[#0D111A] p-5"
        style={{
          borderColor: awaiting ? "rgba(245,158,11,0.45)" : "rgba(148,163,184,0.12)",
          boxShadow: awaiting ? "0 0 36px rgba(245,158,11,0.12)" : undefined,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Human approval gate</p>
            <p className="mt-1 text-sm text-[#94A3B8]">
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
          <Button variant="primary" disabled={pending || status !== "pending"} onClick={() => decide("approve")}>
            Approve
          </Button>
          <Button variant="danger" disabled={pending || status !== "pending"} onClick={() => decide("reject")}>
            Reject
          </Button>
        </div>
        {error ? <p className="mt-3 text-xs text-[#FCA5A5]">{error}</p> : null}
      </motion.div>
      <DiffViewer />
    </div>
  );
}
