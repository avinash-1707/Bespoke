import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { GenerationType, JobStatus } from "@bespoke/shared";
import { user } from "./auth";
import { offerings } from "./offerings";
import { prompts } from "./prompts";
import { prospects } from "./prospects";
import { conversations } from "./conversations";

/**
 * One AI generation event — the record of model, token usage, latency, and the
 * inputs (offering/prompt/prospect) used. A generation produces one
 * `generatedMessage`.
 */
export const aiGenerations = pgTable(
  "ai_generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    generationType: text("generation_type").$type<GenerationType>().notNull(),
    model: text("model").notNull(),
    tokensInput: integer("tokens_input"),
    tokensOutput: integer("tokens_output"),
    latencyMs: integer("latency_ms"),
    status: text("status").$type<JobStatus>().notNull().default("pending"),
    offeringId: uuid("offering_id").references(() => offerings.id, {
      onDelete: "set null",
    }),
    promptId: uuid("prompt_id").references(() => prompts.id, {
      onDelete: "set null",
    }),
    prospectId: uuid("prospect_id").references(() => prospects.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ai_generations_user_id_idx").on(table.userId),
    index("ai_generations_prospect_id_idx").on(table.prospectId),
  ],
);

/**
 * The message text produced by a generation. Carries user-facing state:
 * favourite flag, copy count, and the tone/angle it was generated with.
 */
export const generatedMessages = pgTable(
  "generated_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => aiGenerations.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(
      () => conversations.id,
      { onDelete: "set null" },
    ),
    content: text("content").notNull(),
    tone: text("tone"),
    angle: text("angle"),
    isFavorite: boolean("is_favorite").notNull().default(false),
    copiedCount: integer("copied_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("generated_messages_generation_id_idx").on(table.generationId),
    index("generated_messages_conversation_id_idx").on(table.conversationId),
  ],
);

/** A 1–5 rating on a generated message. One rating per message. */
export const messageRatings = pgTable("message_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id")
    .notNull()
    .unique()
    .references(() => generatedMessages.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
