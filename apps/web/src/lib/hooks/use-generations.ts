"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { AiGeneration, GeneratedMessage } from "@bespoke/db";
import { apiClient } from "../api-client";

/** A generated message plus its rating and parent-generation metadata. */
export interface MessageView extends GeneratedMessage {
  rating: number | null;
  feedback: string | null;
  generationStatus: AiGeneration["status"];
  model: string;
}

export interface CreateGenerationInput {
  offeringId: string;
  promptId: string;
  prospectId: string;
  tone?: string;
  angle?: string;
}

const generationKeys = {
  messages: (prospectId: string) => ["generations", "prospect", prospectId] as const,
};

/** The history list of generated messages for one prospect. */
export function useMessages(prospectId: string) {
  return useQuery({
    queryKey: generationKeys.messages(prospectId),
    queryFn: () =>
      apiClient.get<MessageView[]>(
        `/api/generations?prospectId=${prospectId}`,
      ),
    enabled: Boolean(prospectId),
    // Poll while any message is still being generated.
    refetchInterval: (query) =>
      query.state.data?.some(
        (m) =>
          m.generationStatus === "pending" ||
          m.generationStatus === "processing",
      )
        ? 2000
        : false,
  });
}

export function useCreateGeneration(prospectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGenerationInput) =>
      apiClient.post<AiGeneration>("/api/generations", input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: generationKeys.messages(prospectId),
      }),
  });
}

function useMessageAction<TVars>(
  prospectId: string,
  fn: (vars: TVars) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: generationKeys.messages(prospectId),
      }),
  });
}

export function useRateMessage(prospectId: string) {
  return useMessageAction(
    prospectId,
    (vars: { id: string; rating: number; feedback?: string }) =>
      apiClient.patch(`/api/messages/${vars.id}/rating`, {
        rating: vars.rating,
        feedback: vars.feedback,
      }),
  );
}

export function useFavoriteMessage(prospectId: string) {
  return useMessageAction(
    prospectId,
    (vars: { id: string; isFavorite: boolean }) =>
      apiClient.patch(`/api/messages/${vars.id}/favorite`, {
        isFavorite: vars.isFavorite,
      }),
  );
}

export function useCopyMessage(prospectId: string) {
  return useMessageAction(prospectId, (id: string) =>
    apiClient.post(`/api/messages/${id}/copy`),
  );
}

export function useDeleteMessage(prospectId: string) {
  return useMessageAction(prospectId, (id: string) =>
    apiClient.delete(`/api/messages/${id}`),
  );
}

export function useRegenerateMessage(prospectId: string) {
  return useMessageAction(prospectId, (id: string) =>
    apiClient.post(`/api/messages/${id}/regenerate`),
  );
}
