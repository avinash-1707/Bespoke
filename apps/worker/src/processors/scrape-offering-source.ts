import type { Job } from "bullmq";
import { eq } from "drizzle-orm";
import { generateObject } from "ai";
import type { LanguageModel } from "ai";
import { z } from "zod";
import { schema } from "@bespoke/db";
import { compileOfferingContext } from "@bespoke/shared";
import type { ScrapeOfferingSourcePayload } from "@bespoke/queue";
import { config } from "../config";
import { db } from "../lib/db";
import { fetchSourceMarkdown } from "../lib/firecrawl";
import { modelFor } from "../lib/ai";
import { logger } from "../lib/logger";

/** Fields the LLM extracts from scraped page content. Null when not stated. */
const extractionSchema = z.object({
  description: z.string().nullable(),
  targetAudience: z.string().nullable(),
  problemSolved: z.string().nullable(),
  uniqueValueProp: z.string().nullable(),
  proofPoints: z.string().nullable(),
});

type Extraction = z.infer<typeof extractionSchema>;

async function extractOffering(
  markdown: string,
  model: LanguageModel,
): Promise<Extraction> {
  const { object } = await generateObject({
    model,
    schema: extractionSchema,
    prompt: [
      "Extract a B2B sales offering from the website content below.",
      "Be concise and factual. Use null for anything not clearly stated.",
      "Do not invent claims.",
      "",
      markdown.slice(0, 12_000),
    ].join("\n"),
  });
  return object;
}

/**
 * Scrape one offering source URL, extract structured offering fields with the
 * LLM, store raw + processed content, and fill any empty offering fields
 * (never overwriting what the user already wrote), then rebuild the offering's
 * compiled context. The Postgres scrape-job row is updated at every step.
 */
export async function scrapeOfferingSource(
  job: Job<ScrapeOfferingSourcePayload>,
): Promise<void> {
  const { sourceId, offeringId, userId } = job.data;
  const jobFilter = eq(schema.scrapeJobs.bullmqJobId, job.id ?? "");
  const log = logger.child({
    job: job.name,
    jobId: job.id,
    sourceId,
    offeringId,
  });

  await db
    .update(schema.scrapeJobs)
    .set({ status: "processing" })
    .where(jobFilter);

  try {
    const [source] = await db
      .select()
      .from(schema.offeringSources)
      .where(eq(schema.offeringSources.id, sourceId));
    if (!source?.sourceUrl) {
      throw new Error(`Offering source ${sourceId} has no URL`);
    }

    // Use the user's chosen model; fall back to server default when unset.
    const [settings] = await db
      .select()
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, userId));
    const modelSlug = settings?.generationModel || config.OPENROUTER_MODEL;
    const model = modelFor(modelSlug);

    log.info("scraping url", { url: source.sourceUrl });
    const markdown = await fetchSourceMarkdown(source.sourceUrl);
    log.info("scrape ok, extracting", { chars: markdown.length, model: modelSlug });
    const extracted = await extractOffering(markdown, model);
    log.info("extraction ok");

    const processedContent = compileOfferingContext({ name: "", ...extracted });
    await db
      .update(schema.offeringSources)
      .set({ rawContent: markdown, processedContent })
      .where(eq(schema.offeringSources.id, sourceId));

    const [offering] = await db
      .select()
      .from(schema.offerings)
      .where(eq(schema.offerings.id, offeringId));

    if (offering) {
      // Fill only empty fields — user edits always win.
      const merged = {
        name: offering.name,
        description: offering.description ?? extracted.description,
        targetAudience: offering.targetAudience ?? extracted.targetAudience,
        problemSolved: offering.problemSolved ?? extracted.problemSolved,
        uniqueValueProp: offering.uniqueValueProp ?? extracted.uniqueValueProp,
        proofPoints: offering.proofPoints ?? extracted.proofPoints,
      };
      await db
        .update(schema.offerings)
        .set({
          description: merged.description,
          targetAudience: merged.targetAudience,
          problemSolved: merged.problemSolved,
          uniqueValueProp: merged.uniqueValueProp,
          proofPoints: merged.proofPoints,
          compiledContext: compileOfferingContext(merged),
          status: "ready",
        })
        .where(eq(schema.offerings.id, offeringId));
    }

    await db
      .update(schema.scrapeJobs)
      .set({ status: "completed", result: { extracted } })
      .where(jobFilter);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("scrape-offering-source failed", { error: message });
    await db
      .update(schema.scrapeJobs)
      .set({ status: "failed", error: message })
      .where(jobFilter);
    // Don't strand the offering in `scraping` — fall back to ready when it
    // already has user-entered context, otherwise draft.
    const [stalled] = await db
      .select()
      .from(schema.offerings)
      .where(eq(schema.offerings.id, offeringId));
    if (stalled?.status === "scraping") {
      await db
        .update(schema.offerings)
        .set({ status: stalled.compiledContext ? "ready" : "draft" })
        .where(eq(schema.offerings.id, offeringId));
    }
    throw error;
  }
}
