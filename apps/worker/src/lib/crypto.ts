import { createDecipheriv } from "node:crypto";
import { config } from "../config";

/**
 * Decrypt secrets stored by the api's `encryptSecret` (the user's OpenRouter
 * key). AES-256-GCM; input is `iv:tag:cipher`, each part base64. The 32-byte key
 * comes from `ENCRYPTION_KEY` (64 hex chars) and MUST match the api's.
 */
const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(config.ENCRYPTION_KEY, "hex");

/** Decrypt an `iv:tag:cipher` (base64) payload back to its plaintext secret. */
export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, cipherB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !cipherB64) {
    throw new Error("Malformed encrypted secret");
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(cipherB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
