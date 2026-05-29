import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { config } from "../config";

const openrouter = createOpenRouter({ apiKey: config.OPENROUTER_API_KEY });

/** Default chat model for all worker AI calls, configured via env. */
export const model: LanguageModel = openrouter.chat(config.OPENROUTER_MODEL);
