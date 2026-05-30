"use client";

import { useEffect, useState } from "react";
import type { GenerationModel } from "@bespoke/shared";
import { useSettings, useUpdateSettings } from "@/lib/hooks/use-settings";

// Functional only — pick the generation model.
export default function SettingsPage() {
  const settings = useSettings();
  const updateSettings = useUpdateSettings();
  const [model, setModel] = useState<GenerationModel | "">("");

  useEffect(() => {
    if (settings.data) setModel(settings.data.generationModel);
  }, [settings.data]);

  if (settings.isLoading) return <p>Loading…</p>;
  if (settings.isError) return <p role="alert">{settings.error.message}</p>;
  if (!settings.data) return null;

  return (
    <main>
      <h1>Settings</h1>

      <label>
        Generation model
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as GenerationModel)}
        >
          {settings.data.supportedModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={() => model && updateSettings.mutate(model)}
        disabled={updateSettings.isPending || !model}
      >
        {updateSettings.isPending ? "Saving…" : "Save"}
      </button>

      {updateSettings.isError ? (
        <p role="alert">{updateSettings.error.message}</p>
      ) : null}
      {updateSettings.isSuccess ? <p>Saved.</p> : null}
    </main>
  );
}
