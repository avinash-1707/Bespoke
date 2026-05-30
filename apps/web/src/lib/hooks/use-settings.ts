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
  supportedModels: ReadonlyArray<{ id: GenerationModel; label: string }>;
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
