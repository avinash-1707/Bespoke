"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useCreateProspect } from "@/lib/hooks/use-prospects";
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
import {
  ProspectAssetEditor,
  assetsUploading,
  draftsToAssets,
  type AssetDraft,
} from "@/components/prospects/prospect-asset-editor";

interface ProspectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Prospect creation: identity fields, optional notes, and research assets
 * (LinkedIn screenshot, GitHub, sites, any URL) added inline via the asset
 * editor. Screenshots upload to Cloudinary before submit; URL assets and the
 * screenshot's file key are sent with the create request.
 */
export function ProspectCreateDialog({
  open,
  onOpenChange,
}: ProspectCreateDialogProps) {
  const create = useCreateProspect();
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [assets, setAssets] = useState<AssetDraft[]>([]);

  useEffect(() => {
    if (!open) return;
    setName("");
    setJobTitle("");
    setCompanyName("");
    setEmail("");
    setNotes("");
    setAssets([]);
  }, [open]);

  const uploading = assetsUploading(assets);

  function submit() {
    if (!name.trim() || uploading) return;
    const assetInputs = draftsToAssets(assets);
    create.mutate(
      {
        name: name.trim(),
        jobTitle: jobTitle.trim() || undefined,
        companyName: companyName.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        assets: assetInputs.length > 0 ? assetInputs : undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New prospect</DialogTitle>
          <DialogDescription>
            Save who you are reaching out to, and attach any research assets to
            enrich the outreach.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="prospect-name">Name</Label>
            <Input
              id="prospect-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Lee"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="prospect-title">Job title</Label>
              <Input
                id="prospect-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Head of Growth"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="prospect-company">Company</Label>
              <Input
                id="prospect-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="prospect-email">Email</Label>
            <Input
              id="prospect-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan@acme.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="prospect-notes">Notes</Label>
            <Textarea
              id="prospect-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything useful for personalizing the outreach…"
              rows={3}
              className="resize-none"
            />
          </div>

          <ProspectAssetEditor drafts={assets} setDrafts={setAssets} />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={create.isPending || uploading || !name.trim()}
          >
            {create.isPending || uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {uploading ? "Uploading…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
