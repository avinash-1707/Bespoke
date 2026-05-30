"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "./confirm-dialog";

interface EntityCardProps {
  /** Detail route opened on click when not in select mode. */
  href?: string;
  /** Click handler used instead of `href` when the entity opens in a modal. */
  onOpen?: () => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  deleting?: boolean;
  /** Title shown in the per-item delete confirmation. */
  deleteTitle: string;
  /** Optimistic placeholder: non-interactive, dimmed until persisted. */
  pending?: boolean;
  children: ReactNode;
}

/**
 * Card shell shared by every list entity. Provides the hover surface, an
 * overlay link for navigation (or a select toggle in batch mode), a hover-
 * revealed delete button with its own confirmation, and the selected ring.
 * Inner content is non-interactive so the overlay reliably catches the click.
 */
export function EntityCard({
  href,
  onOpen,
  selectMode,
  selected,
  onToggleSelect,
  onDelete,
  deleting = false,
  deleteTitle,
  pending = false,
  children,
}: EntityCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div
      className={cn(
        "group relative h-full rounded-lg border bg-[var(--bg-surface)] p-4 transition-colors",
        pending
          ? "border-[var(--border-default)] opacity-70"
          : "border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)]",
        selected && "border-[var(--accent-primary)] bg-[var(--accent-subtle)]",
      )}
    >
      {!pending && selectMode ? (
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelect}
          aria-label="Select item"
          className="absolute right-3 top-3 z-20"
        />
      ) : null}

      {!pending && !selectMode ? (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label="Delete"
          className="absolute right-2.5 top-2.5 z-20 rounded p-1.5 text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--state-error)] focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}

      {pending ? null : selectMode ? (
        <button
          type="button"
          onClick={onToggleSelect}
          aria-label="Toggle selection"
          className="absolute inset-0 z-10"
        />
      ) : href ? (
        <Link href={href} className="absolute inset-0 z-10" aria-label="Open" />
      ) : onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open"
          className="absolute inset-0 z-10"
        />
      ) : null}

      <div className="pointer-events-none relative z-0">{children}</div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${deleteTitle}?`}
        description="This cannot be undone."
        onConfirm={() => {
          onDelete();
          setConfirmOpen(false);
        }}
        loading={deleting}
      />
    </div>
  );
}
