/**
 * Opaque keyset-pagination cursor shared by the list services. A cursor points
 * at the last row of the previous page via its `createdAt` + `id` so the next
 * query can resume with `(createdAt, id) < (cursor.createdAt, cursor.id)`. The
 * token is base64 JSON — opaque to the client, never parsed on the frontend.
 */

import { and, eq, lt, or, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { CursorPage } from "@bespoke/shared";

export interface Cursor {
  createdAt: string;
  id: string;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function encodeCursor(row: { createdAt: Date; id: string }): string {
  const payload: Cursor = {
    createdAt: row.createdAt.toISOString(),
    id: row.id,
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

/** Returns null for a missing or malformed token rather than throwing. */
export function decodeCursor(token: string | undefined): Cursor | null {
  if (!token) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(token, "base64url").toString("utf8"),
    ) as Partial<Cursor>;
    if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") {
      return null;
    }
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

/** Clamp a requested page size into the allowed range. */
export function clampLimit(limit: number | undefined): number {
  if (!limit || limit < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(limit, MAX_PAGE_SIZE);
}

/**
 * Keyset predicate that selects rows strictly "after" the cursor under a
 * `createdAt DESC, id DESC` ordering. Returns undefined for the first page.
 */
export function keysetBefore(
  createdAtCol: PgColumn,
  idCol: PgColumn,
  cursor: Cursor | null,
): SQL | undefined {
  if (!cursor) return undefined;
  const date = new Date(cursor.createdAt);
  return or(
    lt(createdAtCol, date),
    and(eq(createdAtCol, date), lt(idCol, cursor.id)),
  );
}

/**
 * Slice a `limit + 1` row fetch into a page, deriving `nextCursor` from the
 * extra row's presence. Pass the same `limit` used to bound the query.
 */
export function toPage<T extends { createdAt: Date; id: string }>(
  rows: T[],
  limit: number,
): CursorPage<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  return { items, nextCursor: hasMore && last ? encodeCursor(last) : null };
}
