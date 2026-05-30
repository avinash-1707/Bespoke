"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Conversation, ConversationMessage } from "@bespoke/db";
import { apiClient } from "../api-client";

export interface ConversationWithMessages extends Conversation {
  messages: ConversationMessage[];
}

const conversationKeys = {
  all: ["conversations", "all"] as const,
  list: (prospectId: string) => ["conversations", "prospect", prospectId] as const,
  detail: (id: string) => ["conversations", id] as const,
};

/** Conversations for a prospect. */
export function useConversations(prospectId: string) {
  return useQuery({
    queryKey: conversationKeys.list(prospectId),
    queryFn: () =>
      apiClient.get<Conversation[]>(
        `/api/conversations?prospectId=${prospectId}`,
      ),
    enabled: Boolean(prospectId),
  });
}

/** Every conversation for the signed-in user (Conversations tab). */
export function useAllConversations() {
  return useQuery({
    queryKey: conversationKeys.all,
    queryFn: () => apiClient.get<Conversation[]>("/api/conversations"),
  });
}

/** One conversation thread. Polls while the last turn is from the prospect
 *  (i.e. an assistant reply is still being generated). */
export function useConversation(id: string) {
  return useQuery({
    queryKey: conversationKeys.detail(id),
    queryFn: () =>
      apiClient.get<ConversationWithMessages>(`/api/conversations/${id}`),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const messages = query.state.data?.messages;
      const last = messages?.[messages.length - 1];
      return last?.role === "prospect" ? 2000 : false;
    },
  });
}

export function useCreateConversation() {
  return useMutation({
    mutationFn: (messageId: string) =>
      apiClient.post<ConversationWithMessages>("/api/conversations", {
        messageId,
      }),
  });
}

export function useAddReply(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiClient.post<ConversationWithMessages>(
        `/api/conversations/${conversationId}/replies`,
        { content },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(conversationId),
      }),
  });
}
