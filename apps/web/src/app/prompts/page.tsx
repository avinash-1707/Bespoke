"use client";

import { useState, type FormEvent } from "react";
import {
  useCreatePrompt,
  useDeletePrompt,
  usePrompts,
} from "@/lib/hooks/use-prompts";

// Functional only — list, create, delete reusable system prompts.
export default function PromptsPage() {
  const prompts = usePrompts();
  const createPrompt = useCreatePrompt();
  const deletePrompt = useDeletePrompt();

  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createPrompt.mutate(
      { name, systemPrompt, isDefault },
      {
        onSuccess: () => {
          setName("");
          setSystemPrompt("");
          setIsDefault(false);
        },
      },
    );
  }

  return (
    <main>
      <h1>Prompts</h1>

      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <textarea
          placeholder="System prompt — tone, length, structure, what to avoid"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          required
        />
        <label>
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          Default
        </label>
        <button type="submit" disabled={createPrompt.isPending}>
          {createPrompt.isPending ? "Creating…" : "Create prompt"}
        </button>
        {createPrompt.isError ? (
          <p role="alert">{createPrompt.error.message}</p>
        ) : null}
      </form>

      {prompts.isLoading ? <p>Loading…</p> : null}
      {prompts.isError ? <p role="alert">{prompts.error.message}</p> : null}

      <ul>
        {prompts.data?.map((prompt) => (
          <li key={prompt.id}>
            {prompt.name} {prompt.isDefault ? <strong>(default)</strong> : null}{" "}
            <button
              type="button"
              onClick={() => deletePrompt.mutate(prompt.id)}
              disabled={deletePrompt.isPending}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {prompts.data?.length === 0 ? <p>No prompts yet.</p> : null}
    </main>
  );
}
