/**
 * Canonical enum string values shared across web, api, and worker.
 * Defined as `as const` objects so both the runtime values and the
 * derived union types stay in lockstep — never redeclare these inline.
 */

export const OFFERING_SOURCE_TYPE = {
  url: "url",
  manual: "manual",
} as const;
export type OfferingSourceType =
  (typeof OFFERING_SOURCE_TYPE)[keyof typeof OFFERING_SOURCE_TYPE];

export const OFFERING_STATUS = {
  draft: "draft",
  /** A source URL is being scraped + extracted in the background. */
  scraping: "scraping",
  ready: "ready",
} as const;
export type OfferingStatus =
  (typeof OFFERING_STATUS)[keyof typeof OFFERING_STATUS];

export const PROSPECT_ASSET_TYPE = {
  linkedin_screenshot: "linkedin_screenshot",
  github: "github",
  personal_site: "personal_site",
  company_site: "company_site",
  other_url: "other_url",
  notes: "notes",
} as const;
export type ProspectAssetType =
  (typeof PROSPECT_ASSET_TYPE)[keyof typeof PROSPECT_ASSET_TYPE];

/** Lifecycle of any async scrape/processing job surfaced to the user. */
export const ASSET_STATUS = {
  pending: "pending",
  processing: "processing",
  done: "done",
  failed: "failed",
} as const;
export type AssetStatus =
  (typeof ASSET_STATUS)[keyof typeof ASSET_STATUS];

export const JOB_STATUS = {
  pending: "pending",
  processing: "processing",
  completed: "completed",
  failed: "failed",
} as const;
export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const GENERATION_TYPE = {
  message: "message",
  reply: "reply",
} as const;
export type GenerationType =
  (typeof GENERATION_TYPE)[keyof typeof GENERATION_TYPE];

export const CONVERSATION_STATUS = {
  active: "active",
  archived: "archived",
} as const;
export type ConversationStatus =
  (typeof CONVERSATION_STATUS)[keyof typeof CONVERSATION_STATUS];

/** Author of a single turn in a conversation thread. */
export const MESSAGE_ROLE = {
  user: "user",
  prospect: "prospect",
  assistant: "assistant",
} as const;
export type MessageRole = (typeof MESSAGE_ROLE)[keyof typeof MESSAGE_ROLE];

export const ANALYTICS_EVENT_TYPE = {
  offering_created: "offering_created",
  prompt_created: "prompt_created",
  prospect_created: "prospect_created",
  message_generated: "message_generated",
  reply_generated: "reply_generated",
  message_rated: "message_rated",
  message_favorited: "message_favorited",
  message_copied: "message_copied",
} as const;
export type AnalyticsEventType =
  (typeof ANALYTICS_EVENT_TYPE)[keyof typeof ANALYTICS_EVENT_TYPE];
