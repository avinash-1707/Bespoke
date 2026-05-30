import { Skeleton } from "@/components/ui/skeleton";

interface ListSkeletonProps {
  /** Number of placeholder cards to render. Defaults to 6. */
  count?: number;
}

/**
 * Card-shaped loading placeholder for the entity list grids. Matches the real
 * card footprint (title line, two body lines, a meta row) so the first paint
 * does not shift layout when data arrives.
 */
export function ListSkeleton({ count = 6 }: ListSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
        >
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
          <Skeleton className="mt-4 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
