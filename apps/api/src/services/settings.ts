import { eq } from "drizzle-orm";
import { schema, type UserSettings } from "@bespoke/db";
import {
  DEFAULT_GENERATION_MODEL,
  isFreeModel,
  type GenerationModel,
} from "@bespoke/shared";
import { db } from "../context";
import { encryptSecret } from "../lib/crypto";
import { verifyOpenRouterKey } from "../lib/openrouter";

export interface SettingsView {
  generationModel: GenerationModel;
  /** Whether the user has a stored OpenRouter key. The key itself is never returned. */
  hasOpenRouterKey: boolean;
}

/** Selecting a non-free model requires a stored key. */
export type UpdateModelResult =
  | { ok: true; settings: SettingsView }
  | { ok: false; reason: "key_required" };

/** A bad key is rejected at save time after live verification. */
export type SetKeyResult = { ok: true } | { ok: false; reason: "invalid_key" };

/**
 * Resolved settings for a user — always returns a usable value, falling back
 * to the server default when the user has not chosen a model or has no row.
 * Defensively downgrades to the default when the stored model is non-free but
 * no key is present (so a removed key never leaves a paid model selected).
 */
export async function getSettings(userId: string): Promise<SettingsView> {
  const row = await getSettingsRow(userId);
  const hasOpenRouterKey = row?.openrouterApiKeyEncrypted != null;
  const stored = row?.generationModel ?? DEFAULT_GENERATION_MODEL;
  const generationModel =
    !isFreeModel(stored) && !hasOpenRouterKey
      ? DEFAULT_GENERATION_MODEL
      : stored;
  return { generationModel, hasOpenRouterKey };
}

/**
 * Set the user's generation model. Non-free models require a stored OpenRouter
 * key; without one the change is rejected so the worker is never asked to run a
 * paid model on the platform key.
 */
export async function updateSettings(
  userId: string,
  generationModel: GenerationModel,
): Promise<UpdateModelResult> {
  const row = await getSettingsRow(userId);
  const hasOpenRouterKey = row?.openrouterApiKeyEncrypted != null;

  if (!isFreeModel(generationModel) && !hasOpenRouterKey) {
    return { ok: false, reason: "key_required" };
  }

  await db
    .insert(schema.userSettings)
    .values({ userId, generationModel })
    .onConflictDoUpdate({
      target: schema.userSettings.userId,
      set: { generationModel },
    });

  return { ok: true, settings: { generationModel, hasOpenRouterKey } };
}

/**
 * Verify and store the user's OpenRouter key (encrypted at rest). The plaintext
 * is checked against OpenRouter before encryption; an invalid key is rejected.
 */
export async function setOpenRouterKey(
  userId: string,
  apiKey: string,
): Promise<SetKeyResult> {
  const valid = await verifyOpenRouterKey(apiKey);
  if (!valid) return { ok: false, reason: "invalid_key" };

  const openrouterApiKeyEncrypted = encryptSecret(apiKey);
  await db
    .insert(schema.userSettings)
    .values({ userId, openrouterApiKeyEncrypted })
    .onConflictDoUpdate({
      target: schema.userSettings.userId,
      set: { openrouterApiKeyEncrypted },
    });

  return { ok: true };
}

/**
 * Clear the user's stored OpenRouter key. If their selected model is non-free,
 * it is reset to the free default so they are never left on a paid model with
 * no key to run it.
 */
export async function removeOpenRouterKey(
  userId: string,
): Promise<SettingsView> {
  const row = await getSettingsRow(userId);
  const stored = row?.generationModel ?? DEFAULT_GENERATION_MODEL;
  const generationModel = isFreeModel(stored)
    ? stored
    : DEFAULT_GENERATION_MODEL;

  if (row) {
    await db
      .update(schema.userSettings)
      .set({ openrouterApiKeyEncrypted: null, generationModel })
      .where(eq(schema.userSettings.userId, userId));
  }

  return { generationModel, hasOpenRouterKey: false };
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
