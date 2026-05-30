import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { AssetStatus, ProspectAssetType } from "@bespoke/shared";
import { user } from "./auth";
import { timestamps } from "./_shared";

/** A saved prospect, reusable across offerings without re-entering details. */
export const prospects = pgTable(
  "prospects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    jobTitle: text("job_title"),
    companyName: text("company_name"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [index("prospects_user_id_idx").on(table.userId)],
);

/**
 * One input attached to a prospect (URL or uploaded screenshot). Each asset is
 * scraped/vision-read independently; `status` is surfaced to the user.
 */
export const prospectAssets = pgTable(
  "prospect_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    prospectId: uuid("prospect_id")
      .notNull()
      .references(() => prospects.id, { onDelete: "cascade" }),
    assetType: text("asset_type").$type<ProspectAssetType>().notNull(),
    url: text("url"),
    fileKey: text("file_key"),
    status: text("status").$type<AssetStatus>().notNull().default("pending"),
    ...timestamps,
  },
  (table) => [index("prospect_assets_prospect_id_idx").on(table.prospectId)],
);

/**
 * Per-asset extracted insight. Many insights per prospect are later merged
 * into the single `prospectContext` row.
 */
export const prospectInsights = pgTable(
  "prospect_insights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    prospectId: uuid("prospect_id")
      .notNull()
      .references(() => prospects.id, { onDelete: "cascade" }),
    sourceAssetId: uuid("source_asset_id").references(() => prospectAssets.id, {
      onDelete: "cascade",
    }),
    summary: text("summary"),
    structuredData: jsonb("structured_data").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("prospect_insights_prospect_id_idx").on(table.prospectId)],
);

/**
 * Derived, consolidated context for a prospect — rebuilt by the
 * `consolidate-insights` job, never hand-edited. One row per prospect.
 */
export const prospectContext = pgTable("prospect_context", {
  id: uuid("id").primaryKey().defaultRandom(),
  prospectId: uuid("prospect_id")
    .notNull()
    .unique()
    .references(() => prospects.id, { onDelete: "cascade" }),
  mergedContext: text("merged_context"),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow().notNull(),
});
