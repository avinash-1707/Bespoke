"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { GenerationModel } from "@bespoke/shared";
import { useSettings, useUpdateSettings } from "@/lib/hooks/use-settings";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Generation-model setting, surfaced as a modal from the profile menu. Replaces
 * the standalone /settings page; the model drives every message generation.
 */
export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const settings = useSettings();
  const updateSettings = useUpdateSettings();
  const [model, setModel] = useState<GenerationModel | "">("");

  useEffect(() => {
    if (settings.data) setModel(settings.data.generationModel);
  }, [settings.data]);

  function save() {
    if (!model) return;
    updateSettings.mutate(model, {
      onSuccess: () => {
        toast.success("Generation model updated");
        onOpenChange(false);
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
            Choose the model used to generate messages and replies.
          </DialogDescription>
        </DialogHeader>

        {settings.isLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : settings.isError ? (
          <p className="text-sm text-[var(--state-error)]" role="alert">
            {settings.error.message}
          </p>
        ) : settings.data ? (
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
                {settings.data.supportedModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button onClick={save} disabled={updateSettings.isPending || !model}>
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
