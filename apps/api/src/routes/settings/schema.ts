import { z } from "zod";
import { SUPPORTED_MODEL_IDS } from "@bespoke/shared";

/** Strict allow-list — only curated, real OpenRouter slugs are accepted. */
export const updateSettingsBody = z.object({
  generationModel: z.enum(SUPPORTED_MODEL_IDS),
});

/** The user's own OpenRouter key. Verified live before it is stored. */
export const openRouterKeyBody = z.object({
  apiKey: z.string().min(1),
});
