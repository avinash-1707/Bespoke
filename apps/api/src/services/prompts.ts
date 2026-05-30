import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { schema, type Prompt } from "@bespoke/db";
import type { CursorPage, ListQuery } from "@bespoke/shared";
import { db } from "../context";
import { clampLimit, decodeCursor, keysetBefore, toPage } from "./_cursor";

export interface CreatePromptInput {
  name: string;
  systemPrompt: string;
  isDefault?: boolean;
}

export type UpdatePromptInput = Partial<CreatePromptInput>;

async function recordAnalytics(
  userId: string,
  entityId: string,
): Promise<void> {
  await db.insert(schema.analyticsEvents).values({
    userId,
    eventType: "prompt_created",
    entityType: "prompt",
    entityId,
  });
}

/**
 * Cursor-paginated, name-searchable prompt list scoped to the user. Paginates
 * by `createdAt DESC, id DESC` for a clean keyset; the default prompt is still
 * returned and surfaced via the `isDefault` flag (shown as a badge in the UI).
 */
export async function listPrompts(
  userId: string,
  query: ListQuery = {},
): Promise<CursorPage<Prompt>> {
  const limit = clampLimit(query.limit);
  const search = query.q?.trim();
  const keyset = keysetBefore(
    schema.prompts.createdAt,
    schema.prompts.id,
    decodeCursor(query.cursor),
  );

  const rows = await db
    .select()
    .from(schema.prompts)
    .where(
      and(
        eq(schema.prompts.userId, userId),
        search ? ilike(schema.prompts.name, `%${search}%`) : undefined,
        keyset,
      ),
    )
    .orderBy(desc(schema.prompts.createdAt), desc(schema.prompts.id))
    .limit(limit + 1);

  return toPage(rows, limit);
}

export async function getPrompt(
  userId: string,
  id: string,
): Promise<Prompt | null> {
  const [prompt] = await db
    .select()
    .from(schema.prompts)
    .where(and(eq(schema.prompts.id, id), eq(schema.prompts.userId, userId)));
  return prompt ?? null;
}

export async function createPrompt(
  userId: string,
  input: CreatePromptInput,
): Promise<Prompt> {
  const prompt = await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: schema.prompts.id })
      .from(schema.prompts)
      .where(eq(schema.prompts.userId, userId));

    // First prompt is the default; otherwise honour the request.
    const makeDefault = input.isDefault ?? existing.length === 0;
    if (makeDefault) {
      await tx
        .update(schema.prompts)
        .set({ isDefault: false })
        .where(eq(schema.prompts.userId, userId));
    }

    const [created] = await tx
      .insert(schema.prompts)
      .values({
        userId,
        name: input.name,
        systemPrompt: input.systemPrompt,
        isDefault: makeDefault,
      })
      .returning();
    return created!;
  });

  await recordAnalytics(userId, prompt.id);
  return prompt;
}

export async function updatePrompt(
  userId: string,
  id: string,
  input: UpdatePromptInput,
): Promise<Prompt | null> {
  const existing = await getPrompt(userId, id);
  if (!existing) return null;

  return db.transaction(async (tx) => {
    // Promoting this prompt to default demotes the others first.
    if (input.isDefault === true) {
      await tx
        .update(schema.prompts)
        .set({ isDefault: false })
        .where(eq(schema.prompts.userId, userId));
    }

    const [updated] = await tx
      .update(schema.prompts)
      .set({
        name: input.name ?? existing.name,
        systemPrompt: input.systemPrompt ?? existing.systemPrompt,
        isDefault: input.isDefault ?? existing.isDefault,
      })
      .where(and(eq(schema.prompts.id, id), eq(schema.prompts.userId, userId)))
      .returning();
    return updated ?? null;
  });
}

export async function deletePrompt(
  userId: string,
  id: string,
): Promise<boolean> {
  const deleted = await db
    .delete(schema.prompts)
    .where(and(eq(schema.prompts.id, id), eq(schema.prompts.userId, userId)))
    .returning({ id: schema.prompts.id });
  return deleted.length > 0;
}

/**
 * Batch-delete prompts the user owns. Foreign ids are ignored by the `user_id`
 * filter; returns the count of rows actually removed.
 */
export async function deleteManyPrompts(
  userId: string,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const deleted = await db
    .delete(schema.prompts)
    .where(
      and(eq(schema.prompts.userId, userId), inArray(schema.prompts.id, ids)),
    )
    .returning({ id: schema.prompts.id });
  return deleted.length;
}
