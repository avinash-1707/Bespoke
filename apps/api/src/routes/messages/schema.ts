import { z } from "zod";

export const messageIdParams = z.object({
  id: z.string().uuid(),
});

export const rateBody = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(2000).optional(),
});

export const favoriteBody = z.object({
  isFavorite: z.boolean(),
});
