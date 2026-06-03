"use client";

import { useState } from "react";
import type { Prompt } from "@bespoke/db";
import { isOptimisticId, timeAgo } from "@/lib/format";
import { useDeletePrompt } from "@/lib/hooks/use-prompts";
import { EntityCard } from "@/components/shared/entity-card";
import type { InfiniteListRenderOptions } from "@/components/shared/infinite-list";
import { Badge } from "@/components/ui/badge";
import { PromptDialog } from "./prompt-dialog";

interface PromptCardProps {
  prompt: Prompt;
  options: InfiniteListRenderOptions;
}

export function PromptCard({ prompt, options }: PromptCardProps) {
  const del = useDeletePrompt();
  const [editOpen, setEditOpen] = useState(false);
  const pending = isOptimisticId(prompt.id);

  return (
    <>
      <EntityCard
        onOpen={() => setEditOpen(true)}
        selectMode={options.selectMode}
        selected={options.selected}
        onToggleSelect={options.toggle}
        onDelete={() => del.mutate(prompt.id)}
        deleting={del.isPending}
        deleteTitle={prompt.name}
        pending={pending}
      >
        <div className="flex items-start justify-between gap-2 pr-6">
          <h3 className="truncate text-sm font-medium text-[var(--text-primary)]">
            {prompt.name}
          </h3>
          {prompt.isDefault ? (
            <Badge className="border-transparent bg-[var(--accent-subtle)] text-[var(--accent-text)]">
              Default
            </Badge>
          ) : null}
        </div>
        <p className="mt-2 line-clamp-3 min-h-[3rem] font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
          {prompt.systemPrompt}
        </p>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          {pending ? "Saving…" : timeAgo(prompt.createdAt)}
        </p>
      </EntityCard>

      <PromptDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        prompt={prompt}
      />
    </>
  );
}
