import { z } from "zod";

export const createPromptBody = z.object({
  name: z.string().min(1).max(200),
  systemPrompt: z.string().min(1).max(20000),
  isDefault: z.boolean().optional(),
});

export const updatePromptBody = z.object({
  name: z.string().min(1).max(200).optional(),
  systemPrompt: z.string().min(1).max(20000).optional(),
  isDefault: z.boolean().optional(),
});

export const promptIdParams = z.object({
  id: z.string().uuid(),
});
