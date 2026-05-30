"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOfferings } from "@/lib/hooks/use-offerings";
import { usePrompts } from "@/lib/hooks/use-prompts";
import {
  useCopyMessage,
  useCreateGeneration,
  useDeleteMessage,
  useFavoriteMessage,
  useMessages,
  useRateMessage,
  useRegenerateMessage,
  type MessageView,
} from "@/lib/hooks/use-generations";
import {
  useConversations,
  useCreateConversation,
} from "@/lib/hooks/use-conversations";

/**
 * Message generation panel for a prospect: pick an offering + prompt + tone,
 * generate, and manage the resulting message history (rate, favourite, copy,
 * delete, regenerate). The history polls while a generation is in flight.
 */
export function GenerationPanel({ prospectId }: { prospectId: string }) {
  const offerings = useOfferings();
  const prompts = usePrompts();
  const messages = useMessages(prospectId);
  const createGeneration = useCreateGeneration(prospectId);

  const [offeringId, setOfferingId] = useState("");
  const [promptId, setPromptId] = useState("");
  const [tone, setTone] = useState("");

  function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createGeneration.mutate({
      offeringId,
      promptId,
      prospectId,
      tone: tone || undefined,
    });
  }

  return (
    <section>
      <h2>Generate a message</h2>

      <form onSubmit={handleGenerate}>
        <select
          value={offeringId}
          onChange={(e) => setOfferingId(e.target.value)}
          required
        >
          <option value="">Select an offering…</option>
          {offerings.data?.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>

        <select
          value={promptId}
          onChange={(e) => setPromptId(e.target.value)}
          required
        >
          <option value="">Select a prompt…</option>
          {prompts.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.isDefault ? " (default)" : ""}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Tone (optional) — e.g. warm, direct"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        />

        <button
          type="submit"
          disabled={createGeneration.isPending || !offeringId || !promptId}
        >
          {createGeneration.isPending ? "Queuing…" : "Generate"}
        </button>
      </form>

      {createGeneration.isError ? (
        <p role="alert">{createGeneration.error.message}</p>
      ) : null}

      <h3>Message history</h3>
      {messages.isLoading ? <p>Loading…</p> : null}
      {messages.data?.length === 0 ? <p>No messages yet.</p> : null}
      <ul>
        {messages.data?.map((message) => (
          <MessageItem
            key={message.id}
            prospectId={prospectId}
            message={message}
          />
        ))}
      </ul>

      <ConversationsList prospectId={prospectId} />
    </section>
  );
}

function ConversationsList({ prospectId }: { prospectId: string }) {
  const conversations = useConversations(prospectId);
  if (!conversations.data?.length) return null;
  return (
    <div>
      <h3>Conversations</h3>
      <ul>
        {conversations.data.map((c) => (
          <li key={c.id}>
            <Link href={`/conversations/${c.id}`}>
              {c.title ?? `Conversation ${c.id.slice(0, 8)}`}
            </Link>{" "}
            <span>({c.status})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MessageItem({
  prospectId,
  message,
}: {
  prospectId: string;
  message: MessageView;
}) {
  const router = useRouter();
  const rate = useRateMessage(prospectId);
  const favorite = useFavoriteMessage(prospectId);
  const copy = useCopyMessage(prospectId);
  const remove = useDeleteMessage(prospectId);
  const regenerate = useRegenerateMessage(prospectId);
  const createConversation = useCreateConversation();

  const pending =
    message.generationStatus === "pending" ||
    message.generationStatus === "processing";

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content).catch(() => {});
    copy.mutate(message.id);
  }

  return (
    <li>
      <pre>{message.content}</pre>
      <small>
        {message.model} · {message.generationStatus}
        {message.copiedCount ? ` · copied ${message.copiedCount}×` : ""}
      </small>
      <div>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => rate.mutate({ id: message.id, rating: n })}
            disabled={pending}
            aria-pressed={message.rating === n}
          >
            {message.rating && message.rating >= n ? "★" : "☆"}
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            favorite.mutate({ id: message.id, isFavorite: !message.isFavorite })
          }
        >
          {message.isFavorite ? "♥ Favorited" : "♡ Favorite"}
        </button>
        <button type="button" onClick={handleCopy}>
          Copy
        </button>
        <button
          type="button"
          onClick={() => regenerate.mutate(message.id)}
          disabled={regenerate.isPending}
        >
          Regenerate
        </button>
        <button type="button" onClick={() => remove.mutate(message.id)}>
          Delete
        </button>
        <button
          type="button"
          disabled={pending || createConversation.isPending}
          onClick={() =>
            createConversation.mutate(message.id, {
              onSuccess: (conversation) =>
                router.push(`/conversations/${conversation.id}`),
            })
          }
        >
          Start conversation
        </button>
      </div>
    </li>
  );
}
