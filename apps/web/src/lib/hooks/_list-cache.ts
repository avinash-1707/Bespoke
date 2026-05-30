"use client";

import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { CursorPage } from "@bespoke/shared";

/** Anything paginated through a cursor list must at least carry a string id. */
interface HasId {
  id: string;
}

type InfiniteList<T> = InfiniteData<CursorPage<T>>;

/** A captured snapshot of every matching list cache, for rollback on error. */
export type ListSnapshot = [readonly unknown[], unknown][];

/** Build the query string for a cursor-paginated list request. */
export function listSearchParams(opts: {
  cursor?: string;
  limit?: number;
  q?: string;
}): string {
  const params = new URLSearchParams();
  if (opts.cursor) params.set("cursor", opts.cursor);
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.q) params.set("q", opts.q);
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Flatten an infinite query's pages into a single item array. */
export function flattenPages<T>(data: InfiniteList<T> | undefined): T[] {
  return data?.pages.flatMap((page) => page.items) ?? [];
}

/**
 * Snapshot all list caches under a key prefix, cancel in-flight refetches, and
 * return the snapshot. Call at the start of an optimistic mutation so the cache
 * can be restored if the request fails.
 */
export async function snapshotLists(
  queryClient: QueryClient,
  keyPrefix: readonly unknown[],
): Promise<ListSnapshot> {
  await queryClient.cancelQueries({ queryKey: keyPrefix });
  return queryClient.getQueriesData({ queryKey: keyPrefix });
}

/** Restore caches captured by {@link snapshotLists}. */
export function restoreLists(
  queryClient: QueryClient,
  snapshot: ListSnapshot,
): void {
  for (const [key, data] of snapshot) {
    queryClient.setQueryData(key, data);
  }
}

/** Optimistically prepend a freshly created item to the first page of each list. */
export function prependToLists<T extends HasId>(
  queryClient: QueryClient,
  keyPrefix: readonly unknown[],
  item: T,
): void {
  queryClient.setQueriesData<InfiniteList<T>>(
    { queryKey: keyPrefix },
    (old) => {
      if (!old || old.pages.length === 0) return old;
      const [first, ...rest] = old.pages;
      return {
        ...old,
        pages: [{ ...first!, items: [item, ...first!.items] }, ...rest],
      };
    },
  );
}

/** Optimistically remove items by id from every list cache under the prefix. */
export function removeFromLists<T extends HasId>(
  queryClient: QueryClient,
  keyPrefix: readonly unknown[],
  ids: ReadonlySet<string>,
): void {
  queryClient.setQueriesData<InfiniteList<T>>(
    { queryKey: keyPrefix },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.filter((item) => !ids.has(item.id)),
        })),
      };
    },
  );
}
