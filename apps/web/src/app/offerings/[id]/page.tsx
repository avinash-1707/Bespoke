"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import {
  useAddOfferingSource,
  useOffering,
  useUpdateOffering,
  type UpdateOfferingInput,
} from "@/lib/hooks/use-offerings";

// Functional only — edit fields, add a scrape source, view sources + context.
export default function OfferingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const offering = useOffering(id);
  const updateOffering = useUpdateOffering(id);
  const addSource = useAddOfferingSource(id);

  const [fields, setFields] = useState<UpdateOfferingInput>({});
  const [sourceUrl, setSourceUrl] = useState("");

  // Seed the form once the offering loads.
  useEffect(() => {
    if (offering.data) {
      setFields({
        name: offering.data.name,
        description: offering.data.description ?? "",
        targetAudience: offering.data.targetAudience ?? "",
        problemSolved: offering.data.problemSolved ?? "",
        uniqueValueProp: offering.data.uniqueValueProp ?? "",
        proofPoints: offering.data.proofPoints ?? "",
      });
    }
  }, [offering.data]);

  function setField(key: keyof UpdateOfferingInput, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateOffering.mutate(fields);
  }

  function handleAddSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addSource.mutate(sourceUrl, { onSuccess: () => setSourceUrl("") });
  }

  if (offering.isLoading) return <p>Loading…</p>;
  if (offering.isError) return <p role="alert">{offering.error.message}</p>;
  if (!offering.data) return <p>Not found.</p>;

  return (
    <main>
      <h1>Edit offering</h1>

      <form onSubmit={handleSave}>
        <input
          type="text"
          placeholder="Name"
          value={fields.name ?? ""}
          onChange={(e) => setField("name", e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={fields.description ?? ""}
          onChange={(e) => setField("description", e.target.value)}
        />
        <textarea
          placeholder="Target audience"
          value={fields.targetAudience ?? ""}
          onChange={(e) => setField("targetAudience", e.target.value)}
        />
        <textarea
          placeholder="Problem solved"
          value={fields.problemSolved ?? ""}
          onChange={(e) => setField("problemSolved", e.target.value)}
        />
        <textarea
          placeholder="Unique value proposition"
          value={fields.uniqueValueProp ?? ""}
          onChange={(e) => setField("uniqueValueProp", e.target.value)}
        />
        <textarea
          placeholder="Proof points"
          value={fields.proofPoints ?? ""}
          onChange={(e) => setField("proofPoints", e.target.value)}
        />
        <button type="submit" disabled={updateOffering.isPending}>
          {updateOffering.isPending ? "Saving…" : "Save"}
        </button>
        {updateOffering.isError ? (
          <p role="alert">{updateOffering.error.message}</p>
        ) : null}
      </form>

      <section>
        <h2>Add a source to scrape</h2>
        <form onSubmit={handleAddSource}>
          <input
            type="url"
            placeholder="https://…"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            required
          />
          <button type="submit" disabled={addSource.isPending}>
            {addSource.isPending ? "Queuing…" : "Scrape"}
          </button>
        </form>
      </section>

      <section>
        <h2>Sources</h2>
        <ul>
          {offering.data.sources.map((source) => (
            <li key={source.id}>
              {source.sourceUrl} —{" "}
              {source.processedContent ? "processed" : "pending"}
            </li>
          ))}
        </ul>
        {offering.data.sources.length === 0 ? <p>No sources.</p> : null}
      </section>

      <section>
        <h2>Compiled context</h2>
        <pre>{offering.data.compiledContext}</pre>
      </section>
    </main>
  );
}
