import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { AnalyticsEventType } from "@bespoke/shared";
import { user } from "./auth";

/**
 * Append-only event log written at each meaningful user action. The analytics
 * dashboard aggregates over these rows.
 */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    eventType: text("event_type").$type<AnalyticsEventType>().notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("analytics_events_user_id_idx").on(table.userId),
    index("analytics_events_event_type_idx").on(table.eventType),
  ],
);
