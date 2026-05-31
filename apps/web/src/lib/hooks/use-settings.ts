"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { GenerationModel } from "@bespoke/shared";
import { apiClient } from "../api-client";

export interface SettingsView {
  generationModel: GenerationModel;
  hasOpenRouterKey: boolean;
  supportedModels: ReadonlyArray<{
    id: GenerationModel;
    label: string;
    free: boolean;
  }>;
}

const settingsKeys = {
  all: ["settings"] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => apiClient.get<SettingsView>("/api/settings"),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (generationModel: GenerationModel) =>
      apiClient.patch<{ generationModel: GenerationModel }>("/api/settings", {
        generationModel,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
  });
}

/** Verify and store the user's own OpenRouter key (required for paid models). */
export function useSaveOpenRouterKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (apiKey: string) =>
      apiClient.post<{ hasOpenRouterKey: boolean }>(
        "/api/settings/openrouter-key",
        { apiKey },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
  });
}

/** Remove the stored OpenRouter key; a paid model selection is reset to default. */
export function useRemoveOpenRouterKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.delete<{
        generationModel: GenerationModel;
        hasOpenRouterKey: boolean;
      }>("/api/settings/openrouter-key"),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
  });
}
