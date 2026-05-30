"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams } from "next/navigation";
import type { ProspectAssetType } from "@bespoke/shared";
import {
  useAddProspectAsset,
  useProspect,
  useUpdateProspect,
  type UpdateProspectInput,
} from "@/lib/hooks/use-prospects";
import {
  uploadToCloudinary,
  useCloudinarySignature,
} from "@/lib/hooks/use-uploads";
import { GenerationPanel } from "@/components/generation-panel";

const URL_ASSET_TYPES: ProspectAssetType[] = [
  "github",
  "personal_site",
  "company_site",
  "other_url",
];

// Functional only — edit fields, add URL/screenshot assets, view status + context.
export default function ProspectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const prospect = useProspect(id);
  const updateProspect = useUpdateProspect(id);
  const addAsset = useAddProspectAsset(id);
  const signature = useCloudinarySignature();

  const [fields, setFields] = useState<UpdateProspectInput>({});
  const [assetType, setAssetType] = useState<ProspectAssetType>("github");
  const [assetUrl, setAssetUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Seed the form once the prospect loads.
  useEffect(() => {
    if (prospect.data) {
      setFields({
        name: prospect.data.name,
        email: prospect.data.email ?? "",
        jobTitle: prospect.data.jobTitle ?? "",
        companyName: prospect.data.companyName ?? "",
        notes: prospect.data.notes ?? "",
      });
    }
  }, [prospect.data]);

  function setField(key: keyof UpdateProspectInput, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateProspect.mutate(fields);
  }

  function handleAddUrlAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addAsset.mutate(
      { assetType, url: assetUrl },
      { onSuccess: () => setAssetUrl("") },
    );
  }

  // Screenshot: sign on the backend, upload direct to Cloudinary, then attach
  // the returned public_id as the asset's file key.
  async function handleScreenshot(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    try {
      const sig = await signature.mutateAsync(undefined);
      const { publicId } = await uploadToCloudinary(file, sig);
      await addAsset.mutateAsync({
        assetType: "linkedin_screenshot",
        fileKey: publicId,
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (prospect.isLoading) return <p>Loading…</p>;
  if (prospect.isError) return <p role="alert">{prospect.error.message}</p>;
  if (!prospect.data) return <p>Not found.</p>;

  return (
    <main>
      <h1>Edit prospect</h1>

      <form onSubmit={handleSave}>
        <input
          type="text"
          placeholder="Name"
          value={fields.name ?? ""}
          onChange={(e) => setField("name", e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={fields.email ?? ""}
          onChange={(e) => setField("email", e.target.value)}
        />
        <input
          type="text"
          placeholder="Job title"
          value={fields.jobTitle ?? ""}
          onChange={(e) => setField("jobTitle", e.target.value)}
        />
        <input
          type="text"
          placeholder="Company"
          value={fields.companyName ?? ""}
          onChange={(e) => setField("companyName", e.target.value)}
        />
        <textarea
          placeholder="Notes"
          value={fields.notes ?? ""}
          onChange={(e) => setField("notes", e.target.value)}
        />
        <button type="submit" disabled={updateProspect.isPending}>
          {updateProspect.isPending ? "Saving…" : "Save"}
        </button>
        {updateProspect.isError ? (
          <p role="alert">{updateProspect.error.message}</p>
        ) : null}
      </form>

      <section>
        <h2>Add a URL asset to scrape</h2>
        <form onSubmit={handleAddUrlAsset}>
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value as ProspectAssetType)}
          >
            {URL_ASSET_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            type="url"
            placeholder="https://…"
            value={assetUrl}
            onChange={(e) => setAssetUrl(e.target.value)}
            required
          />
          <button type="submit" disabled={addAsset.isPending}>
            {addAsset.isPending ? "Queuing…" : "Scrape"}
          </button>
        </form>
      </section>

      <section>
        <h2>Upload a LinkedIn screenshot</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleScreenshot}
          disabled={uploading}
        />
        {uploading ? <p>Uploading…</p> : null}
        {uploadError ? <p role="alert">{uploadError}</p> : null}
      </section>

      <section>
        <h2>Assets</h2>
        <ul>
          {prospect.data.assets.map((asset) => (
            <li key={asset.id}>
              {asset.assetType} — {asset.url ?? asset.fileKey ?? "—"} —{" "}
              {asset.status}
            </li>
          ))}
        </ul>
        {prospect.data.assets.length === 0 ? <p>No assets.</p> : null}
      </section>

      <section>
        <h2>Consolidated context</h2>
        <pre>{prospect.data.context?.mergedContext ?? "Not built yet."}</pre>
      </section>

      <GenerationPanel prospectId={id} />
    </main>
  );
}
