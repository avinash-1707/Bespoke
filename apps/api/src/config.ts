import { z } from "zod";

/**
 * Validated environment for the api. `process.env` is read here and nowhere
 * else — the rest of the app imports the typed `config` object. Invalid or
 * missing values fail fast at boot with a clear message.
 */
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(16),
  BETTER_AUTH_URL: z.string().url(),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "Invalid api environment:",
    z.treeifyError(parsed.error),
  );
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
