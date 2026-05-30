"use client";

import { MessagesSquare } from "lucide-react";
import { useAllConversations } from "@/lib/hooks/use-conversations";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConversationCard } from "@/components/conversations/conversation-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationsPage() {
  const conversations = useAllConversations();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Threads"
        title="Conversations"
        subtitle="Reply threads you have started, from first touch to follow-up."
      />

      {conversations.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : conversations.isError ? (
        <p className="text-sm text-[var(--state-error)]" role="alert">
          {conversations.error.message}
        </p>
      ) : conversations.data && conversations.data.length > 0 ? (
        <div className="flex flex-col gap-3">
          {conversations.data.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessagesSquare}
          title="No conversations yet"
          description="Start a conversation from a generated message on a prospect to track replies here."
        />
      )}
    </div>
  );
}
