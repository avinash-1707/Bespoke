"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../api-client";

export interface UploadSignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
}

/** Request a short-lived Cloudinary upload signature from the api. */
export function useCloudinarySignature() {
  return useMutation({
    mutationFn: (folder?: string) =>
      apiClient.post<UploadSignature>("/api/uploads/sign", { folder }),
  });
}

/**
 * Upload a file straight to Cloudinary with a backend-issued signature. Goes
 * direct to Cloudinary (not the api) with `credentials: "omit"` — different
 * origin, no auth cookie. Returns the `public_id` to persist as the asset's
 * file key.
 */
export async function uploadToCloudinary(
  file: File,
  sig: UploadSignature,
): Promise<CloudinaryUploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: "POST", credentials: "omit", body: form },
  );
  if (!response.ok) {
    throw new Error(`Cloudinary upload failed (${response.status})`);
  }
  const data = (await response.json()) as {
    public_id: string;
    secure_url: string;
  };
  return { publicId: data.public_id, secureUrl: data.secure_url };
}
