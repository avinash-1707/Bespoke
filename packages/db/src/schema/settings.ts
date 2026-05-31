import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import type { GenerationModel } from "@bespoke/shared";
import { user } from "./auth";
import { timestamps } from "./_shared";

/**
 * Per-user preferences. One row per user (unique FK). `generationModel` is the
 * chosen OpenRouter slug; null means "use the server default". Typed to the
 * shared `GenerationModel` union — the api validates against the same list.
 *
 * `openrouterApiKeyEncrypted` holds the user's own OpenRouter key, encrypted at
 * rest (AES-256-GCM, `iv:tag:cipher` base64). Null means no key. The api never
 * returns the value — only a `hasOpenRouterKey` boolean. When present, the
 * worker decrypts it to run that user's generations on their own key.
 */
export const userSettings = pgTable("user_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  generationModel: text("generation_model").$type<GenerationModel>(),
  openrouterApiKeyEncrypted: text("openrouter_api_key_encrypted"),
  ...timestamps,
});
