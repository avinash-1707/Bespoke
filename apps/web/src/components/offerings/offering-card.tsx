"use client";

import type { Offering } from "@bespoke/db";
import { isOptimisticId, timeAgo } from "@/lib/format";
import { useDeleteOffering } from "@/lib/hooks/use-offerings";
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
    >
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
    </EntityCard>
  );
}
