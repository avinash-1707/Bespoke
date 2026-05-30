"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { Prompt } from "@bespoke/db";
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

export interface CreatePromptInput {
  name: string;
  systemPrompt: string;
  isDefault?: boolean;
}

export type UpdatePromptInput = Partial<CreatePromptInput>;

const PAGE_SIZE = 20;

const promptKeys = {
  lists: ["prompts", "list"] as const,
  list: (q: string) => ["prompts", "list", { q }] as const,
  detail: (id: string) => ["prompts", id] as const,
};

function optimisticPrompt(input: CreatePromptInput): Prompt {
  const now = new Date();
  return {
    id: `optimistic-${crypto.randomUUID()}`,
    userId: "",
    name: input.name,
    systemPrompt: input.systemPrompt,
    isDefault: input.isDefault ?? false,
    createdAt: now,
    updatedAt: now,
  } as Prompt;
}

/** Cursor-paginated, searchable prompt list for the Prompts tab. */
export function usePromptsInfinite(q: string, enabled = true) {
  const query = useInfiniteQuery({
    queryKey: promptKeys.list(q),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<Prompt>>(
        `/api/prompts${listSearchParams({ cursor: pageParam, q, limit: PAGE_SIZE })}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
  });
  return { ...query, items: flattenPages(query.data) };
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePromptInput) =>
      apiClient.post<Prompt>("/api/prompts", input),
    onMutate: async (input): Promise<{ snapshot: ListSnapshot }> => {
      const snapshot = await snapshotLists(queryClient, promptKeys.lists);
      prependToLists(queryClient, promptKeys.lists, optimisticPrompt(input));
      return { snapshot };
    },
    onError: (error, _input, context) => {
      if (context) restoreLists(queryClient, context.snapshot);
      toast.error(error.message);
    },
    onSuccess: () => toast.success("Prompt created"),
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: promptKeys.lists }),
  });
}

export function useUpdatePrompt(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePromptInput) =>
      apiClient.patch<Prompt>(`/api/prompts/${id}`, input),
    onSuccess: () => {
      toast.success("Prompt saved");
      void queryClient.invalidateQueries({ queryKey: promptKeys.lists });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/prompts/${id}`),
    onMutate: async (id): Promise<{ snapshot: ListSnapshot }> => {
      const snapshot = await snapshotLists(queryClient, promptKeys.lists);
      removeFromLists(queryClient, promptKeys.lists, new Set([id]));
      return { snapshot };
    },
    onError: (error, _id, context) => {
      if (context) restoreLists(queryClient, context.snapshot);
      toast.error(error.message);
    },
    onSuccess: () => toast.success("Prompt deleted"),
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: promptKeys.lists }),
  });
}

export function useBatchDeletePrompts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiClient.post<{ deleted: number }>("/api/prompts/batch-delete", { ids }),
    onMutate: async (ids): Promise<{ snapshot: ListSnapshot }> => {
      const snapshot = await snapshotLists(queryClient, promptKeys.lists);
      removeFromLists(queryClient, promptKeys.lists, new Set(ids));
      return { snapshot };
    },
    onError: (error, _ids, context) => {
      if (context) restoreLists(queryClient, context.snapshot);
      toast.error(error.message);
    },
    onSuccess: ({ deleted }) =>
      toast.success(`${deleted} prompt${deleted === 1 ? "" : "s"} deleted`),
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: promptKeys.lists }),
  });
}
