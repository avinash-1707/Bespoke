import { z } from "zod";

const assetType = z.enum([
  "linkedin_screenshot",
  "github",
  "personal_site",
  "company_site",
  "other_url",
  "notes",
]);

const assetInput = z
  .object({
    assetType,
    url: z.string().url().optional(),
    fileKey: z.string().optional(),
  })
  .refine((a) => Boolean(a.url) || Boolean(a.fileKey), {
    message: "An asset needs a url or a fileKey",
  });

export const createProspectBody = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320).optional(),
  jobTitle: z.string().max(200).optional(),
  companyName: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  assets: z.array(assetInput).max(20).optional(),
});

export const updateProspectBody = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(320).optional(),
  jobTitle: z.string().max(200).optional(),
  companyName: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
});

export const addAssetBody = assetInput;

export const prospectIdParams = z.object({
  id: z.string().uuid(),
});
