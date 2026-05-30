import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional primary action (e.g. an "Add" button), rendered below the copy. */
  action?: ReactNode;
}

/**
 * Shared empty state for every list view, following the structure in
 * ui-context.md: centered icon, heading, muted body, optional action. Used both
 * for genuinely empty collections and for zero-result searches (different copy).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Icon className="h-8 w-8 text-[var(--text-muted)]" strokeWidth={1.5} />
      <h3 className="text-sm font-medium text-[var(--text-primary)]">{title}</h3>
      <p className="max-w-xs text-xs text-[var(--text-muted)]">{description}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
