import { z } from "zod";
import { SUPPORTED_MODEL_IDS } from "@bespoke/shared";

/** Strict allow-list — only curated, real OpenRouter slugs are accepted. */
export const updateSettingsBody = z.object({
  generationModel: z.enum(SUPPORTED_MODEL_IDS),
});
