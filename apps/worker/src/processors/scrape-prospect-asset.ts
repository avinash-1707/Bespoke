import type { Job } from "bullmq";
import { and, eq, notInArray } from "drizzle-orm";
import { generateObject } from "ai";
import { z } from "zod";
import { schema, type ProspectAsset } from "@bespoke/db";
import {
  JOB_NAME,
  enqueueJob,
  type ScrapeProspectAssetPayload,
} from "@bespoke/queue";
import { db } from "../lib/db";
import { scrapeMarkdown } from "../lib/firecrawl";
import { deliveryUrl } from "../lib/cloudinary";
import { model } from "../lib/ai";
import { queues } from "../lib/queue";
import { logger } from "../lib/logger";

/** Fields the LLM extracts from one prospect asset. */
const insightSchema = z.object({
  summary: z.string().describe("2-4 sentence summary of who this person is"),
  structuredData: z
    .object({
      role: z.string().nullable(),
      company: z.string().nullable(),
      interests: z.array(z.string()).nullable(),
      recentActivity: z.string().nullable(),
      talkingPoints: z.array(z.string()).nullable(),
    })
    .describe("Structured facts; use null/empty when not stated"),
});

type Insight = z.infer<typeof insightSchema>;

const PROMPT_INTRO = [
  "Extract a sales-relevant profile of this prospect from the source below.",
  "Be concise and factual. Use null for anything not clearly stated.",
  "Do not invent facts. Focus on details useful for personalized outreach.",
].join("\n");

/** Extract an insight from scraped markdown (URL assets). */
async function extractFromText(markdown: string): Promise<Insight> {
  const { object } = await generateObject({
    model,
    schema: insightSchema,
    prompt: [PROMPT_INTRO, "", markdown.slice(0, 12_000)].join("\n"),
  });
  return object;
}

/** Extract an insight from a screenshot via the model's vision input. */
async function extractFromImage(imageUrl: string): Promise<Insight> {
  const { object } = await generateObject({
    model,
    schema: insightSchema,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: PROMPT_INTRO },
          { type: "image", image: new URL(imageUrl) },
        ],
      },
    ],
  });
  return object;
}

/** URL-backed asset types scraped with Firecrawl. */
const URL_ASSET_TYPES = new Set([
  "github",
  "personal_site",
  "company_site",
  "other_url",
]);

/**
 * If every asset for the prospect has finished (done or failed), enqueue the
 * `consolidate-insights` job to rebuild `prospect_context`. Mirrors the
 * architecture's per-asset completion check.
 */
async function maybeConsolidate(
  prospectId: string,
  userId: string,
): Promise<void> {
  const outstanding = await db
    .select({ id: schema.prospectAssets.id })
    .from(schema.prospectAssets)
    .where(
      and(
        eq(schema.prospectAssets.prospectId, prospectId),
        notInArray(schema.prospectAssets.status, ["done", "failed"]),
      ),
    );
  if (outstanding.length > 0) return;

  await enqueueJob(queues, JOB_NAME.consolidateInsights, {
    prospectId,
    userId,
  });
}

/**
 * Scrape or vision-read one prospect asset, write a `prospect_insights` row,
 * and mark the asset done. URL assets go through Firecrawl; LinkedIn
 * screenshots go through the model's vision input (delivery URL rebuilt from
 * the Cloudinary `public_id`); free-text `notes` carry no scrape. When the
 * prospect's last asset finishes, `consolidate-insights` is enqueued. The
 * Postgres scrape-job row is updated at every step.
 */
export async function scrapeProspectAsset(
  job: Job<ScrapeProspectAssetPayload>,
): Promise<void> {
  const { assetId, prospectId, userId } = job.data;
  const jobFilter = eq(schema.scrapeJobs.bullmqJobId, job.id ?? "");
  const log = logger.child({
    job: job.name,
    jobId: job.id,
    assetId,
    prospectId,
  });

  await db
    .update(schema.scrapeJobs)
    .set({ status: "processing" })
    .where(jobFilter);
  await db
    .update(schema.prospectAssets)
    .set({ status: "processing" })
    .where(eq(schema.prospectAssets.id, assetId));

  try {
    const [asset] = await db
      .select()
      .from(schema.prospectAssets)
      .where(eq(schema.prospectAssets.id, assetId));
    if (!asset) {
      throw new Error(`Prospect asset ${assetId} not found`);
    }

    log.info("extracting asset", { assetType: asset.assetType });
    const insight = await extractAsset(asset);
    log.info("asset extracted", { hasInsight: insight !== null });

    // `notes` assets contribute no insight (free text lives on prospect.notes).
    if (insight) {
      await db.insert(schema.prospectInsights).values({
        prospectId,
        sourceAssetId: assetId,
        summary: insight.summary,
        structuredData: insight.structuredData,
      });
    }

    await db
      .update(schema.prospectAssets)
      .set({ status: "done" })
      .where(eq(schema.prospectAssets.id, assetId));
    await db
      .update(schema.scrapeJobs)
      .set({ status: "completed", result: insight ? { insight } : {} })
      .where(jobFilter);

    await maybeConsolidate(prospectId, userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("scrape-prospect-asset failed", { error: message });
    await db
      .update(schema.prospectAssets)
      .set({ status: "failed" })
      .where(eq(schema.prospectAssets.id, assetId));
    await db
      .update(schema.scrapeJobs)
      .set({ status: "failed", error: message })
      .where(jobFilter);
    // Still consolidate so one failed asset never strands the prospect.
    await maybeConsolidate(prospectId, userId);
    throw error;
  }
}

/** Run the right extraction path for the asset type. */
async function extractAsset(asset: ProspectAsset): Promise<Insight | null> {
  if (asset.assetType === "linkedin_screenshot") {
    if (!asset.fileKey) {
      throw new Error(`Screenshot asset ${asset.id} has no file key`);
    }
    return extractFromImage(deliveryUrl(asset.fileKey));
  }

  if (URL_ASSET_TYPES.has(asset.assetType)) {
    if (!asset.url) {
      throw new Error(`URL asset ${asset.id} has no url`);
    }
    const markdown = await scrapeMarkdown(asset.url);
    return extractFromText(markdown);
  }

  // notes — nothing to scrape.
  return null;
}
