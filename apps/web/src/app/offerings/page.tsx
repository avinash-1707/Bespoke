"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  useCreateOffering,
  useDeleteOffering,
  useOfferings,
} from "@/lib/hooks/use-offerings";

// Functional only — list, create (manual and/or scrape URL), delete.
export default function OfferingsPage() {
  const offerings = useOfferings();
  const createOffering = useCreateOffering();
  const deleteOffering = useDeleteOffering();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createOffering.mutate(
      {
        name,
        description: description || undefined,
        sourceUrl: sourceUrl || undefined,
      },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setSourceUrl("");
        },
      },
    );
  }

  return (
    <main>
      <h1>Offerings</h1>

      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="url"
          placeholder="Website URL to scrape (optional)"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
        />
        <button type="submit" disabled={createOffering.isPending}>
          {createOffering.isPending ? "Creating…" : "Create offering"}
        </button>
        {createOffering.isError ? (
          <p role="alert">{createOffering.error.message}</p>
        ) : null}
      </form>

      {offerings.isLoading ? <p>Loading…</p> : null}
      {offerings.isError ? (
        <p role="alert">{offerings.error.message}</p>
      ) : null}

      <ul>
        {offerings.data?.map((offering) => (
          <li key={offering.id}>
            <Link href={`/offerings/${offering.id}`}>{offering.name}</Link>{" "}
            <span>({offering.status})</span>{" "}
            <button
              type="button"
              onClick={() => deleteOffering.mutate(offering.id)}
              disabled={deleteOffering.isPending}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {offerings.data?.length === 0 ? <p>No offerings yet.</p> : null}
    </main>
  );
}
