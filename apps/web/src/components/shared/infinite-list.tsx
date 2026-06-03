"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  CheckSquare,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { EmptyState } from "./empty-state";
import { ListSkeleton } from "./list-skeleton";
import { SearchInput } from "./search-input";
import { ConfirmDialog } from "./confirm-dialog";

export interface InfiniteListRenderOptions {
  selected: boolean;
  selectMode: boolean;
  toggle: () => void;
}

interface InfiniteListProps<T> {
  items: T[];
  getId: (item: T) => string;
  renderItem: (item: T, opts: InfiniteListRenderOptions) => ReactNode;

  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;

  search: string;
  onSearchChange: (value: string) => void;
  /** True when the (debounced) search term is active — drives empty-state copy. */
  isSearchActive: boolean;
  searchPlaceholder?: string;

  /** Plural noun used in batch-delete copy, e.g. "offerings". */
  entityNoun: string;
  onBatchDelete: (ids: string[]) => Promise<unknown>;
  batchDeleting?: boolean;

  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: ReactNode;
}

const ITEM_TRANSITION = { duration: 0.18, ease: [0.22, 1, 0.36, 1] } as const;

/**
 * Reusable infinite-scroll collection used by every list tab. Owns the search
 * bar, batch-selection toolbar, optimistic enter/exit motion, the
 * IntersectionObserver load-more sentinel, and the loading / empty / error
 * states. Data + mutations are injected so the component stays domain-agnostic.
 *
 * Motion is deliberately restrained (a productivity surface used daily): items
 * fade + lift 6px on enter and fade + settle on exit, ~180ms, ease-out. All of
 * it collapses to instant under reduced motion via the layout's MotionConfig.
 */
export function InfiniteList<T>({
  items,
  getId,
  renderItem,
  isLoading,
  isError,
  errorMessage,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  refetch,
  search,
  onSearchChange,
  isSearchActive,
  searchPlaceholder,
  entityNoun,
  onBatchDelete,
  batchDeleting = false,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: InfiniteListProps<T>) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  function selectAllVisible() {
    setSelected(new Set(items.map(getId)));
  }

  async function confirmBatchDelete() {
    await onBatchDelete([...selected]);
    setConfirmOpen(false);
    exitSelectMode();
  }

  const selectedCount = selected.size;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />

        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <span className="text-xs text-[var(--text-muted)]">
                {selectedCount} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllVisible}
                disabled={items.length === 0}
              >
                Select all
              </Button>
              <Button variant="ghost" size="sm" onClick={exitSelectMode}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={selectedCount === 0}
                onClick={() => setConfirmOpen(true)}
              >
                Delete{selectedCount > 0 ? ` (${selectedCount})` : ""}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectMode(true)}
              disabled={items.length === 0}
            >
              <CheckSquare className="h-4 w-4" />
              Select
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle
            className="h-8 w-8 text-[var(--state-error)]"
            strokeWidth={1.5}
          />
          <p className="text-sm text-[var(--text-primary)]">
            {errorMessage ?? "Something went wrong loading this list."}
          </p>
          <Button variant="outline" size="sm" onClick={refetch}>
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        isSearchActive ? (
          <EmptyState
            icon={emptyIcon}
            title="No matches"
            description="No results for that search. Try a different term."
          />
        ) : (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        )
      ) : (
        <>
          <motion.div
            layout
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((item) => {
                const id = getId(item);
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={ITEM_TRANSITION}
                  >
                    {renderItem(item, {
                      selected: selected.has(id),
                      selectMode,
                      toggle: () => toggle(id),
                    })}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          <div ref={sentinelRef} aria-hidden="true" />

          {isFetchingNextPage ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${selectedCount} ${entityNoun}?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmBatchDelete}
        loading={batchDeleting}
      />
    </div>
  );
}
