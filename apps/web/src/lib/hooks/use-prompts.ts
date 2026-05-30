"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Prompt } from "@bespoke/db";
import { apiClient } from "../api-client";

export interface CreatePromptInput {
  name: string;
  systemPrompt: string;
  isDefault?: boolean;
}

const promptKeys = {
  all: ["prompts"] as const,
};

export function usePrompts() {
  return useQuery({
    queryKey: promptKeys.all,
    queryFn: () => apiClient.get<Prompt[]>("/api/prompts"),
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePromptInput) =>
      apiClient.post<Prompt>("/api/prompts", input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: promptKeys.all }),
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/prompts/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: promptKeys.all }),
  });
}
