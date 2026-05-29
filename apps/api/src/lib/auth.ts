import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDatabase } from "@bespoke/db";
import { config } from "../config";

/**
 * Better Auth instance — owns the auth tables (user, session, account,
 * verification). Our domain tables reference `user.id` by foreign key; we
 * never define the user table ourselves.
 *
 * This module is the source the Better Auth CLI reads to generate the Drizzle
 * schema, and the same instance the Fastify auth plugin mounts at runtime.
 */
const db = createDatabase(config.DATABASE_URL);

export const auth = betterAuth({
  appName: "Bespoke",
  baseURL: config.BETTER_AUTH_URL,
  secret: config.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [config.WEB_ORIGIN],
});

export type Auth = typeof auth;
