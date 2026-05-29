import { v2 as cloudinary } from "cloudinary";
import { config } from "../config";

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

/** Default folder for prospect screenshot uploads. */
export const DEFAULT_UPLOAD_FOLDER = "bespoke/prospects";

export interface UploadSignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

/**
 * Sign a Cloudinary upload so the browser can upload the file directly without
 * the api ever touching the bytes or exposing the API secret. The same
 * `folder` + `timestamp` the client sends to Cloudinary must be signed here,
 * or Cloudinary rejects the upload.
 */
export function signUpload(folder = DEFAULT_UPLOAD_FOLDER): UploadSignature {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    config.CLOUDINARY_API_SECRET,
  );
  return {
    timestamp,
    signature,
    apiKey: config.CLOUDINARY_API_KEY,
    cloudName: config.CLOUDINARY_CLOUD_NAME,
    folder,
  };
}
