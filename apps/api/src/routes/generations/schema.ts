import { z } from "zod";

export const createGenerationBody = z.object({
  offeringId: z.string().uuid(),
  promptId: z.string().uuid(),
  prospectId: z.string().uuid(),
});

export const listGenerationsQuery = z.object({
  prospectId: z.string().uuid(),
});

export const generationIdParams = z.object({
  id: z.string().uuid(),
});
