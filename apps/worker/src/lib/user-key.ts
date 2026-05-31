import { eq } from "drizzle-orm";
import { schema } from "@bespoke/db";
import { db } from "./db";
import { decryptSecret } from "./crypto";

/**
 * The user's own OpenRouter key (decrypted), or null when they have not stored
 * one. When present, the generation processors run that user's calls on this
 * key instead of the platform key.
 */
export async function getUserOpenRouterKey(
  userId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ encrypted: schema.userSettings.openrouterApiKeyEncrypted })
    .from(schema.userSettings)
    .where(eq(schema.userSettings.userId, userId));
  return row?.encrypted ? decryptSecret(row.encrypted) : null;
}
