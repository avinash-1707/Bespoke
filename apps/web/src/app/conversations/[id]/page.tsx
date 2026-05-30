"use client";

import { useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { useAddReply, useConversation } from "@/lib/hooks/use-conversations";

const ROLE_LABEL: Record<string, string> = {
  assistant: "You",
  prospect: "Prospect",
  user: "You",
};

// Functional only — view the thread, paste a prospect reply, get a follow-up.
export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const conversation = useConversation(id);
  const addReply = useAddReply(id);
  const [reply, setReply] = useState("");

  function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addReply.mutate(reply, { onSuccess: () => setReply("") });
  }

  if (conversation.isLoading) return <p>Loading…</p>;
  if (conversation.isError)
    return <p role="alert">{conversation.error.message}</p>;
  if (!conversation.data) return <p>Not found.</p>;

  const messages = conversation.data.messages;
  const awaitingReply = messages[messages.length - 1]?.role === "prospect";

  return (
    <main>
      <h1>Conversation</h1>

      <ol>
        {messages.map((message) => (
          <li key={message.id}>
            <strong>{ROLE_LABEL[message.role] ?? message.role}:</strong>
            <pre>{message.content}</pre>
          </li>
        ))}
      </ol>

      {awaitingReply ? <p>Generating reply…</p> : null}

      <form onSubmit={handleReply}>
        <h2>Paste the prospect's reply</h2>
        <textarea
          placeholder="Paste what the prospect said…"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          required
        />
        <button type="submit" disabled={addReply.isPending}>
          {addReply.isPending ? "Sending…" : "Generate follow-up"}
        </button>
        {addReply.isError ? (
          <p role="alert">{addReply.error.message}</p>
        ) : null}
      </form>
    </main>
  );
}
