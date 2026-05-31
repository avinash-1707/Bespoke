"use client";

import { useEffect, useState } from "react";
import { Check, KeyRound, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { GenerationModel } from "@bespoke/shared";
import {
  useRemoveOpenRouterKey,
  useSaveOpenRouterKey,
  useSettings,
  useUpdateSettings,
} from "@/lib/hooks/use-settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Generation-model setting, surfaced as a modal from the profile menu. Starred
 * models are paid and run on the user's own OpenRouter key, which is verified
 * and stored (encrypted) here. Gemini models are free and need no key.
 */
export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const settings = useSettings();
  const updateSettings = useUpdateSettings();
  const saveKey = useSaveOpenRouterKey();
  const removeKey = useRemoveOpenRouterKey();
  const [model, setModel] = useState<GenerationModel | "">("");
  const [keyInput, setKeyInput] = useState("");

  useEffect(() => {
    if (settings.data) setModel(settings.data.generationModel);
  }, [settings.data]);

  const data = settings.data;
  const hasKey = data?.hasOpenRouterKey ?? false;
  const selected = data?.supportedModels.find((m) => m.id === model);
  const needsKey = !!selected && !selected.free && !hasKey;

  function save() {
    if (!model || needsKey) return;
    updateSettings.mutate(model, {
      onSuccess: () => {
        toast.success("Generation model updated");
        onOpenChange(false);
      },
      onError: (error) => toast.error(error.message),
    });
  }

  function verifyKey() {
    const apiKey = keyInput.trim();
    if (!apiKey) return;
    saveKey.mutate(apiKey, {
      onSuccess: () => {
        toast.success("OpenRouter key verified and saved");
        setKeyInput("");
      },
      onError: (error) => toast.error(error.message),
    });
  }

  function disconnectKey() {
    removeKey.mutate(undefined, {
      onSuccess: (result) => {
        setModel(result.generationModel);
        toast.success("OpenRouter key removed");
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Choose the model used to generate messages and replies. Starred
            models run on your own OpenRouter key.
          </DialogDescription>
        </DialogHeader>

        {settings.isLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : settings.isError ? (
          <p className="text-sm text-[var(--state-error)]" role="alert">
            {settings.error.message}
          </p>
        ) : data ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="generation-model">Generation model</Label>
              <Select
                value={model}
                onValueChange={(value) => setModel(value as GenerationModel)}
              >
                <SelectTrigger id="generation-model" className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {data.supportedModels.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-1.5">
                        {!m.free ? (
                          <Star className="h-3 w-3 text-[var(--accent-text)]" />
                        ) : null}
                        {m.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {needsKey ? (
                <p className="text-xs text-[var(--state-warning)]">
                  Add your OpenRouter key below to use starred models.
                </p>
              ) : null}
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>OpenRouter key</Label>
              {hasKey ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Check className="h-3.5 w-3.5 text-[var(--state-success)]" />
                    Your key is connected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={disconnectKey}
                    disabled={removeKey.isPending}
                  >
                    {removeKey.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      placeholder="sk-or-..."
                      value={keyInput}
                      autoComplete="off"
                      onChange={(event) => setKeyInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") verifyKey();
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={verifyKey}
                      disabled={saveKey.isPending || !keyInput.trim()}
                    >
                      {saveKey.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                      Verify
                    </Button>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Stored encrypted. Used for your generations on paid models.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateSettings.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={updateSettings.isPending || !model || needsKey}
          >
            {updateSettings.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
