"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAddReply, useConversation } from "@/lib/hooks/use-conversations";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

const ROLE_LABEL: Record<string, string> = {
  assistant: "You",
  prospect: "Prospect",
  user: "You",
};

export default function ConversationThreadPage() {
  const { id } = useParams<{ id: string }>();
  const conversation = useConversation(id);
  const addReply = useAddReply(id);
  const [reply, setReply] = useState("");

  function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reply.trim()) return;
    addReply.mutate(reply.trim(), {
      onSuccess: () => setReply(""),
      onError: (error) => toast.error(error.message),
    });
  }

  const messages = conversation.data?.messages ?? [];
  const awaitingReply = messages[messages.length - 1]?.role === "prospect";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/dashboard/conversations"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Conversations
      </Link>

      {conversation.isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : conversation.isError ? (
        <p className="text-sm text-[var(--state-error)]" role="alert">
          {conversation.error.message}
        </p>
      ) : !conversation.data ? (
        <p className="text-sm text-[var(--text-muted)]">
          Conversation not found.
        </p>
      ) : (
        <>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            {conversation.data.title ?? "Conversation"}
          </h1>

          <ol className="flex flex-col gap-3">
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";
              return (
                <li
                  key={message.id}
                  className={cn(
                    "rounded-lg border-l-2 bg-[var(--bg-surface)] p-4",
                    isAssistant
                      ? "border-l-[var(--accent-primary)]"
                      : "border-l-[var(--border-strong)]",
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)]">
                      {ROLE_LABEL[message.role] ?? message.role}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {timeAgo(message.createdAt)}
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-[var(--text-primary)]">
                    {message.content}
                  </pre>
                </li>
              );
            })}
          </ol>

          {awaitingReply ? (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating follow-up…
            </div>
          ) : null}

          <form
            onSubmit={handleReply}
            className="flex flex-col gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-4"
          >
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Paste the prospect&apos;s reply
            </label>
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Paste what the prospect said…"
              rows={4}
              className="resize-none"
            />
            <div>
              <Button
                type="submit"
                disabled={addReply.isPending || !reply.trim()}
              >
                {addReply.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Generate follow-up
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
