"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Prospect, ProspectAsset, ProspectContext } from "@bespoke/db";
import type { ProspectAssetType } from "@bespoke/shared";
import { apiClient } from "../api-client";

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

const prospectKeys = {
  all: ["prospects"] as const,
  detail: (id: string) => ["prospects", id] as const,
};

export function useProspects() {
  return useQuery({
    queryKey: prospectKeys.all,
    queryFn: () => apiClient.get<Prospect[]>("/api/prospects"),
  });
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: prospectKeys.all }),
  });
}

export function useUpdateProspect(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProspectInput) =>
      apiClient.patch<ProspectWithDetails>(`/api/prospects/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: prospectKeys.all });
      void queryClient.invalidateQueries({ queryKey: prospectKeys.detail(id) });
    },
  });
}

export function useDeleteProspect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/prospects/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: prospectKeys.all }),
  });
}

export function useAddProspectAsset(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (asset: ProspectAssetInput) =>
      apiClient.post<ProspectWithDetails>(`/api/prospects/${id}/assets`, asset),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: prospectKeys.detail(id) }),
  });
}
