"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import {
  useBatchDeletePrompts,
  usePromptsInfinite,
} from "@/lib/hooks/use-prompts";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { InfiniteList } from "@/components/shared/infinite-list";
import { PromptCard } from "@/components/prompts/prompt-card";
import { PromptDialog } from "@/components/prompts/prompt-dialog";

export default function PromptsPage() {
  const [rawSearch, setRawSearch] = useState("");
  const search = useDebounce(rawSearch, 300);
  const list = usePromptsInfinite(search);
  const batchDelete = useBatchDeletePrompts();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Library"
        title="Prompts"
        subtitle="Reusable instructions that customize tone, length, and angle."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add prompt
          </Button>
        }
      />

      <InfiniteList
        items={list.items}
        getId={(p) => p.id}
        renderItem={(prompt, options) => (
          <PromptCard prompt={prompt} options={options} />
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
        searchPlaceholder="Search prompts…"
        entityNoun="prompts"
        onBatchDelete={(ids) => batchDelete.mutateAsync(ids)}
        batchDeleting={batchDelete.isPending}
        emptyIcon={Sparkles}
        emptyTitle="No prompts yet"
        emptyDescription="Write prompt instructions once and reuse them across every generation."
        emptyAction={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add prompt
          </Button>
        }
      />

      <PromptDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
