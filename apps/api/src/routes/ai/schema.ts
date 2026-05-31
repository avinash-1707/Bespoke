import { z } from "zod";

/** `POST /api/ai/explain` — concept help for an offering or prompt. */
export const explainBody = z.object({
  topic: z.enum(["offering", "prompt"]),
  // Optional current draft; when present the explanation is draft-aware.
  draft: z.string().max(8000).optional(),
});
