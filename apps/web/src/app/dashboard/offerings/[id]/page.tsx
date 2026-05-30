"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  useAddOfferingSource,
  useOffering,
  useUpdateOffering,
  type UpdateOfferingInput,
} from "@/lib/hooks/use-offerings";
import { timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";

const FIELD_LABELS: { key: keyof UpdateOfferingInput; label: string; rows?: number }[] = [
  { key: "description", label: "Description", rows: 3 },
  { key: "targetAudience", label: "Target audience", rows: 2 },
  { key: "problemSolved", label: "Problem solved", rows: 2 },
  { key: "uniqueValueProp", label: "Unique value proposition", rows: 2 },
  { key: "proofPoints", label: "Proof points", rows: 2 },
];

export default function OfferingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const offering = useOffering(id);
  const updateOffering = useUpdateOffering(id);
  const addSource = useAddOfferingSource(id);

  const [fields, setFields] = useState<UpdateOfferingInput>({});
  const [sourceUrl, setSourceUrl] = useState("");

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
    if (!sourceUrl.trim()) return;
    addSource.mutate(sourceUrl.trim(), { onSuccess: () => setSourceUrl("") });
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      {offering.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : offering.isError ? (
        <p className="text-sm text-[var(--state-error)]" role="alert">
          {offering.error.message}
        </p>
      ) : !offering.data ? (
        <p className="text-sm text-[var(--text-muted)]">Offering not found.</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              {offering.data.name}
            </h1>
            <StatusBadge status={offering.data.status} />
          </div>

          <form
            onSubmit={handleSave}
            className="flex flex-col gap-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-5"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={fields.name ?? ""}
                onChange={(e) => setField("name", e.target.value)}
                required
              />
            </div>
            {FIELD_LABELS.map(({ key, label, rows }) => (
              <div key={key} className="flex flex-col gap-2">
                <Label htmlFor={key}>{label}</Label>
                <Textarea
                  id={key}
                  rows={rows}
                  value={fields[key] ?? ""}
                  onChange={(e) => setField(key, e.target.value)}
                  className="resize-none"
                />
              </div>
            ))}
            <div>
              <Button type="submit" disabled={updateOffering.isPending}>
                {updateOffering.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Save changes
              </Button>
            </div>
          </form>

          <section className="flex flex-col gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">
              Sources
            </h2>
            <form onSubmit={handleAddSource} className="flex gap-2">
              <Input
                type="url"
                placeholder="https://… (scraped in the background)"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
              <Button type="submit" disabled={addSource.isPending || !sourceUrl.trim()}>
                {addSource.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Scrape
              </Button>
            </form>
            {offering.data.sources.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {offering.data.sources.map((source) => (
                  <li
                    key={source.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-[var(--border-default)] px-3 py-2 text-xs"
                  >
                    <span className="truncate text-[var(--text-secondary)]">
                      {source.sourceUrl}
                    </span>
                    <StatusBadge
                      status={source.processedContent ? "done" : "pending"}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">No sources yet.</p>
            )}
          </section>

          <section className="flex flex-col gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">
              Compiled context
            </h2>
            <pre className="whitespace-pre-wrap rounded-md bg-[var(--bg-base)] p-4 font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
              {offering.data.compiledContext || "Nothing compiled yet."}
            </pre>
            <p className="text-xs text-[var(--text-muted)]">
              Updated {timeAgo(offering.data.updatedAt)}
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/offerings"
      className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
    >
      <ArrowLeft className="h-4 w-4" />
      Offerings
    </Link>
  );
}
