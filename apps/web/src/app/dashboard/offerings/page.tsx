"use client";

import { useState } from "react";
import { Package, Plus } from "lucide-react";
import {
  useBatchDeleteOfferings,
  useOfferingsInfinite,
} from "@/lib/hooks/use-offerings";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { InfiniteList } from "@/components/shared/infinite-list";
import { OfferingCard } from "@/components/offerings/offering-card";
import { OfferingCreateDialog } from "@/components/offerings/offering-create-dialog";

export default function OfferingsPage() {
  const [rawSearch, setRawSearch] = useState("");
  const search = useDebounce(rawSearch, 300);
  const list = useOfferingsInfinite(search);
  const batchDelete = useBatchDeleteOfferings();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Offerings"
        subtitle="What you sell, compiled into context for every message."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add offering
          </Button>
        }
      />

      <InfiniteList
        items={list.items}
        getId={(o) => o.id}
        renderItem={(offering, options) => (
          <OfferingCard offering={offering} options={options} />
        )}
        isLoading={list.isLoading}
        isError={list.isError}
        errorMessage={list.error?.message}
        isFetchingNextPage={list.isFetchingNextPage}
        hasNextPage={Boolean(list.hasNextPage)}
        fetchNextPage={list.fetchNextPage}
        refetch={list.refetch}
        search={rawSearch}
        onSearchChange={setRawSearch}
        isSearchActive={search.trim().length > 0}
        searchPlaceholder="Search offerings…"
        entityNoun="offerings"
        onBatchDelete={(ids) => batchDelete.mutateAsync(ids)}
        batchDeleting={batchDelete.isPending}
        emptyIcon={Package}
        emptyTitle="No offerings yet"
        emptyDescription="Create your first offering to start generating tailored messages."
        emptyAction={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add offering
          </Button>
        }
      />

      <OfferingCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
