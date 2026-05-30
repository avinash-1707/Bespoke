import type { Job } from "bullmq";
import { asc, eq } from "drizzle-orm";
import { generateText } from "ai";
import { schema } from "@bespoke/db";
import type { GenerateReplyPayload } from "@bespoke/queue";
import { db } from "../lib/db";
import { modelFor } from "../lib/ai";
import { config } from "../config";

/** Render the thread as a labelled transcript for the model. */
function renderTranscript(
  messages: { role: string; content: string }[],
): string {
  const label: Record<string, string> = {
    assistant: "You",
    prospect: "Prospect",
    user: "You",
  };
  return messages
    .map((m) => `${label[m.role] ?? m.role}: ${m.content}`)
    .join("\n\n");
}

/**
 * Generate the next reply in a conversation: rebuild the offering and prospect
 * context, replay the full thread (the prospect's latest reply is already the
 * last turn), and produce a contextual follow-up. The reply is appended as an
 * assistant turn; generation status rows track progress.
 */
export async function generateReply(
  job: Job<GenerateReplyPayload>,
): Promise<void> {
  const { generationId, conversationId, userId } = job.data;
  const jobFilter = eq(schema.generationJobs.bullmqJobId, job.id ?? "");

  await db
    .update(schema.generationJobs)
    .set({ status: "processing" })
    .where(jobFilter);
  await db
    .update(schema.aiGenerations)
    .set({ status: "processing" })
    .where(eq(schema.aiGenerations.id, generationId));

  try {
    const [generation] = await db
      .select()
      .from(schema.aiGenerations)
      .where(eq(schema.aiGenerations.id, generationId));
    if (!generation) throw new Error(`Generation ${generationId} not found`);

    const [offering] = generation.offeringId
      ? await db
          .select()
          .from(schema.offerings)
          .where(eq(schema.offerings.id, generation.offeringId))
      : [];
    const [prompt] = generation.promptId
      ? await db
          .select()
          .from(schema.prompts)
          .where(eq(schema.prompts.id, generation.promptId))
      : [];
    const [context] = generation.prospectId
      ? await db
          .select()
          .from(schema.prospectContext)
          .where(eq(schema.prospectContext.prospectId, generation.prospectId))
      : [];

    const thread = await db
      .select()
      .from(schema.conversationMessages)
      .where(eq(schema.conversationMessages.conversationId, conversationId))
      .orderBy(asc(schema.conversationMessages.createdAt));

    const userPrompt = [
      offering?.compiledContext ? `# Your offering\n${offering.compiledContext}` : "",
      context?.mergedContext ? `# The prospect\n${context.mergedContext}` : "",
      "# Conversation so far",
      renderTranscript(thread),
      "",
      "Write your next reply to the prospect's most recent message. Continue the",
      "conversation naturally. Output only the reply body — no preamble.",
    ]
      .filter(Boolean)
      .join("\n");

    const startedAt = Date.now();
    const { text, usage } = await generateText({
      model: modelFor(generation.model || config.OPENROUTER_MODEL),
      system: prompt?.systemPrompt ?? "You are a helpful sales assistant.",
      prompt: userPrompt,
    });
    const latencyMs = Date.now() - startedAt;

    await db.insert(schema.conversationMessages).values({
      conversationId,
      role: "assistant",
      content: text.trim(),
      metadata: { generationId },
    });

    await db
      .update(schema.aiGenerations)
      .set({
        status: "completed",
        tokensInput: usage?.inputTokens ?? null,
        tokensOutput: usage?.outputTokens ?? null,
        latencyMs,
      })
      .where(eq(schema.aiGenerations.id, generationId));

    await db
      .update(schema.generationJobs)
      .set({ status: "completed" })
      .where(jobFilter);

    await db.insert(schema.analyticsEvents).values({
      userId,
      eventType: "reply_generated",
      entityType: "conversation",
      entityId: conversationId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db
      .update(schema.aiGenerations)
      .set({ status: "failed" })
      .where(eq(schema.aiGenerations.id, generationId));
    await db
      .update(schema.generationJobs)
      .set({ status: "failed", error: message })
      .where(jobFilter);
    throw error;
  }
}
