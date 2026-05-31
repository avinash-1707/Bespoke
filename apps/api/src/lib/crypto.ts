import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { config } from "../config";

/**
 * Symmetric encryption for secrets stored at rest (the user's OpenRouter key).
 * AES-256-GCM with a per-call random IV; output is `iv:tag:cipher`, each part
 * base64. The 32-byte key comes from `ENCRYPTION_KEY` (64 hex chars). The
 * worker's `decryptSecret` reads the same format and key.
 */
const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(config.ENCRYPTION_KEY, "hex");

/** Encrypt a plaintext secret into the `iv:tag:cipher` (base64) storage format. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

/** Decrypt an `iv:tag:cipher` (base64) payload produced by `encryptSecret`. */
export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, cipherB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !cipherB64) {
    throw new Error("Malformed encrypted secret");
  }
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(cipherB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
