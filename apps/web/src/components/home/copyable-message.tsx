"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const ENTER_TRANSITION = { duration: 0.24, ease: [0.22, 1, 0.36, 1] } as const;
const HINT_TRANSITION = { duration: 0.16, ease: [0.22, 1, 0.36, 1] } as const;

interface CopyableMessageProps {
  content: string;
  /** Fired after a successful clipboard write — used to record the copy count. */
  onCopy?: () => void;
}

/**
 * The generated message rendered in a mono panel that copies its full content on
 * click (or keyboard activation). A minimal hint below crossfades to a confirmed
 * state on copy. Enter motion (fade + lift + deblur) matches the product list
 * convention; reduced-motion is honored globally via the dashboard MotionConfig.
 */
export function CopyableMessage({ content, onCopy }: CopyableMessageProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      return;
    }
    setCopied(true);
    onCopy?.();
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 4, filter: "blur(4px)" }}
      transition={ENTER_TRANSITION}
      className="flex flex-col gap-2"
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Copy message to clipboard"
        onClick={copy}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            void copy();
          }
        }}
        className={cn(
          "cursor-pointer rounded-md border bg-[var(--bg-base)] p-4 transition-colors",
          "hover:bg-[var(--bg-surface-hover)] focus-visible:outline-none",
          copied
            ? "border-[var(--accent-primary)]"
            : "border-[var(--border-default)] hover:border-[var(--border-strong)]",
        )}
      >
        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-[var(--text-primary)]">
          {content}
        </pre>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="copied"
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={HINT_TRANSITION}
              className="flex items-center gap-1.5 text-[var(--accent-text)]"
            >
              <Check className="h-3.5 w-3.5" />
              Copied to clipboard
            </motion.span>
          ) : (
            <motion.span
              key="hint"
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={HINT_TRANSITION}
              className="flex items-center gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              Click to copy
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
