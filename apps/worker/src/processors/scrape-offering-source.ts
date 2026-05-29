import type { Job } from "bullmq";
import { eq } from "drizzle-orm";
import { generateObject } from "ai";
import { z } from "zod";
import { schema } from "@bespoke/db";
import { compileOfferingContext } from "@bespoke/shared";
import type { ScrapeOfferingSourcePayload } from "@bespoke/queue";
import { db } from "../lib/db";
import { scrapeMarkdown } from "../lib/firecrawl";
import { model } from "../lib/ai";

/** Fields the LLM extracts from scraped page content. Null when not stated. */
const extractionSchema = z.object({
  description: z.string().nullable(),
  targetAudience: z.string().nullable(),
  problemSolved: z.string().nullable(),
  uniqueValueProp: z.string().nullable(),
  proofPoints: z.string().nullable(),
});

type Extraction = z.infer<typeof extractionSchema>;

async function extractOffering(markdown: string): Promise<Extraction> {
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
  const { sourceId, offeringId } = job.data;
  const jobFilter = eq(schema.scrapeJobs.bullmqJobId, job.id ?? "");

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

    const markdown = await scrapeMarkdown(source.sourceUrl);
    const extracted = await extractOffering(markdown);

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
    await db
      .update(schema.scrapeJobs)
      .set({ status: "failed", error: message })
      .where(jobFilter);
    throw error;
  }
}
