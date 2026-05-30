"use client";

import { PanelRightClose } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuilderTemplatesTab } from "./builder-templates-tab";
import { BuilderFormTab } from "./builder-form-tab";

interface PromptBuilderPanelProps {
  /** Inserts a generated draft into the editor (overwrite is confirmed upstream). */
  onApply: (content: string, suggestedName: string) => void;
  /** Collapses the panel back to the plain editor. */
  onClose: () => void;
}

/**
 * Guided prompt creation surface that lives beside the editor. Two tabs:
 * Templates (one-click presets) and Builder (a structured form). Both only
 * produce an editable draft; the editor stays the source of truth.
 */
export function PromptBuilderPanel({ onApply, onClose }: PromptBuilderPanelProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Prompt Builder
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Generate a starting draft, then edit it freely.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Collapse prompt builder"
          className="rounded-md p-1 text-[var(--text-muted)] transition-colors duration-150 hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      <Tabs defaultValue="templates" className="flex min-h-0 flex-1 flex-col gap-3">
        <TabsList className="w-full">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="builder">Builder</TabsTrigger>
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <TabsContent value="templates" className="mt-0">
            <BuilderTemplatesTab onApply={onApply} />
          </TabsContent>
          <TabsContent value="builder" className="mt-0">
            <BuilderFormTab onApply={onApply} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
