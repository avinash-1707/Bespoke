"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { PROMPT_TEMPLATES, type PromptTemplate } from "@/lib/prompt-builder";

interface BuilderTemplatesTabProps {
  /** Inserts the chosen template's boilerplate into the editor. */
  onApply: (content: string, suggestedName: string) => void;
}

/**
 * Grid of predefined prompt templates. Selecting one generates its boilerplate
 * and hands it to the editor. The cards stagger in once on mount (a rare,
 * one-time reveal) and stay still afterwards.
 */
export function BuilderTemplatesTab({ onApply }: BuilderTemplatesTabProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {PROMPT_TEMPLATES.map((template, i) => (
        <TemplateCard
          key={template.id}
          template={template}
          index={i}
          onSelect={() => onApply(template.build(), template.suggestedName)}
        />
      ))}
    </div>
  );
}

function TemplateCard({
  template,
  index,
  onSelect,
}: {
  template: PromptTemplate;
  index: number;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.03,
      }}
      className="group flex flex-col items-start gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-left transition-colors duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)] focus-visible:border-[var(--accent-primary)] focus-visible:shadow-[0_0_0_3px_var(--accent-subtle)] focus-visible:outline-none active:translate-y-px"
    >
      <span className="flex w-full items-center justify-between gap-2 text-sm font-medium text-[var(--text-primary)]">
        {template.label}
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100" />
      </span>
      <span className="text-xs text-[var(--text-muted)]">{template.description}</span>
    </motion.button>
  );
}
