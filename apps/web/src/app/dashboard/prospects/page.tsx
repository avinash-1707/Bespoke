"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import {
  useBatchDeleteProspects,
  useProspectsInfinite,
} from "@/lib/hooks/use-prospects";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { InfiniteList } from "@/components/shared/infinite-list";
import { ProspectCard } from "@/components/prospects/prospect-card";
import { ProspectCreateDialog } from "@/components/prospects/prospect-create-dialog";

export default function ProspectsPage() {
  const [rawSearch, setRawSearch] = useState("");
  const search = useDebounce(rawSearch, 300);
  const list = useProspectsInfinite(search);
  const batchDelete = useBatchDeleteProspects();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Prospects"
        subtitle="The people you are reaching out to and their research context."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add prospect
          </Button>
        }
      />

      <InfiniteList
        items={list.items}
        getId={(p) => p.id}
        renderItem={(prospect, options) => (
          <ProspectCard prospect={prospect} options={options} />
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
        searchPlaceholder="Search by name, company, email…"
        entityNoun="prospects"
        onBatchDelete={(ids) => batchDelete.mutateAsync(ids)}
        batchDeleting={batchDelete.isPending}
        emptyIcon={Users}
        emptyTitle="No prospects yet"
        emptyDescription="Add a prospect to research them and generate a personalized message."
        emptyAction={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add prospect
          </Button>
        }
      />

      <ProspectCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
