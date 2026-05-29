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
