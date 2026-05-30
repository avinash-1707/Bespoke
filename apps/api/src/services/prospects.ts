import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import {
  schema,
  type Prospect,
  type ProspectAsset,
  type ProspectContext,
} from "@bespoke/db";
import { JOB_NAME, QUEUE_NAME, enqueueJob } from "@bespoke/queue";
import type {
  CursorPage,
  ListQuery,
  ProspectAssetType,
} from "@bespoke/shared";
import { db } from "../context";
import { queues } from "../queue";
import { clampLimit, decodeCursor, keysetBefore, toPage } from "./_cursor";

export interface ProspectAssetInput {
  assetType: ProspectAssetType;
  url?: string;
  fileKey?: string;
}

export interface CreateProspectInput {
  name: string;
  email?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  notes?: string | null;
  assets?: ProspectAssetInput[];
}

export type UpdateProspectInput = Partial<Omit<CreateProspectInput, "assets">>;

export interface ProspectWithDetails extends Prospect {
  assets: ProspectAsset[];
  context: ProspectContext | null;
}

async function recordAnalytics(
  userId: string,
  entityId: string,
): Promise<void> {
  await db.insert(schema.analyticsEvents).values({
    userId,
    eventType: "prospect_created",
    entityType: "prospect",
    entityId,
  });
}

/**
 * Insert one prospect asset, mirror a Postgres scrape-job row, and enqueue the
 * scrape (URL fetch or screenshot vision). The BullMQ id is written back for
 * status correlation.
 */
async function enqueueProspectAssetScrape(
  userId: string,
  prospectId: string,
  asset: ProspectAssetInput,
): Promise<ProspectAsset> {
  const [created] = await db
    .insert(schema.prospectAssets)
    .values({
      prospectId,
      assetType: asset.assetType,
      url: asset.url,
      fileKey: asset.fileKey,
      status: "pending",
    })
    .returning();

  const [job] = await db
    .insert(schema.scrapeJobs)
    .values({
      userId,
      jobType: JOB_NAME.scrapeProspectAsset,
      status: "pending",
      input: { assetId: created!.id, prospectId },
      queueName: QUEUE_NAME.scrape,
      prospectId,
    })
    .returning();

  const bullmqJobId = await enqueueJob(queues, JOB_NAME.scrapeProspectAsset, {
    assetId: created!.id,
    prospectId,
    userId,
  });

  await db
    .update(schema.scrapeJobs)
    .set({ bullmqJobId })
    .where(eq(schema.scrapeJobs.id, job!.id));

  return created!;
}

/**
 * Cursor-paginated prospect list scoped to the user. Search matches name,
 * company, or email. Ordered by `createdAt DESC, id DESC` for a stable keyset.
 */
export async function listProspects(
  userId: string,
  query: ListQuery = {},
): Promise<CursorPage<Prospect>> {
  const limit = clampLimit(query.limit);
  const search = query.q?.trim();
  const keyset = keysetBefore(
    schema.prospects.createdAt,
    schema.prospects.id,
    decodeCursor(query.cursor),
  );

  const rows = await db
    .select()
    .from(schema.prospects)
    .where(
      and(
        eq(schema.prospects.userId, userId),
        search
          ? or(
              ilike(schema.prospects.name, `%${search}%`),
              ilike(schema.prospects.companyName, `%${search}%`),
              ilike(schema.prospects.email, `%${search}%`),
            )
          : undefined,
        keyset,
      ),
    )
    .orderBy(desc(schema.prospects.createdAt), desc(schema.prospects.id))
    .limit(limit + 1);

  return toPage(rows, limit);
}

export async function getProspect(
  userId: string,
  id: string,
): Promise<ProspectWithDetails | null> {
  const [prospect] = await db
    .select()
    .from(schema.prospects)
    .where(
      and(eq(schema.prospects.id, id), eq(schema.prospects.userId, userId)),
    );
  if (!prospect) return null;

  const assets = await db
    .select()
    .from(schema.prospectAssets)
    .where(eq(schema.prospectAssets.prospectId, id))
    .orderBy(desc(schema.prospectAssets.createdAt));

  const [context] = await db
    .select()
    .from(schema.prospectContext)
    .where(eq(schema.prospectContext.prospectId, id));

  return { ...prospect, assets, context: context ?? null };
}

export async function createProspect(
  userId: string,
  input: CreateProspectInput,
): Promise<ProspectWithDetails> {
  const [prospect] = await db
    .insert(schema.prospects)
    .values({
      userId,
      name: input.name,
      email: input.email,
      jobTitle: input.jobTitle,
      companyName: input.companyName,
      notes: input.notes,
    })
    .returning();

  for (const asset of input.assets ?? []) {
    await enqueueProspectAssetScrape(userId, prospect!.id, asset);
  }

  await recordAnalytics(userId, prospect!.id);

  const created = await getProspect(userId, prospect!.id);
  return created!;
}

export async function updateProspect(
  userId: string,
  id: string,
  input: UpdateProspectInput,
): Promise<ProspectWithDetails | null> {
  const existing = await getProspect(userId, id);
  if (!existing) return null;

  await db
    .update(schema.prospects)
    .set({
      name: input.name ?? existing.name,
      email: input.email ?? existing.email,
      jobTitle: input.jobTitle ?? existing.jobTitle,
      companyName: input.companyName ?? existing.companyName,
      notes: input.notes ?? existing.notes,
    })
    .where(
      and(eq(schema.prospects.id, id), eq(schema.prospects.userId, userId)),
    );

  return getProspect(userId, id);
}

export async function deleteProspect(
  userId: string,
  id: string,
): Promise<boolean> {
  const deleted = await db
    .delete(schema.prospects)
    .where(
      and(eq(schema.prospects.id, id), eq(schema.prospects.userId, userId)),
    )
    .returning({ id: schema.prospects.id });
  return deleted.length > 0;
}

/**
 * Batch-delete prospects the user owns. Foreign ids are ignored by the
 * `user_id` filter; returns the count of rows actually removed.
 */
export async function deleteManyProspects(
  userId: string,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const deleted = await db
    .delete(schema.prospects)
    .where(
      and(
        eq(schema.prospects.userId, userId),
        inArray(schema.prospects.id, ids),
      ),
    )
    .returning({ id: schema.prospects.id });
  return deleted.length;
}

/**
 * Attach one asset to an existing prospect and kick off its scrape. Returns
 * null when the prospect is not owned by the user.
 */
export async function addProspectAsset(
  userId: string,
  prospectId: string,
  asset: ProspectAssetInput,
): Promise<ProspectWithDetails | null> {
  const existing = await getProspect(userId, prospectId);
  if (!existing) return null;

  await enqueueProspectAssetScrape(userId, prospectId, asset);
  return getProspect(userId, prospectId);
}
