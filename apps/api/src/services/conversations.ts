import { and, asc, desc, eq } from "drizzle-orm";
import {
  schema,
  type Conversation,
  type ConversationMessage,
} from "@bespoke/db";
import { JOB_NAME, QUEUE_NAME, enqueueJob } from "@bespoke/queue";
import type { ConversationStatus } from "@bespoke/shared";
import { db } from "../context";
import { queues } from "../queue";
import { getSettings } from "./settings";

export interface ConversationWithMessages extends Conversation {
  messages: ConversationMessage[];
}

export type CreateConversationResult =
  | { status: "ok"; conversation: ConversationWithMessages }
  | { status: "not_found" };

export type AddReplyResult =
  | { status: "ok"; conversation: ConversationWithMessages }
  | { status: "not_found" };

/** Confirm a conversation belongs to the user (via its prospect) and load it. */
async function ownedConversation(
  userId: string,
  conversationId: string,
): Promise<Conversation | null> {
  const [row] = await db
    .select({ conversation: schema.conversations })
    .from(schema.conversations)
    .innerJoin(
      schema.prospects,
      eq(schema.conversations.prospectId, schema.prospects.id),
    )
    .where(
      and(
        eq(schema.conversations.id, conversationId),
        eq(schema.prospects.userId, userId),
      ),
    );
  return row?.conversation ?? null;
}

async function loadThread(
  conversationId: string,
): Promise<ConversationMessage[]> {
  return db
    .select()
    .from(schema.conversationMessages)
    .where(eq(schema.conversationMessages.conversationId, conversationId))
    .orderBy(asc(schema.conversationMessages.createdAt));
}

/**
 * Start a conversation from a generated message. Seeds the thread with that
 * message as the first assistant turn and links it via `initialMessageId`.
 * Returns not_found when the message is not owned by the user.
 */
export async function createFromMessage(
  userId: string,
  messageId: string,
): Promise<CreateConversationResult> {
  const [row] = await db
    .select({
      message: schema.generatedMessages,
      prospectId: schema.aiGenerations.prospectId,
      generationId: schema.aiGenerations.id,
    })
    .from(schema.generatedMessages)
    .innerJoin(
      schema.aiGenerations,
      eq(schema.generatedMessages.generationId, schema.aiGenerations.id),
    )
    .where(
      and(
        eq(schema.generatedMessages.id, messageId),
        eq(schema.aiGenerations.userId, userId),
      ),
    );
  if (!row?.prospectId) return { status: "not_found" };

  const [conversation] = await db
    .insert(schema.conversations)
    .values({
      prospectId: row.prospectId,
      initialMessageId: messageId,
      status: "active",
    })
    .returning();

  await db
    .update(schema.generatedMessages)
    .set({ conversationId: conversation!.id })
    .where(eq(schema.generatedMessages.id, messageId));

  await db.insert(schema.conversationMessages).values({
    conversationId: conversation!.id,
    role: "assistant",
    content: row.message.content,
    metadata: { generationId: row.generationId },
  });

  const messages = await loadThread(conversation!.id);
  return { status: "ok", conversation: { ...conversation!, messages } };
}

/** Conversations for the user's prospects, newest first; optional prospect filter. */
export async function listConversations(
  userId: string,
  prospectId?: string,
): Promise<Conversation[]> {
  const where = prospectId
    ? and(
        eq(schema.prospects.userId, userId),
        eq(schema.conversations.prospectId, prospectId),
      )
    : eq(schema.prospects.userId, userId);

  const rows = await db
    .select({ conversation: schema.conversations })
    .from(schema.conversations)
    .innerJoin(
      schema.prospects,
      eq(schema.conversations.prospectId, schema.prospects.id),
    )
    .where(where)
    .orderBy(desc(schema.conversations.createdAt));

  return rows.map((r) => r.conversation);
}

export async function getConversation(
  userId: string,
  conversationId: string,
): Promise<ConversationWithMessages | null> {
  const conversation = await ownedConversation(userId, conversationId);
  if (!conversation) return null;
  const messages = await loadThread(conversationId);
  return { ...conversation, messages };
}

/**
 * Append a prospect's pasted reply to the thread and enqueue `generate-reply`.
 * A new reply-type `ai_generations` row carries the offering/prompt/prospect
 * from the conversation's initial generation so the worker can rebuild context.
 */
export async function addReply(
  userId: string,
  conversationId: string,
  replyContent: string,
): Promise<AddReplyResult> {
  const conversation = await ownedConversation(userId, conversationId);
  if (!conversation) return { status: "not_found" };

  await db.insert(schema.conversationMessages).values({
    conversationId,
    role: "prospect",
    content: replyContent,
  });

  // Inherit the original generation's inputs (offering/prompt/prospect).
  const [initial] = conversation.initialMessageId
    ? await db
        .select({
          offeringId: schema.aiGenerations.offeringId,
          promptId: schema.aiGenerations.promptId,
          prospectId: schema.aiGenerations.prospectId,
        })
        .from(schema.generatedMessages)
        .innerJoin(
          schema.aiGenerations,
          eq(schema.generatedMessages.generationId, schema.aiGenerations.id),
        )
        .where(eq(schema.generatedMessages.id, conversation.initialMessageId))
    : [];

  const { generationModel } = await getSettings(userId);

  const [generation] = await db
    .insert(schema.aiGenerations)
    .values({
      userId,
      generationType: "reply",
      model: generationModel,
      status: "pending",
      offeringId: initial?.offeringId ?? null,
      promptId: initial?.promptId ?? null,
      prospectId: initial?.prospectId ?? conversation.prospectId,
    })
    .returning();

  const [jobRow] = await db
    .insert(schema.generationJobs)
    .values({
      generationId: generation!.id,
      status: "pending",
      queueName: QUEUE_NAME.generate,
    })
    .returning();

  const bullmqJobId = await enqueueJob(queues, JOB_NAME.generateReply, {
    generationId: generation!.id,
    conversationId,
    userId,
    replyContent,
  });

  await db
    .update(schema.generationJobs)
    .set({ bullmqJobId })
    .where(eq(schema.generationJobs.id, jobRow!.id));

  const messages = await loadThread(conversationId);
  return { status: "ok", conversation: { ...conversation, messages } };
}

export async function setStatus(
  userId: string,
  conversationId: string,
  status: ConversationStatus,
): Promise<boolean> {
  const conversation = await ownedConversation(userId, conversationId);
  if (!conversation) return false;
  await db
    .update(schema.conversations)
    .set({ status })
    .where(eq(schema.conversations.id, conversationId));
  return true;
}

export async function deleteConversation(
  userId: string,
  conversationId: string,
): Promise<boolean> {
  const conversation = await ownedConversation(userId, conversationId);
  if (!conversation) return false;
  await db
    .delete(schema.conversations)
    .where(eq(schema.conversations.id, conversationId));
  return true;
}
