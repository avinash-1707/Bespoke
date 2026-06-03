"use client";

import { type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import {
  Building2,
  Check,
  GitBranch,
  Globe,
  Image as ImageIcon,
  Link2,
  Loader2,
  Plus,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { ProspectAssetType } from "@bespoke/shared";
import type { ProspectAssetInput } from "@/lib/hooks/use-prospects";
import {
  uploadToCloudinary,
  useCloudinarySignature,
} from "@/lib/hooks/use-uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** A single in-progress asset row before the prospect is saved. */
export interface AssetDraft {
  id: string;
  type: ProspectAssetType;
  /** For every non-screenshot type. */
  url: string;
  /** Cloudinary public_id once a screenshot finishes uploading. */
  fileKey?: string;
  fileName?: string;
  uploading: boolean;
}

interface AssetOption {
  type: ProspectAssetType;
  label: string;
  rowLabel: string;
  placeholder: string;
  icon: LucideIcon;
}

const ASSET_OPTIONS: AssetOption[] = [
  {
    type: "linkedin_screenshot",
    label: "LinkedIn profile screenshot",
    rowLabel: "LinkedIn screenshot",
    placeholder: "",
    icon: ImageIcon,
  },
  {
    type: "github",
    label: "GitHub profile URL",
    rowLabel: "GitHub",
    placeholder: "https://github.com/username",
    icon: GitBranch,
  },
  {
    type: "personal_site",
    label: "Personal website or portfolio URL",
    rowLabel: "Personal site",
    placeholder: "https://…",
    icon: Globe,
  },
  {
    type: "company_site",
    label: "Company website",
    rowLabel: "Company site",
    placeholder: "https://…",
    icon: Building2,
  },
  {
    type: "other_url",
    label: "Any other URL or context",
    rowLabel: "Other",
    placeholder: "https://… or anything relevant",
    icon: Link2,
  },
];

const OPTION_BY_TYPE = new Map(ASSET_OPTIONS.map((o) => [o.type, o]));

/** Build the API asset payload, dropping rows the user left empty. */
export function draftsToAssets(drafts: AssetDraft[]): ProspectAssetInput[] {
  return drafts.flatMap<ProspectAssetInput>((d) => {
    if (d.type === "linkedin_screenshot") {
      return d.fileKey ? [{ assetType: d.type, fileKey: d.fileKey }] : [];
    }
    const url = d.url.trim();
    return url ? [{ assetType: d.type, url }] : [];
  });
}

/** True while any screenshot is still uploading — blocks submit. */
export function assetsUploading(drafts: AssetDraft[]): boolean {
  return drafts.some((d) => d.uploading);
}

interface ProspectAssetEditorProps {
  drafts: AssetDraft[];
  setDrafts: Dispatch<SetStateAction<AssetDraft[]>>;
}

/**
 * Add-asset dropdown plus an editable row per chosen asset. URL types render a
 * text input; a LinkedIn screenshot renders a file picker that uploads direct
 * to Cloudinary and keeps the returned public_id as the row's file key.
 */
export function ProspectAssetEditor({
  drafts,
  setDrafts,
}: ProspectAssetEditorProps) {
  const signature = useCloudinarySignature();

  function addDraft(type: ProspectAssetType) {
    setDrafts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type, url: "", uploading: false },
    ]);
  }

  function patchDraft(id: string, patch: Partial<AssetDraft>) {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    );
  }

  function removeDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleFile(id: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    patchDraft(id, {
      uploading: true,
      fileName: file.name,
      fileKey: undefined,
    });
    try {
      const sig = await signature.mutateAsync(undefined);
      const { publicId } = await uploadToCloudinary(file, sig);
      patchDraft(id, { uploading: false, fileKey: publicId });
    } catch (error) {
      patchDraft(id, { uploading: false, fileName: undefined });
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Research assets</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Plus className="h-4 w-4" />
              Add asset
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ASSET_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.type}
                onSelect={() => addDraft(opt.type)}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {drafts.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">
          Add a LinkedIn screenshot, GitHub, or any URL to enrich this prospect.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {drafts.map((draft) => {
            const opt = OPTION_BY_TYPE.get(draft.type);
            if (!opt) return null;
            const Icon = opt.icon;
            return (
              <li
                key={draft.id}
                className="flex items-center gap-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-2"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-[var(--text-secondary)]">
                  <Icon className="h-4 w-4" />
                </span>

                {draft.type === "linkedin_screenshot" ? (
                  <Label
                    htmlFor={`asset-file-${draft.id}`}
                    className="flex flex-1 cursor-pointer items-center gap-2 truncate text-sm text-[var(--text-secondary)]"
                  >
                    {draft.uploading ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : draft.fileKey ? (
                      <Check className="h-4 w-4 shrink-0 text-[var(--state-success)]" />
                    ) : (
                      <Upload className="h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">
                      {draft.fileName ?? "Choose a screenshot image"}
                    </span>
                    <input
                      id={`asset-file-${draft.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFile(draft.id, e)}
                    />
                  </Label>
                ) : (
                  <Input
                    value={draft.url}
                    onChange={(e) =>
                      patchDraft(draft.id, { url: e.target.value })
                    }
                    placeholder={opt.placeholder}
                    className="flex-1"
                  />
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  onClick={() => removeDraft(draft.id)}
                  aria-label={`Remove ${opt.rowLabel}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
