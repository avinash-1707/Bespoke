import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { schema, type Offering, type OfferingSource } from "@bespoke/db";
import { JOB_NAME, QUEUE_NAME, enqueueJob } from "@bespoke/queue";
import {
  compileOfferingContext,
  type CursorPage,
  type ListQuery,
  type OfferingContextFields,
} from "@bespoke/shared";
import { db } from "../context";
import { queues } from "../queue";
import { clampLimit, decodeCursor, keysetBefore, toPage } from "./_cursor";

export interface CreateOfferingInput extends OfferingContextFields {
  /** Optional URL to scrape and merge into the offering in the background. */
  sourceUrl?: string;
}

export type UpdateOfferingInput = Partial<OfferingContextFields>;

export interface OfferingWithSources extends Offering {
  sources: OfferingSource[];
}

async function recordAnalytics(
  userId: string,
  entityId: string,
): Promise<void> {
  await db.insert(schema.analyticsEvents).values({
    userId,
    eventType: "offering_created",
    entityType: "offering",
    entityId,
  });
}

/**
 * Create an offering source row, mirror a Postgres scrape-job row, and enqueue
 * the scrape. The BullMQ job id is written back so the api can correlate state.
 */
async function enqueueOfferingScrape(
  userId: string,
  offeringId: string,
  sourceUrl: string,
): Promise<void> {
  const [source] = await db
    .insert(schema.offeringSources)
    .values({ offeringId, sourceType: "url", sourceUrl })
    .returning();

  const [job] = await db
    .insert(schema.scrapeJobs)
    .values({
      userId,
      jobType: JOB_NAME.scrapeOfferingSource,
      status: "pending",
      input: { sourceId: source!.id, offeringId },
      queueName: QUEUE_NAME.scrape,
      offeringId,
    })
    .returning();

  const bullmqJobId = await enqueueJob(queues, JOB_NAME.scrapeOfferingSource, {
    sourceId: source!.id,
    offeringId,
    userId,
  });

  await db
    .update(schema.scrapeJobs)
    .set({ bullmqJobId })
    .where(eq(schema.scrapeJobs.id, job!.id));
}

/**
 * Cursor-paginated, name-searchable offering list scoped to the user. Orders by
 * `createdAt DESC, id DESC` so the keyset cursor is stable across pages.
 */
export async function listOfferings(
  userId: string,
  query: ListQuery = {},
): Promise<CursorPage<Offering>> {
  const limit = clampLimit(query.limit);
  const search = query.q?.trim();
  const keyset = keysetBefore(
    schema.offerings.createdAt,
    schema.offerings.id,
    decodeCursor(query.cursor),
  );

  const rows = await db
    .select()
    .from(schema.offerings)
    .where(
      and(
        eq(schema.offerings.userId, userId),
        search ? ilike(schema.offerings.name, `%${search}%`) : undefined,
        keyset,
      ),
    )
    .orderBy(desc(schema.offerings.createdAt), desc(schema.offerings.id))
    .limit(limit + 1);

  return toPage(rows, limit);
}

export async function getOffering(
  userId: string,
  id: string,
): Promise<OfferingWithSources | null> {
  const [offering] = await db
    .select()
    .from(schema.offerings)
    .where(
      and(eq(schema.offerings.id, id), eq(schema.offerings.userId, userId)),
    );

  if (!offering) return null;

  const sources = await db
    .select()
    .from(schema.offeringSources)
    .where(eq(schema.offeringSources.offeringId, id))
    .orderBy(desc(schema.offeringSources.createdAt));

  return { ...offering, sources };
}

export async function createOffering(
  userId: string,
  input: CreateOfferingInput,
): Promise<OfferingWithSources> {
  const compiledContext = compileOfferingContext(input);

  const [offering] = await db
    .insert(schema.offerings)
    .values({
      userId,
      name: input.name,
      description: input.description,
      targetAudience: input.targetAudience,
      problemSolved: input.problemSolved,
      uniqueValueProp: input.uniqueValueProp,
      proofPoints: input.proofPoints,
      compiledContext,
      // A pending scrape keeps the offering in `scraping` until the worker
      // fills the fields and flips it to `ready` (or back to draft on failure).
      status: input.sourceUrl ? "scraping" : compiledContext ? "ready" : "draft",
    })
    .returning();

  if (input.sourceUrl) {
    await enqueueOfferingScrape(userId, offering!.id, input.sourceUrl);
  }

  await recordAnalytics(userId, offering!.id);

  const created = await getOffering(userId, offering!.id);
  // Just inserted under this user — guaranteed present.
  return created!;
}

export async function updateOffering(
  userId: string,
  id: string,
  input: UpdateOfferingInput,
): Promise<OfferingWithSources | null> {
  const existing = await getOffering(userId, id);
  if (!existing) return null;

  const merged: OfferingContextFields = {
    name: input.name ?? existing.name,
    description: input.description ?? existing.description,
    targetAudience: input.targetAudience ?? existing.targetAudience,
    problemSolved: input.problemSolved ?? existing.problemSolved,
    uniqueValueProp: input.uniqueValueProp ?? existing.uniqueValueProp,
    proofPoints: input.proofPoints ?? existing.proofPoints,
  };
  const compiledContext = compileOfferingContext(merged);

  await db
    .update(schema.offerings)
    .set({
      ...merged,
      compiledContext,
      status: compiledContext ? "ready" : "draft",
    })
    .where(
      and(eq(schema.offerings.id, id), eq(schema.offerings.userId, userId)),
    );

  return getOffering(userId, id);
}

export async function deleteOffering(
  userId: string,
  id: string,
): Promise<boolean> {
  const deleted = await db
    .delete(schema.offerings)
    .where(
      and(eq(schema.offerings.id, id), eq(schema.offerings.userId, userId)),
    )
    .returning({ id: schema.offerings.id });

  return deleted.length > 0;
}

/**
 * Batch-delete offerings the user owns. Foreign ids are silently ignored by the
 * `user_id` filter; returns the count of rows actually removed.
 */
export async function deleteManyOfferings(
  userId: string,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const deleted = await db
    .delete(schema.offerings)
    .where(
      and(
        eq(schema.offerings.userId, userId),
        inArray(schema.offerings.id, ids),
      ),
    )
    .returning({ id: schema.offerings.id });
  return deleted.length;
}

/**
 * Attach a new source URL to an existing offering and kick off its scrape.
 * Returns null when the offering is not owned by the user.
 */
export async function addOfferingSource(
  userId: string,
  offeringId: string,
  sourceUrl: string,
): Promise<OfferingWithSources | null> {
  const existing = await getOffering(userId, offeringId);
  if (!existing) return null;

  await enqueueOfferingScrape(userId, offeringId, sourceUrl);
  // Reflect the in-flight scrape so the UI pulses until the worker finishes.
  await db
    .update(schema.offerings)
    .set({ status: "scraping" })
    .where(
      and(
        eq(schema.offerings.id, offeringId),
        eq(schema.offerings.userId, userId),
      ),
    );
  return getOffering(userId, offeringId);
}
