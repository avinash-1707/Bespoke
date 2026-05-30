"use client";

import type { Offering } from "@bespoke/db";
import { isOptimisticId, timeAgo } from "@/lib/format";
import {
  useDeleteOffering,
  useWatchOfferingScrape,
} from "@/lib/hooks/use-offerings";
import { EntityCard } from "@/components/shared/entity-card";
import type { InfiniteListRenderOptions } from "@/components/shared/infinite-list";
import { StatusBadge } from "@/components/shared/status-badge";

interface OfferingCardProps {
  offering: Offering;
  options: InfiniteListRenderOptions;
}

export function OfferingCard({ offering, options }: OfferingCardProps) {
  const del = useDeleteOffering();
  const pending = isOptimisticId(offering.id);
  const scraping = offering.status === "scraping";

  // Poll a real scraping offering and toast when the worker marks it ready.
  useWatchOfferingScrape(offering);

  return (
    <EntityCard
      href={`/dashboard/offerings/${offering.id}`}
      selectMode={options.selectMode}
      selected={options.selected}
      onToggleSelect={options.toggle}
      onDelete={() => del.mutate(offering.id)}
      deleting={del.isPending}
      deleteTitle={offering.name}
      pending={pending}
      hoverPreview={
        !scraping && offering.summary ? (
          <>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {offering.name}
            </p>
            <p>{offering.summary}</p>
          </>
        ) : undefined
      }
    >
      {scraping ? (
        // Scraping in flight: pulse with only the name; no status, no details.
        <div className="animate-pulse">
          <h3 className="truncate pr-6 text-sm font-medium text-[var(--text-primary)]">
            {offering.name}
          </h3>
          <div className="mt-3 h-2 w-3/4 rounded bg-[var(--bg-surface-elevated)]" />
          <div className="mt-2 h-2 w-1/2 rounded bg-[var(--bg-surface-elevated)]" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 pr-6">
            <h3 className="truncate text-sm font-medium text-[var(--text-primary)]">
              {offering.name}
            </h3>
            <StatusBadge status={offering.status} />
          </div>
          <p className="mt-2 line-clamp-2 min-h-[2rem] text-xs text-[var(--text-secondary)]">
            {offering.description || "No description yet."}
          </p>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            {pending ? "Saving…" : timeAgo(offering.createdAt)}
          </p>
        </>
      )}
    </EntityCard>
  );
}
