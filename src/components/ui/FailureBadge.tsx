import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import { getFailureMetadata } from "@/lib/failure";

export function FailureBadge({ type }: { type?: string | null }) {
  const meta = getFailureMetadata(type);
  if (!meta) return null;
  const tone = meta.severity === "warning" ? "amber" : "red";
  return (
    <Tooltip content={meta.description}>
      <StatusBadge label={meta.title} tone={tone} />
    </Tooltip>
  );
}
