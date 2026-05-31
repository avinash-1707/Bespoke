import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { config } from "../config";

const openrouter = createOpenRouter({ apiKey: config.OPENROUTER_API_KEY });

/** Default chat model for scrape/extraction calls, configured via env. */
export const model: LanguageModel = openrouter.chat(config.OPENROUTER_MODEL);

/** Build a chat model for an arbitrary slug on the platform key. */
export function modelFor(slug: string): LanguageModel {
  return openrouter.chat(slug);
}

// OpenRouter providers are cheap but stateless; memoize one per user key so
// repeated generations on the same key reuse a single provider instance.
const userProviders = new Map<string, ReturnType<typeof createOpenRouter>>();

/** Build a chat model for a slug on the user's own OpenRouter key. */
export function modelForUser(slug: string, apiKey: string): LanguageModel {
  let provider = userProviders.get(apiKey);
  if (!provider) {
    provider = createOpenRouter({ apiKey });
    userProviders.set(apiKey, provider);
  }
  return provider.chat(slug);
}
