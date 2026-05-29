import { and, desc, eq } from "drizzle-orm";
import { schema, type Prompt } from "@bespoke/db";
import { db } from "../context";

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

export async function listPrompts(userId: string): Promise<Prompt[]> {
  return db
    .select()
    .from(schema.prompts)
    .where(eq(schema.prompts.userId, userId))
    .orderBy(desc(schema.prompts.isDefault), desc(schema.prompts.createdAt));
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
