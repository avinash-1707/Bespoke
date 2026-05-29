import { config } from "../config";

/**
 * Build a Cloudinary delivery URL from a stored `public_id`. Screenshots are
 * uploaded browser-direct (signed by the api) and only the `public_id` is
 * persisted in `prospect_assets.file_key`; the worker rebuilds the fetchable
 * URL here for vision extraction. `f_auto,q_auto` keeps the payload small.
 */
export function deliveryUrl(publicId: string): string {
  return `https://res.cloudinary.com/${config.CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${publicId}`;
}
