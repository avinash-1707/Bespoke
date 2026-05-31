/**
 * Curated set of OpenRouter model slugs offered for message generation. Slugs
 * are validated against this list at the api boundary (strict allow-list), so
 * every entry MUST be a real, current OpenRouter id. Adding a model is a code
 * change here. Verified against the OpenRouter model catalogue.
 *
 * `free` marks models the platform covers with its own OpenRouter key (Gemini).
 * Non-free models run on the user's own OpenRouter key — selecting one requires
 * a stored, verified key (enforced at the api boundary and in the UI).
 */
export const SUPPORTED_MODELS = [
  {
    id: "anthropic/claude-opus-4.8",
    label: "Claude Opus 4.8 (most capable)",
    free: false,
  },
  {
    id: "anthropic/claude-opus-4.8-fast",
    label: "Claude Opus 4.8 (fast)",
    free: false,
  },
  {
    id: "anthropic/claude-sonnet-latest",
    label: "Claude Sonnet (balanced)",
    free: false,
  },
  {
    id: "anthropic/claude-haiku-latest",
    label: "Claude Haiku (fast, cheap)",
    free: false,
  },
  { id: "openai/gpt-5.5", label: "GPT-5.5", free: false },
  { id: "openai/gpt-5.4", label: "GPT-5.4", free: false },
  { id: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash", free: true },
  { id: "google/gemini-pro-latest", label: "Gemini Pro", free: true },
  { id: "moonshotai/kimi-k2.6:free", label: "Kimi K2.6", free: true },
  { id: "z-ai/glm-4.5-air:free", label: "GLM 4.5 Air", free: true },
  { id: "openai/gpt-oss-120b:free", label: "gpt-oss 120B", free: true },
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

/** Slugs the platform covers (no user OpenRouter key required). */
const FREE_MODEL_IDS: ReadonlySet<string> = new Set(
  SUPPORTED_MODELS.filter((m) => m.free).map((m) => m.id),
);

/**
 * True when a model runs on the platform key (free). Unknown slugs are treated
 * as non-free so a stray value never bypasses the user-key requirement.
 */
export function isFreeModel(slug: string): boolean {
  return FREE_MODEL_IDS.has(slug);
}
