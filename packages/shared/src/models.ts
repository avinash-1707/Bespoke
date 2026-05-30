/**
 * Curated set of OpenRouter model slugs offered for message generation. Slugs
 * are validated against this list at the api boundary (strict allow-list), so
 * every entry MUST be a real, current OpenRouter id. Adding a model is a code
 * change here. Verified against the OpenRouter model catalogue.
 */
export const SUPPORTED_MODELS = [
  { id: "anthropic/claude-opus-4.8", label: "Claude Opus 4.8 (most capable)" },
  { id: "anthropic/claude-opus-4.8-fast", label: "Claude Opus 4.8 (fast)" },
  { id: "anthropic/claude-sonnet-latest", label: "Claude Sonnet (balanced)" },
  { id: "anthropic/claude-haiku-latest", label: "Claude Haiku (fast, cheap)" },
  { id: "openai/gpt-5.5", label: "GPT-5.5" },
  { id: "openai/gpt-5.4", label: "GPT-5.4" },
  { id: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { id: "google/gemini-pro-latest", label: "Gemini Pro" },
] as const;

/** Union of allowed generation model slugs. */
export type GenerationModel = (typeof SUPPORTED_MODELS)[number]["id"];

/** All allowed slugs as a plain string array (for Zod enums, lookups). */
export const SUPPORTED_MODEL_IDS = SUPPORTED_MODELS.map((m) => m.id) as [
  GenerationModel,
  ...GenerationModel[],
];

/** Default model when a user has not chosen one. */
export const DEFAULT_GENERATION_MODEL: GenerationModel =
  "google/gemini-3.5-flash";

/** Type guard — narrows an arbitrary string to a supported model slug. */
export function isSupportedModel(value: string): value is GenerationModel {
  return (SUPPORTED_MODEL_IDS as readonly string[]).includes(value);
}
