import { eq } from "drizzle-orm";
import { schema, type UserSettings } from "@bespoke/db";
import {
  DEFAULT_GENERATION_MODEL,
  type GenerationModel,
} from "@bespoke/shared";
import { db } from "../context";

export interface SettingsView {
  generationModel: GenerationModel;
}

/**
 * Resolved settings for a user — always returns a usable value, falling back
 * to the server default when the user has not chosen a model or has no row.
 */
export async function getSettings(userId: string): Promise<SettingsView> {
  const [row] = await db
    .select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, userId));

  return {
    generationModel: row?.generationModel ?? DEFAULT_GENERATION_MODEL,
  };
}

/** Upsert the user's preferences. One row per user (unique `user_id`). */
export async function updateSettings(
  userId: string,
  generationModel: GenerationModel,
): Promise<SettingsView> {
  await db
    .insert(schema.userSettings)
    .values({ userId, generationModel })
    .onConflictDoUpdate({
      target: schema.userSettings.userId,
      set: { generationModel },
    });

  return { generationModel };
}

/** The raw row (or null), for callers needing the stored value, not the default. */
export async function getSettingsRow(
  userId: string,
): Promise<UserSettings | null> {
  const [row] = await db
    .select()
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, userId));
  return row ?? null;
}
