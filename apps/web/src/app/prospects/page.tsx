"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  useCreateProspect,
  useDeleteProspect,
  useProspects,
} from "@/lib/hooks/use-prospects";

// Functional only — list, create, delete. Assets added on the detail page.
export default function ProspectsPage() {
  const prospects = useProspects();
  const createProspect = useCreateProspect();
  const deleteProspect = useDeleteProspect();

  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [notes, setNotes] = useState("");

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createProspect.mutate(
      {
        name,
        jobTitle: jobTitle || undefined,
        companyName: companyName || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setName("");
          setJobTitle("");
          setCompanyName("");
          setNotes("");
        },
      },
    );
  }

  return (
    <main>
      <h1>Prospects</h1>

      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Job title (optional)"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Company (optional)"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button type="submit" disabled={createProspect.isPending}>
          {createProspect.isPending ? "Creating…" : "Create prospect"}
        </button>
        {createProspect.isError ? (
          <p role="alert">{createProspect.error.message}</p>
        ) : null}
      </form>

      {prospects.isLoading ? <p>Loading…</p> : null}
      {prospects.isError ? (
        <p role="alert">{prospects.error.message}</p>
      ) : null}

      <ul>
        {prospects.data?.map((prospect) => (
          <li key={prospect.id}>
            <Link href={`/prospects/${prospect.id}`}>{prospect.name}</Link>{" "}
            {prospect.companyName ? <span>({prospect.companyName})</span> : null}{" "}
            <button
              type="button"
              onClick={() => deleteProspect.mutate(prospect.id)}
              disabled={deleteProspect.isPending}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {prospects.data?.length === 0 ? <p>No prospects yet.</p> : null}
    </main>
  );
}
