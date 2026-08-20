import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Confidence } from "@/lib/types";

const COPY: Record<Confidence, { label: string; tone: "green" | "amber" | "red"; tip: string }> = {
  strong: {
    label: "Strong",
    tone: "green",
    tip: "The reproduction failed for the reported symptom.",
  },
  weak: {
    label: "Weak",
    tone: "amber",
    tip: "A failure was reproduced, but the symptom match was uncertain.",
  },
  unreproduced: {
    label: "Unreproduced",
    tone: "red",
    tip: "No reliable reproduction of the reported bug was established.",
  },
};

export function ConfidenceBadge({ value }: { value?: Confidence | null }) {
  if (!value) {
    return <StatusBadge label="Ungraded" tone="slate" />;
  }
  const meta = COPY[value];
  return (
    <Tooltip content={meta.tip}>
      <StatusBadge label={meta.label} tone={meta.tone} />
    </Tooltip>
  );
}
