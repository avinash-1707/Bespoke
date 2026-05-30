"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Prompt } from "@bespoke/db";
import {
  useCreatePrompt,
  useUpdatePrompt,
} from "@/lib/hooks/use-prompts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog edits this prompt; otherwise it creates one. */
  prompt?: Prompt;
}

/**
 * Create / edit form for a prompt. Prompts are small, so they edit in a modal
 * rather than a detail route. The single-default rule is enforced server-side;
 * the checkbox only requests it.
 */
export function PromptDialog({ open, onOpenChange, prompt }: PromptDialogProps) {
  const isEdit = Boolean(prompt);
  const create = useCreatePrompt();
  const update = useUpdatePrompt(prompt?.id ?? "");
  const pending = create.isPending || update.isPending;

  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Reset the form to the prompt (edit) or blank (create) each time it opens.
  useEffect(() => {
    if (!open) return;
    setName(prompt?.name ?? "");
    setSystemPrompt(prompt?.systemPrompt ?? "");
    setIsDefault(prompt?.isDefault ?? false);
  }, [open, prompt]);

  function submit() {
    const input = { name: name.trim(), systemPrompt: systemPrompt.trim(), isDefault };
    if (!input.name || !input.systemPrompt) return;
    const onSuccess = () => onOpenChange(false);
    if (isEdit) update.mutate(input, { onSuccess });
    else create.mutate(input, { onSuccess });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit prompt" : "New prompt"}</DialogTitle>
          <DialogDescription>
            A reusable system prompt that sets tone, length, and angle for
            generated messages.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="prompt-name">Name</Label>
            <Input
              id="prompt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Warm, concise opener"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="prompt-body">System prompt</Label>
            <Textarea
              id="prompt-body"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Write in a warm, direct voice. Keep it under 90 words…"
              rows={7}
              className="resize-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Checkbox
              checked={isDefault}
              onCheckedChange={(v) => setIsDefault(v === true)}
            />
            Use as my default prompt
          </label>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={pending || !name.trim() || !systemPrompt.trim()}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
