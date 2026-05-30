"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { Offering, OfferingSource } from "@bespoke/db";
import type { CursorPage } from "@bespoke/shared";
import { apiClient } from "../api-client";
import {
  flattenPages,
  listSearchParams,
  prependToLists,
  removeFromLists,
  restoreLists,
  snapshotLists,
  type ListSnapshot,
} from "./_list-cache";

export type OfferingWithSources = Offering & { sources: OfferingSource[] };

export interface CreateOfferingInput {
  name: string;
  description?: string;
  targetAudience?: string;
  problemSolved?: string;
  uniqueValueProp?: string;
  proofPoints?: string;
  sourceUrl?: string;
}

export type UpdateOfferingInput = Partial<Omit<CreateOfferingInput, "sourceUrl">>;

const PAGE_SIZE = 20;

const offeringKeys = {
  lists: ["offerings", "list"] as const,
  list: (q: string) => ["offerings", "list", { q }] as const,
  options: ["offerings", "options"] as const,
  detail: (id: string) => ["offerings", id] as const,
};

/** Build an optimistic Offering row from create input (temp id, draft status). */
function optimisticOffering(input: CreateOfferingInput): Offering {
  const now = new Date();
  return {
    id: `optimistic-${crypto.randomUUID()}`,
    userId: "",
    name: input.name,
    description: input.description ?? null,
    targetAudience: input.targetAudience ?? null,
    problemSolved: input.problemSolved ?? null,
    uniqueValueProp: input.uniqueValueProp ?? null,
    proofPoints: input.proofPoints ?? null,
    compiledContext: null,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  } as Offering;
}

/** Cursor-paginated, searchable offering list for the Offerings tab. */
export function useOfferingsInfinite(q: string) {
  const query = useInfiniteQuery({
    queryKey: offeringKeys.list(q),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<Offering>>(
        `/api/offerings${listSearchParams({ cursor: pageParam, q, limit: PAGE_SIZE })}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  return { ...query, items: flattenPages(query.data) };
}

/** Lightweight, non-paginated offering list for selectors (generation panel). */
export function useOfferingOptions() {
  return useQuery({
    queryKey: offeringKeys.options,
    queryFn: async () => {
      const page = await apiClient.get<CursorPage<Offering>>(
        `/api/offerings${listSearchParams({ limit: 100 })}`,
      );
      return page.items;
    },
  });
}

export function useOffering(id: string) {
  return useQuery({
    queryKey: offeringKeys.detail(id),
    queryFn: () => apiClient.get<OfferingWithSources>(`/api/offerings/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateOffering() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOfferingInput) =>
      apiClient.post<OfferingWithSources>("/api/offerings", input),
    onMutate: async (input): Promise<{ snapshot: ListSnapshot }> => {
      const snapshot = await snapshotLists(queryClient, offeringKeys.lists);
      prependToLists(queryClient, offeringKeys.lists, optimisticOffering(input));
      return { snapshot };
    },
    onError: (error, _input, context) => {
      if (context) restoreLists(queryClient, context.snapshot);
      toast.error(error.message);
    },
    onSuccess: () => toast.success("Offering created"),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: offeringKeys.lists });
      void queryClient.invalidateQueries({ queryKey: offeringKeys.options });
    },
  });
}

export function useUpdateOffering(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOfferingInput) =>
      apiClient.patch<OfferingWithSources>(`/api/offerings/${id}`, input),
    onSuccess: () => {
      toast.success("Offering saved");
      void queryClient.invalidateQueries({ queryKey: offeringKeys.lists });
      void queryClient.invalidateQueries({ queryKey: offeringKeys.detail(id) });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteOffering() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/offerings/${id}`),
    onMutate: async (id): Promise<{ snapshot: ListSnapshot }> => {
      const snapshot = await snapshotLists(queryClient, offeringKeys.lists);
      removeFromLists(queryClient, offeringKeys.lists, new Set([id]));
      return { snapshot };
    },
    onError: (error, _id, context) => {
      if (context) restoreLists(queryClient, context.snapshot);
      toast.error(error.message);
    },
    onSuccess: () => toast.success("Offering deleted"),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: offeringKeys.lists });
      void queryClient.invalidateQueries({ queryKey: offeringKeys.options });
    },
  });
}

export function useBatchDeleteOfferings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiClient.post<{ deleted: number }>("/api/offerings/batch-delete", {
        ids,
      }),
    onMutate: async (ids): Promise<{ snapshot: ListSnapshot }> => {
      const snapshot = await snapshotLists(queryClient, offeringKeys.lists);
      removeFromLists(queryClient, offeringKeys.lists, new Set(ids));
      return { snapshot };
    },
    onError: (error, _ids, context) => {
      if (context) restoreLists(queryClient, context.snapshot);
      toast.error(error.message);
    },
    onSuccess: ({ deleted }) =>
      toast.success(`${deleted} offering${deleted === 1 ? "" : "s"} deleted`),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: offeringKeys.lists });
      void queryClient.invalidateQueries({ queryKey: offeringKeys.options });
    },
  });
}

export function useAddOfferingSource(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (url: string) =>
      apiClient.post<OfferingWithSources>(`/api/offerings/${id}/sources`, {
        url,
      }),
    onSuccess: () => {
      toast.success("Source added, scraping in the background");
      void queryClient.invalidateQueries({ queryKey: offeringKeys.detail(id) });
    },
    onError: (error) => toast.error(error.message),
  });
}
