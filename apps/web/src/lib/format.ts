/** Compact relative time ("just now", "3h ago", "2d ago", or a date). */
export function timeAgo(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** True for client-side optimistic placeholder ids (not yet persisted). */
export function isOptimisticId(id: string): boolean {
  return id.startsWith("optimistic-");
}
