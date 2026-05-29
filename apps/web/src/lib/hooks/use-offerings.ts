"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Offering, OfferingSource } from "@bespoke/db";
import { apiClient } from "../api-client";

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

const offeringKeys = {
  all: ["offerings"] as const,
  detail: (id: string) => ["offerings", id] as const,
};

export function useOfferings() {
  return useQuery({
    queryKey: offeringKeys.all,
    queryFn: () => apiClient.get<Offering[]>("/api/offerings"),
  });
}

export function useOffering(id: string) {
  return useQuery({
    queryKey: offeringKeys.detail(id),
    queryFn: () =>
      apiClient.get<OfferingWithSources>(`/api/offerings/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateOffering() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOfferingInput) =>
      apiClient.post<OfferingWithSources>("/api/offerings", input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: offeringKeys.all }),
  });
}

export function useUpdateOffering(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOfferingInput) =>
      apiClient.patch<OfferingWithSources>(`/api/offerings/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offeringKeys.all });
      void queryClient.invalidateQueries({ queryKey: offeringKeys.detail(id) });
    },
  });
}

export function useDeleteOffering() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/offerings/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: offeringKeys.all }),
  });
}

export function useAddOfferingSource(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (url: string) =>
      apiClient.post<OfferingWithSources>(`/api/offerings/${id}/sources`, {
        url,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: offeringKeys.detail(id) }),
  });
}
