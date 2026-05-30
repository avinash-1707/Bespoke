"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useOfferingsInfinite } from "@/lib/hooks/use-offerings";
import { usePromptsInfinite } from "@/lib/hooks/use-prompts";
import { useProspectsInfinite } from "@/lib/hooks/use-prospects";
import {
  useCopyMessage,
  useCreateGeneration,
  useGeneration,
} from "@/lib/hooks/use-generations";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EntityPicker, type PickerOption } from "@/components/shared/entity-picker";
import { CopyableMessage } from "./copyable-message";

const OUTPUT_TRANSITION = { duration: 0.22, ease: [0.22, 1, 0.36, 1] } as const;

/**
 * Home-tab message generator: pick a prospect, offering, and prompt (each via a
 * searchable modal over the cursor-paginated lists), then enqueue a generation.
 * The produced message lands in a click-to-copy panel below. Generation runs on
 * the worker, so the panel polls the generation until it settles (useGeneration).
 */
export function GenerateMessage() {
  const [prospect, setProspect] = useState<PickerOption | null>(null);
  const [offering, setOffering] = useState<PickerOption | null>(null);
  const [prompt, setPrompt] = useState<PickerOption | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const createGeneration = useCreateGeneration(prospect?.id ?? "");
  const copyMessage = useCopyMessage(prospect?.id ?? "");
  const generation = useGeneration(activeId);

  const status = generation.data?.status;
  const message = generation.data?.message;
  const settled = status === "completed" || status === "failed";
  const waiting =
    createGeneration.isPending || (Boolean(activeId) && !settled);
  const ready = Boolean(prospect && offering && prompt);

  function generate() {
    if (!prospect || !offering || !prompt || waiting) return;
    createGeneration.mutate(
      { offeringId: offering.id, promptId: prompt.id, prospectId: prospect.id },
      {
        onSuccess: (gen) => setActiveId(gen.id),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <section className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[var(--accent-text)]" />
        <h2 className="text-sm font-medium text-[var(--text-primary)]">
          Generate a message
        </h2>
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Pick a prospect, an offering, and a prompt to draft a personalized
        outreach message.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Prospect">
          <EntityPicker
            noun="prospect"
            placeholder="Select a prospect"
            selected={prospect}
            onSelect={setProspect}
            useItems={useProspectsInfinite}
            toOption={(p) => ({ id: p.id, label: p.name })}
          />
        </Field>
        <Field label="Offering">
          <EntityPicker
            noun="offering"
            placeholder="Select an offering"
            selected={offering}
            onSelect={setOffering}
            useItems={useOfferingsInfinite}
            toOption={(o) => ({ id: o.id, label: o.name })}
            toPreview={(o) =>
              o.summary ? (
                <>
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    {o.name}
                  </p>
                  <p>{o.summary}</p>
                </>
              ) : undefined
            }
          />
        </Field>
        <Field label="Prompt">
          <EntityPicker
            noun="prompt"
            placeholder="Select a prompt"
            selected={prompt}
            onSelect={setPrompt}
            useItems={usePromptsInfinite}
            toOption={(p) => ({
              id: p.id,
              label: p.isDefault ? `${p.name} (default)` : p.name,
            })}
          />
        </Field>
      </div>

      <Button className="mt-4" onClick={generate} disabled={!ready || waiting}>
        {waiting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {waiting ? "Generating" : "Generate"}
      </Button>

      <AnimatePresence mode="wait" initial={false}>
        {waiting ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={OUTPUT_TRANSITION}
            className="mt-4 flex items-center gap-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-base)] p-4 text-xs text-[var(--text-muted)]"
          >
            <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-text)]" />
            Crafting your message…
          </motion.div>
        ) : status === "failed" ? (
          <motion.div
            key="failed"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={OUTPUT_TRANSITION}
            className="mt-4 flex items-center gap-2 rounded-md border border-[var(--state-error)] bg-[var(--state-error-subtle)] p-4 text-xs text-[var(--state-error)]"
            role="alert"
          >
            <TriangleAlert className="h-4 w-4" />
            Generation failed. Please try again.
          </motion.div>
        ) : message ? (
          <div className="mt-4">
            <CopyableMessage
              content={message.content}
              onCopy={() => copyMessage.mutate(message.id)}
            />
          </div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
