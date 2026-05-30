import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "muted" | "success" | "warning" | "error" | "pending";

const TONE_CLASS: Record<Tone, string> = {
  muted:
    "border-transparent bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]",
  success:
    "border-transparent bg-[var(--state-success-subtle)] text-[var(--state-success)]",
  warning:
    "border-transparent bg-[var(--state-warning-subtle)] text-[var(--state-warning)]",
  error:
    "border-transparent bg-[var(--state-error-subtle)] text-[var(--state-error)]",
  pending:
    "border-transparent bg-[var(--accent-subtle)] text-[var(--accent-text)]",
};

/** Map an entity/job status string to a semantic tone. */
const STATUS_TONE: Record<string, Tone> = {
  draft: "muted",
  ready: "success",
  done: "success",
  completed: "success",
  active: "success",
  pending: "pending",
  processing: "warning",
  archived: "muted",
  failed: "error",
  error: "error",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "muted";
  return (
    <Badge className={cn("capitalize", TONE_CLASS[tone])}>{status}</Badge>
  );
}
