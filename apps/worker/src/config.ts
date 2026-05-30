import { z } from "zod";

/**
 * Validated environment for the worker. Read once here; the rest of the
 * worker imports the typed `config`. Concurrency per queue is set in code
 * (architecture default: 5 scrape, 3 generate), not via env.
 */
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_MODEL: z.string().default("anthropic/claude-sonnet-latest"),
  FIRECRAWL_API_KEY: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "Invalid worker environment:",
    z.treeifyError(parsed.error),
  );
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
