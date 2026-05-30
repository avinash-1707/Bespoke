"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { Offering, Prompt, Prospect } from "@bespoke/db";
import { useOfferingsInfinite } from "@/lib/hooks/use-offerings";
import { useProspectsInfinite } from "@/lib/hooks/use-prospects";
import { usePromptsInfinite } from "@/lib/hooks/use-prompts";
import { timeAgo } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";

const RECENT_COUNT = 4;

/** Home overview: the latest few of each entity, with links into each tab. */
export function RecentSection() {
  return (
    <Tabs defaultValue="offerings" className="w-full">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Recent
        </span>
        <TabsList>
          <TabsTrigger value="offerings">Offerings</TabsTrigger>
          <TabsTrigger value="prospects">Prospects</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="offerings" className="mt-4">
        <RecentOfferings />
      </TabsContent>
      <TabsContent value="prospects" className="mt-4">
        <RecentProspects />
      </TabsContent>
      <TabsContent value="prompts" className="mt-4">
        <RecentPrompts />
      </TabsContent>
    </Tabs>
  );
}

function RecentOfferings() {
  const list = useOfferingsInfinite("");
  return (
    <RecentPanel
      isLoading={list.isLoading}
      isEmpty={list.items.length === 0}
      emptyText="No offerings yet."
      viewAllHref="/dashboard/offerings"
    >
      {list.items.slice(0, RECENT_COUNT).map((offering: Offering) => (
        <RecentRow
          key={offering.id}
          href={`/dashboard/offerings/${offering.id}`}
          title={offering.name}
          meta={timeAgo(offering.createdAt)}
          trailing={<StatusBadge status={offering.status} />}
        />
      ))}
    </RecentPanel>
  );
}

function RecentProspects() {
  const list = useProspectsInfinite("");
  return (
    <RecentPanel
      isLoading={list.isLoading}
      isEmpty={list.items.length === 0}
      emptyText="No prospects yet."
      viewAllHref="/dashboard/prospects"
    >
      {list.items.slice(0, RECENT_COUNT).map((prospect: Prospect) => (
        <RecentRow
          key={prospect.id}
          href={`/dashboard/prospects/${prospect.id}`}
          title={prospect.name}
          meta={prospect.companyName ?? timeAgo(prospect.createdAt)}
        />
      ))}
    </RecentPanel>
  );
}

function RecentPrompts() {
  const list = usePromptsInfinite("");
  return (
    <RecentPanel
      isLoading={list.isLoading}
      isEmpty={list.items.length === 0}
      emptyText="No prompts yet."
      viewAllHref="/dashboard/prompts"
    >
      {list.items.slice(0, RECENT_COUNT).map((prompt: Prompt) => (
        <RecentRow
          key={prompt.id}
          href="/dashboard/prompts"
          title={prompt.name}
          meta={timeAgo(prompt.createdAt)}
          trailing={
            prompt.isDefault ? (
              <Badge className="border-transparent bg-[var(--accent-subtle)] text-[var(--accent-text)]">
                Default
              </Badge>
            ) : null
          }
        />
      ))}
    </RecentPanel>
  );
}

function RecentPanel({
  isLoading,
  isEmpty,
  emptyText,
  viewAllHref,
  children,
}: {
  isLoading: boolean;
  isEmpty: boolean;
  emptyText: string;
  viewAllHref: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {isLoading ? (
        Array.from({ length: RECENT_COUNT }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))
      ) : isEmpty ? (
        <p className="py-8 text-center text-xs text-[var(--text-muted)]">
          {emptyText}
        </p>
      ) : (
        children
      )}

      <Link
        href={viewAllHref}
        className="mt-1 inline-flex w-fit items-center gap-1.5 text-sm text-[var(--accent-text)] transition-opacity hover:opacity-80"
      >
        View all
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function RecentRow({
  href,
  title,
  meta,
  trailing,
}: {
  href: string;
  title: string;
  meta: string;
  trailing?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)]"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-[var(--accent-primary)] transition-transform duration-200 group-hover:scale-y-100 motion-reduce:transition-none"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
          {title}
        </p>
        <p className="truncate text-xs text-[var(--text-muted)]">{meta}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {trailing}
        <ChevronRight className="h-4 w-4 text-[var(--text-muted)] transition-[transform,color] duration-200 group-hover:text-[var(--accent-text)] motion-safe:group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
