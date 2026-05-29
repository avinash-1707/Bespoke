/**
 * Drizzle-inferred entity types are re-exported here for the web app, which
 * must not import from `@bespoke/db` directly. Populated in the database
 * foundation unit once the schema exists, e.g.:
 *
 *   export type { Offering, Prospect } from "@bespoke/db";
 *
 * Intentionally empty until the schema lands.
 */

export {};
