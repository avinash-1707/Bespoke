import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /**
   * Small mono label above the title (uppercase, tracked) — the "technical
   * instrument" voice. Defaults to nothing so existing call sites are unchanged.
   */
  eyebrow?: string;
  /** Primary action, typically the "Add" button, aligned to the right. */
  action?: ReactNode;
}

/**
 * Consistent tab/page header: an optional mono eyebrow, the title + optional
 * subtitle, and a right-aligned action. A full-width hairline closes the block
 * with a short accent segment at the left edge — a measured, drafting-table cue
 * that gives every page the same crafted opening without extra chrome.
 */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <span className="block font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--accent-text)]">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="relative h-px w-full bg-[var(--border-default)]">
        <span className="absolute left-0 top-0 h-px w-10 bg-[var(--accent-primary)]" />
      </div>
    </div>
  );
}
