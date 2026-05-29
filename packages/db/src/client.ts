import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

export type Database = ReturnType<typeof createDatabase>;

/**
 * Build a Drizzle client from a connection string. The caller (api/worker)
 * owns reading and validating `DATABASE_URL` via its own `config.ts` — this
 * factory never touches `process.env`, so it stays reusable and testable.
 */
export function createDatabase(connectionString: string) {
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}
