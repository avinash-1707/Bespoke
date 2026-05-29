import { createDatabase } from "@bespoke/db";
import { config } from "./config";

/**
 * Single shared Drizzle client for the api process. Auth and all services
 * import this — one connection pool, one source of truth. Redis/queues live
 * in `queue.ts` so the auth config (and the Better Auth CLI that loads it)
 * never pulls a Redis connection into its import graph.
 */
export const db = createDatabase(config.DATABASE_URL);
