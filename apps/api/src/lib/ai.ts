import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { config } from "../config";

const openrouter = createOpenRouter({ apiKey: config.OPENROUTER_API_KEY });

/** Build a chat model for a slug on the platform key. */
export function modelFor(slug: string): LanguageModel {
  return openrouter.chat(slug);
}

// OpenRouter providers are stateless; memoize one per user key so repeated
// calls on the same key reuse a single provider instance (mirrors the worker).
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
