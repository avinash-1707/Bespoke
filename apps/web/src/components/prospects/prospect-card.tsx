"use client";

import { Building2, Mail } from "lucide-react";
import type { Prospect } from "@bespoke/db";
import { isOptimisticId, timeAgo } from "@/lib/format";
import { useDeleteProspect } from "@/lib/hooks/use-prospects";
import { EntityCard } from "@/components/shared/entity-card";
import type { InfiniteListRenderOptions } from "@/components/shared/infinite-list";

interface ProspectCardProps {
  prospect: Prospect;
  options: InfiniteListRenderOptions;
}

export function ProspectCard({ prospect, options }: ProspectCardProps) {
  const del = useDeleteProspect();
  const pending = isOptimisticId(prospect.id);

  return (
    <EntityCard
      href={`/dashboard/prospects/${prospect.id}`}
      selectMode={options.selectMode}
      selected={options.selected}
      onToggleSelect={options.toggle}
      onDelete={() => del.mutate(prospect.id)}
      deleting={del.isPending}
      deleteTitle={prospect.name}
      pending={pending}
    >
      <h3 className="truncate pr-6 text-sm font-medium text-[var(--text-primary)]">
        {prospect.name}
      </h3>
      {prospect.jobTitle ? (
        <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
          {prospect.jobTitle}
        </p>
      ) : null}

      <div className="mt-3 flex flex-col gap-1.5">
        {prospect.companyName ? (
          <span className="flex items-center gap-1.5 truncate text-xs text-[var(--text-muted)]">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            {prospect.companyName}
          </span>
        ) : null}
        {prospect.email ? (
          <span className="flex items-center gap-1.5 truncate text-xs text-[var(--text-muted)]">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {prospect.email}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {pending ? "Saving…" : timeAgo(prospect.createdAt)}
      </p>
    </EntityCard>
  );
}
