"use client";

import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import {
  MessageSquare,
  Reply,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useDashboard } from "@/lib/hooks/use-analytics";
import { Skeleton } from "@/components/ui/skeleton";

interface Stat {
  label: string;
  value: number;
  icon: LucideIcon;
}

const CARD_TRANSITION = { duration: 0.4, ease: [0.22, 1, 0.36, 1] } as const;

/**
 * Top-of-home metrics from the analytics dashboard endpoint: lifetime messages,
 * last-30-day volume, prospects saved, and conversations with a reply. Each
 * reads as a small gauge — a tinted icon chip, a count-up value, and a mono
 * caption — and the four reveal in a single staggered load (Emil: one
 * orchestrated entrance beats scattered micro-interactions).
 */
export function StatCards() {
  const dashboard = useDashboard();

  if (dashboard.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <p className="text-sm text-[var(--state-error)]" role="alert">
        {dashboard.error?.message ?? "Could not load stats."}
      </p>
    );
  }

  const stats: Stat[] = [
    {
      label: "Messages",
      value: dashboard.data.totalMessages,
      icon: MessageSquare,
    },
    {
      label: "Last 30 days",
      value: dashboard.data.messagesLast30Days,
      icon: TrendingUp,
    },
    { label: "Prospects", value: dashboard.data.prospectsCount, icon: Users },
    {
      label: "Replies",
      value: dashboard.data.conversationsWithReplies,
      icon: Reply,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...CARD_TRANSITION, delay: i * 0.06 }}
          className="group relative overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)] transition-[box-shadow,border-color] duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-pop)] motion-safe:transition-[transform,box-shadow,border-color] motion-safe:hover:-translate-y-0.5"
        >
          {/* Accent top hairline — fades up from a dim hint on hover. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-30 transition-opacity duration-200 group-hover:opacity-90"
          />

          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--accent-subtle)] text-[var(--accent-text)] ring-1 ring-inset ring-[var(--border-default)]">
              <stat.icon className="h-4 w-4" />
            </span>
          </div>

          <CountUp
            value={stat.value}
            className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-[var(--text-primary)]"
          />
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Counts from 0 to the target once on mount. The animation is a single
 * page-load delight (not repeated per interaction), so it stays brief; under
 * reduced-motion it snaps straight to the final value. `tabular-nums` on the
 * parent keeps the width from jittering as digits change.
 */
function CountUp({ value, className }: { value: number; className?: string }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, reduced]);

  return <p className={className}>{display.toLocaleString()}</p>;
}
