"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

/** Approx panel size, used only to flip the tooltip away from viewport edges. */
const PREVIEW_W = 288;
const PREVIEW_H = 160;

interface CursorTooltip {
  /** Spread onto the hover host element. */
  onMouseMove: (e: MouseEvent) => void;
  onMouseLeave: () => void;
  /** Portal node to render once anywhere in the tree (null when inactive). */
  tooltip: ReactNode;
}

/**
 * Cursor-following tooltip shared by the list cards and the entity picker rows.
 * Renders into `document.body` (fixed position survives ancestor transforms),
 * flips away from the right/bottom viewport edges, and fades in/out via motion.
 * Inactive (no handlers fire, no node) when `content` is empty or `enabled` is
 * false — so callers can wire it unconditionally.
 */
export function useCursorTooltip(
  content: ReactNode,
  enabled = true,
): CursorTooltip {
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const active = Boolean(content) && enabled;

  function onMouseMove(e: MouseEvent) {
    if (!active) return;
    const x =
      e.clientX + 16 + PREVIEW_W > window.innerWidth
        ? e.clientX - PREVIEW_W - 16
        : e.clientX + 16;
    const y =
      e.clientY + 16 + PREVIEW_H > window.innerHeight
        ? e.clientY - PREVIEW_H - 16
        : e.clientY + 16;
    setCursor({ x: Math.max(8, x), y: Math.max(8, y) });
  }

  const tooltip =
    typeof document !== "undefined"
      ? createPortal(
          <AnimatePresence>
            {active && cursor ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                style={{ left: cursor.x, top: cursor.y, width: PREVIEW_W }}
                className="pointer-events-none fixed z-50 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-3 text-xs leading-relaxed text-[var(--text-secondary)] shadow-[var(--shadow-pop)]"
              >
                {content}
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
      : null;

  return { onMouseMove, onMouseLeave: () => setCursor(null), tooltip };
}
