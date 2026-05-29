import { createDatabase } from "@bespoke/db";
import { config } from "../config";

/** Shared Drizzle client for the worker process. */
export const db = createDatabase(config.DATABASE_URL);
