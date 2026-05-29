import { z } from "zod";

const name = z.string().min(1).max(200);
const longText = z.string().max(5000);
const mediumText = z.string().max(2000);

export const createOfferingBody = z.object({
  name,
  description: longText.optional(),
  targetAudience: mediumText.optional(),
  problemSolved: mediumText.optional(),
  uniqueValueProp: mediumText.optional(),
  proofPoints: mediumText.optional(),
  sourceUrl: z.string().url().optional(),
});

export const updateOfferingBody = z.object({
  name: name.optional(),
  description: longText.optional(),
  targetAudience: mediumText.optional(),
  problemSolved: mediumText.optional(),
  uniqueValueProp: mediumText.optional(),
  proofPoints: mediumText.optional(),
});

export const offeringIdParams = z.object({
  id: z.string().uuid(),
});

export const addSourceBody = z.object({
  url: z.string().url(),
});
