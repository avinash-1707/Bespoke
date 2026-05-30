"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { Prospect, ProspectAsset, ProspectContext } from "@bespoke/db";
import type { CursorPage, ProspectAssetType } from "@bespoke/shared";
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

export type ProspectWithDetails = Prospect & {
  assets: ProspectAsset[];
  context: ProspectContext | null;
};

export interface ProspectAssetInput {
  assetType: ProspectAssetType;
  url?: string;
  fileKey?: string;
}

export interface CreateProspectInput {
  name: string;
  email?: string;
  jobTitle?: string;
  companyName?: string;
  notes?: string;
  assets?: ProspectAssetInput[];
}

export type UpdateProspectInput = Partial<Omit<CreateProspectInput, "assets">>;

const PAGE_SIZE = 20;

const prospectKeys = {
  lists: ["prospects", "list"] as const,
  list: (q: string) => ["prospects", "list", { q }] as const,
  detail: (id: string) => ["prospects", id] as const,
};

function optimisticProspect(input: CreateProspectInput): Prospect {
  const now = new Date();
  return {
    id: `optimistic-${crypto.randomUUID()}`,
    userId: "",
    name: input.name,
    email: input.email ?? null,
    jobTitle: input.jobTitle ?? null,
    companyName: input.companyName ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  } as Prospect;
}

/** Cursor-paginated prospect list (search matches name/company/email). */
export function useProspectsInfinite(q: string) {
  const query = useInfiniteQuery({
    queryKey: prospectKeys.list(q),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<Prospect>>(
        `/api/prospects${listSearchParams({ cursor: pageParam, q, limit: PAGE_SIZE })}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  return { ...query, items: flattenPages(query.data) };
}

export function useProspect(id: string) {
  return useQuery({
    queryKey: prospectKeys.detail(id),
    queryFn: () => apiClient.get<ProspectWithDetails>(`/api/prospects/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateProspect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProspectInput) =>
      apiClient.post<ProspectWithDetails>("/api/prospects", input),
    onMutate: async (input): Promise<{ snapshot: ListSnapshot }> => {
      const snapshot = await snapshotLists(queryClient, prospectKeys.lists);
      prependToLists(queryClient, prospectKeys.lists, optimisticProspect(input));
      return { snapshot };
    },
    onError: (error, _input, context) => {
      if (context) restoreLists(queryClient, context.snapshot);
      toast.error(error.message);
    },
    onSuccess: () => toast.success("Prospect created"),
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: prospectKeys.lists }),
  });
}

export function useUpdateProspect(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProspectInput) =>
      apiClient.patch<ProspectWithDetails>(`/api/prospects/${id}`, input),
    onSuccess: () => {
      toast.success("Prospect saved");
      void queryClient.invalidateQueries({ queryKey: prospectKeys.lists });
      void queryClient.invalidateQueries({ queryKey: prospectKeys.detail(id) });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteProspect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/prospects/${id}`),
    onMutate: async (id): Promise<{ snapshot: ListSnapshot }> => {
      const snapshot = await snapshotLists(queryClient, prospectKeys.lists);
      removeFromLists(queryClient, prospectKeys.lists, new Set([id]));
      return { snapshot };
    },
    onError: (error, _id, context) => {
      if (context) restoreLists(queryClient, context.snapshot);
      toast.error(error.message);
    },
    onSuccess: () => toast.success("Prospect deleted"),
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: prospectKeys.lists }),
  });
}

export function useBatchDeleteProspects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiClient.post<{ deleted: number }>("/api/prospects/batch-delete", {
        ids,
      }),
    onMutate: async (ids): Promise<{ snapshot: ListSnapshot }> => {
      const snapshot = await snapshotLists(queryClient, prospectKeys.lists);
      removeFromLists(queryClient, prospectKeys.lists, new Set(ids));
      return { snapshot };
    },
    onError: (error, _ids, context) => {
      if (context) restoreLists(queryClient, context.snapshot);
      toast.error(error.message);
    },
    onSuccess: ({ deleted }) =>
      toast.success(`${deleted} prospect${deleted === 1 ? "" : "s"} deleted`),
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: prospectKeys.lists }),
  });
}

export function useAddProspectAsset(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (asset: ProspectAssetInput) =>
      apiClient.post<ProspectWithDetails>(`/api/prospects/${id}/assets`, asset),
    onSuccess: () => {
      toast.success("Asset added, processing in the background");
      void queryClient.invalidateQueries({ queryKey: prospectKeys.detail(id) });
    },
    onError: (error) => toast.error(error.message),
  });
}
