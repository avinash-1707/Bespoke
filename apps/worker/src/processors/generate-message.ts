import type { Job } from "bullmq";
import { eq } from "drizzle-orm";
import { generateText } from "ai";
import { schema } from "@bespoke/db";
import type { GenerateMessagePayload } from "@bespoke/queue";
import { db } from "../lib/db";
import { modelFor } from "../lib/ai";
import { config } from "../config";

/** Compose the user-message context block from offering + prospect + knobs. */
function buildPrompt(
  offeringContext: string,
  prospectContext: string,
  tone?: string,
  angle?: string,
): string {
  const knobs = [
    tone ? `Tone: ${tone}.` : null,
    angle ? `Angle: ${angle}.` : null,
  ].filter(Boolean);

  return [
    "# Your offering",
    offeringContext,
    "",
    "# The prospect",
    prospectContext,
    "",
    knobs.length ? `# Constraints\n${knobs.join("\n")}` : "",
    "",
    "Write a single personalized outreach message to this prospect about the",
    "offering above. Output only the message body — no preamble, no subject line.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Generate one outreach message: combine the offering's compiled context, the
 * prompt's system prompt, and the prospect's consolidated context, call the
 * model recorded on the generation, and persist the message plus token/latency
 * metadata. The Postgres generation-job and ai_generation rows track status.
 */
export async function generateMessage(
  job: Job<GenerateMessagePayload>,
): Promise<void> {
  const { generationId, userId } = job.data;
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

    if (!offering || !prompt || !context?.mergedContext) {
      throw new Error("Missing offering, prompt, or prospect context");
    }

    const userPrompt = buildPrompt(
      offering.compiledContext ?? "",
      context.mergedContext,
      job.data.tone,
      job.data.angle,
    );

    const startedAt = Date.now();
    const { text, usage } = await generateText({
      model: modelFor(generation.model || config.OPENROUTER_MODEL),
      system: prompt.systemPrompt,
      prompt: userPrompt,
    });
    const latencyMs = Date.now() - startedAt;

    await db.insert(schema.generatedMessages).values({
      generationId,
      content: text.trim(),
      tone: job.data.tone,
      angle: job.data.angle,
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
      eventType: "message_generated",
      entityType: "message",
      entityId: generationId,
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
