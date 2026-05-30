import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import type { Conversation } from "@bespoke/db";
import { timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/shared/status-badge";

export function ConversationCard({
  conversation,
}: {
  conversation: Conversation;
}) {
  return (
    <Link
      href={`/dashboard/conversations/${conversation.id}`}
      className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 transition-colors hover:bg-[var(--bg-surface-hover)]"
    >
      <MessagesSquare className="h-4 w-4 shrink-0 text-[var(--accent-text)]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
          {conversation.title ?? `Conversation ${conversation.id.slice(0, 8)}`}
        </p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          {timeAgo(conversation.createdAt)}
        </p>
      </div>
      <StatusBadge status={conversation.status} />
    </Link>
  );
}
