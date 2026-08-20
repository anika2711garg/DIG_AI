import { AlertTriangle, Ban, Bug, Clock, Cpu, FlaskConical, GitMerge, ShieldAlert, Wallet, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FailureSeverity = "warning" | "error" | "critical";

export interface FailureMeta {
  title: string;
  description: string;
  severity: FailureSeverity;
  icon: LucideIcon;
}

const META: Record<string, FailureMeta> = {
  cant_localize: {
    title: "Could not localize",
    description: "No likely files were identified from the issue.",
    severity: "error",
    icon: Bug,
  },
  cant_reproduce: {
    title: "Could not reproduce",
    description: "No failing test matched the reported symptom.",
    severity: "error",
    icon: FlaskConical,
  },
  weak_reproduction: {
    title: "Weak reproduction",
    description: "A failure appeared, but the symptom match was uncertain.",
    severity: "warning",
    icon: AlertTriangle,
  },
  build_failed: {
    title: "Build failed",
    description: "The sandbox could not compile or install the project.",
    severity: "error",
    icon: XCircle,
  },
  patch_apply_failed: {
    title: "Patch could not apply",
    description: "The structured edit did not merge cleanly.",
    severity: "error",
    icon: GitMerge,
  },
  tests_regressed: {
    title: "Tests regressed",
    description: "Verification found new failures after the patch.",
    severity: "error",
    icon: XCircle,
  },
  flaky_suite: {
    title: "Flaky suite",
    description: "Results were inconsistent across verification runs.",
    severity: "warning",
    icon: AlertTriangle,
  },
  revert_check_failed: {
    title: "Revert check failed",
    description: "Un-applying the patch did not restore the failing test.",
    severity: "error",
    icon: ShieldAlert,
  },
  budget_exceeded: {
    title: "Budget exceeded",
    description: "The run hit its token or dollar cap.",
    severity: "warning",
    icon: Wallet,
  },
  attempts_exhausted: {
    title: "Attempts exhausted",
    description: "The patch/verify loop used every allowed attempt.",
    severity: "error",
    icon: Clock,
  },
  injection_suspected: {
    title: "Injection suspected",
    description: "The issue text looked like an instruction override.",
    severity: "critical",
    icon: ShieldAlert,
  },
  rejected_by_human: {
    title: "Rejected",
    description: "A reviewer declined the patch at the human gate.",
    severity: "warning",
    icon: Ban,
  },
  infra_error: {
    title: "Infrastructure error",
    description: "Sandbox, git, or an external service failed.",
    severity: "critical",
    icon: Cpu,
  },
};

export function getFailureMetadata(type?: string | null): FailureMeta | null {
  if (!type) return null;
  return (
    META[type] ?? {
      title: type.replaceAll("_", " "),
      description: "A typed failure was recorded for this run.",
      severity: "error",
      icon: AlertTriangle,
    }
  );
}
