import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { DEFAULT_GENERATION_MODEL } from "@bespoke/shared";
import { config } from "../config";

const openrouter = createOpenRouter({ apiKey: config.OPENROUTER_API_KEY });

/**
 * Model for the inline "explain" helpers. Pinned to the platform default (a
 * free Gemini slug) so these interactive, low-stakes calls always run on the
 * platform key and never depend on a user supplying their own.
 */
export const explainModel: LanguageModel = openrouter.chat(
  DEFAULT_GENERATION_MODEL,
);
