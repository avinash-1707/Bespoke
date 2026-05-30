/**
 * Standard API envelope. Every Fastify handler returns `{ data: T }` on
 * success and `{ error, code }` on failure — the web client narrows on the
 * `error` field. Keep these in sync with the api response serializers.
 */

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: string;
  code: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export function isApiError<T>(result: ApiResult<T>): result is ApiError {
  return "error" in result;
}

/** Returned immediately when an endpoint enqueues background work. */
export interface JobAccepted {
  jobId: string;
}

/** Cursor-free pagination payload for list endpoints. */
export interface Paginated<T> {
  items: T[];
  total: number;
}

/**
 * Keyset (cursor) pagination payload. `nextCursor` is an opaque token the
 * client passes back to fetch the following page; null means the last page.
 */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

/** Query params accepted by cursor-paginated, searchable list endpoints. */
export interface ListQuery {
  cursor?: string;
  limit?: number;
  q?: string;
}
