"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../api-client";

/** Subjects the inline explainer can speak to. */
export type ExplainTopic = "offering" | "prompt";

/**
 * Inline AI "explain" helper. Returns a plain-language explanation for the
 * offering / prompt setup surfaces; when a `draft` is passed the explanation is
 * draft-aware (specific feedback on what to improve). The UI keeps a static
 * fallback, so callers should treat failures as non-fatal.
 */
export function useExplain() {
  return useMutation({
    mutationFn: (input: { topic: ExplainTopic; draft?: string }) =>
      apiClient.post<{ text: string }>("/api/ai/explain", input),
  });
}
