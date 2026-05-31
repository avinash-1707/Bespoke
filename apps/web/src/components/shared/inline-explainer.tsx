"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HelpCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useExplain, type ExplainTopic } from "@/lib/hooks/use-ai-explain";

interface InlineExplainerProps {
  /** Which concept this explains. */
  topic: ExplainTopic;
  /** Static, always-visible spec copy. Doubles as the fallback if AI fails. */
  staticCopy: string;
  /**
   * Returns the user's current draft, if any. When it returns content the AI
   * button reviews that draft instead of explaining the concept generically.
   */
  getDraft?: () => string | undefined;
  /** Trigger label. Defaults to "What's this?". */
  label?: string;
}

/**
 * Inline AI helper for the offering / prompt setup surfaces. The popover always
 * shows the plain-language spec copy immediately (so the explainer works even
 * offline), with an AI button on top that fetches a fresh, draft-aware
 * explanation. Failures fall back silently to the static copy.
 */
export function InlineExplainer({
  topic,
  staticCopy,
  getDraft,
  label = "What's this?",
}: InlineExplainerProps) {
  const explain = useExplain();
  const [aiText, setAiText] = useState<string | null>(null);
  const draft = getDraft?.()?.trim();
  const hasDraft = Boolean(draft);

  function ask() {
    explain.mutate(
      { topic, draft: hasDraft ? draft : undefined },
      { onSuccess: (data) => setAiText(data.text) },
    );
  }

  return (
    <Popover
      onOpenChange={(open: boolean) => {
        // Reset between opens so a stale answer never lingers.
        if (!open) {
          setAiText(null);
          explain.reset();
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-text)]"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 text-sm">
        <p className="leading-relaxed text-[var(--text-secondary)]">
          {staticCopy}
        </p>

        <AnimatePresence>
          {aiText ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 rounded-md border border-[var(--border-default)] bg-[var(--accent-subtle)] p-3"
            >
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[var(--accent-text)]">
                <Sparkles className="h-3.5 w-3.5" />
                {hasDraft ? "On your draft" : "From AI"}
              </div>
              <p className="leading-relaxed text-[var(--text-primary)]">
                {aiText}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={ask}
          disabled={explain.isPending}
          className="mt-3 w-full"
        >
          {explain.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent-text)]" />
          )}
          {hasDraft
            ? "Review my draft with AI"
            : aiText
              ? "Ask again"
              : "Explain with AI"}
        </Button>

        {explain.isError ? (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            AI is unavailable right now. The explanation above still applies.
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
