"use client";

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

/**
 * Top-of-home metrics from the analytics dashboard endpoint: lifetime messages,
 * last-30-day volume, prospects saved, and conversations with a reply.
 */
export function StatCards() {
  const dashboard = useDashboard();

  if (dashboard.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
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
    { label: "Messages", value: dashboard.data.totalMessages, icon: MessageSquare },
    { label: "Last 30 days", value: dashboard.data.messagesLast30Days, icon: TrendingUp },
    { label: "Prospects", value: dashboard.data.prospectsCount, icon: Users },
    { label: "Replies", value: dashboard.data.conversationsWithReplies, icon: Reply },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)]">
              {stat.label}
            </span>
            <stat.icon className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            {stat.value.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
