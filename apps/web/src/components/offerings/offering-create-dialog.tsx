"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useCreateOffering } from "@/lib/hooks/use-offerings";
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

interface OfferingCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Minimal offering creation: name, an optional description, and an optional URL
 * to scrape in the background. The full structured fields are edited later on
 * the offering detail page.
 */
export function OfferingCreateDialog({
  open,
  onOpenChange,
}: OfferingCreateDialogProps) {
  const create = useCreateOffering();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setSourceUrl("");
  }, [open]);

  function submit() {
    if (!name.trim()) return;
    // Optimistic create + close immediately; the hook handles rollback/toast on error.
    create.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New offering</DialogTitle>
          <DialogDescription>
            Describe what you are selling. Add a URL to scrape its details
            automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="offering-name">Name</Label>
            <Input
              id="offering-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme analytics platform"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="offering-description">Description</Label>
            <Textarea
              id="offering-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What it is and who it is for…"
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="offering-url">URL to scrape (optional)</Label>
            <Input
              id="offering-url"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending || !name.trim()}>
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
