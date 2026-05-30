import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { config } from "../config";

const openrouter = createOpenRouter({ apiKey: config.OPENROUTER_API_KEY });

/** Default chat model for scrape/extraction calls, configured via env. */
export const model: LanguageModel = openrouter.chat(config.OPENROUTER_MODEL);

/** Build a chat model for an arbitrary slug — used for per-user generation. */
export function modelFor(slug: string): LanguageModel {
  return openrouter.chat(slug);
}
