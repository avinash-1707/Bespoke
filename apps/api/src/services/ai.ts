import { generateText } from "ai";
import { explainModel } from "../lib/ai";

/** Subjects the inline explainer can speak to. */
export type ExplainTopic = "offering" | "prompt";

/** Grounding so the model explains the concept as it works in this product. */
const TOPIC_BRIEF: Record<ExplainTopic, string> = {
  offering:
    "An offering is the core value the user brings to a prospect. It is what makes their outreach relevant to that specific person: what they do, who they sell to, the problem they solve, what makes them different, and key proof points. The better the offering is defined, the better every generated message will be.",
  prompt:
    "A prompt is the set of instructions the user gives the AI before it writes a message. It controls how the AI thinks about the prospect and what kind of message it writes: tone, length, angle, what to emphasize, what to avoid, how to open, and how to close. It is like briefing a copywriter before they start writing.",
};

/**
 * Generates a short, plain-language explanation for an offering or prompt. When
 * a `draft` is supplied the model reviews it and gives specific, actionable
 * feedback; otherwise it explains the concept and how to write a good one. Runs
 * on the free platform model — the web side keeps a static fallback so the
 * helper degrades gracefully if this call fails.
 */
export async function explain(
  topic: ExplainTopic,
  draft: string | undefined,
): Promise<string> {
  const brief = TOPIC_BRIEF[topic];
  const trimmed = draft?.trim();

  const system = [
    "You are a concise product coach inside an AI outreach tool.",
    `Here is the concept you are helping with: ${brief}`,
    "Write in plain language, warm and direct. No preamble, no headings, no markdown bullets unless you list concrete suggestions. Never use em dashes. Keep it under 90 words.",
  ].join(" ");

  const user = trimmed
    ? `Here is the user's current ${topic} draft:\n\n"""\n${trimmed}\n"""\n\nReview it. In two or three short sentences, say what is strong and what concrete detail to add to make generated messages better. Be specific to this draft.`
    : `Explain what a good ${topic} is and one practical tip for writing one, so a first-time user knows what to put here.`;

  const { text } = await generateText({
    model: explainModel,
    system,
    prompt: user,
    temperature: 0.5,
  });

  return text.trim();
}
