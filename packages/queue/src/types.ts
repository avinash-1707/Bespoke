/**
 * Single source of truth for queue names, job names, and job payload shapes.
 * Imported by both the api (producer) and the worker (consumer) so neither
 * side can drift. No stringly-typed job data anywhere else.
 */

export const QUEUE_NAME = {
  scrape: "scrape-queue",
  generate: "generate-queue",
} as const;
export type QueueName = (typeof QUEUE_NAME)[keyof typeof QUEUE_NAME];

export const JOB_NAME = {
  scrapeProspectAsset: "scrape-prospect-asset",
  scrapeOfferingSource: "scrape-offering-source",
  consolidateInsights: "consolidate-insights",
  generateMessage: "generate-message",
  generateReply: "generate-reply",
} as const;
export type JobName = (typeof JOB_NAME)[keyof typeof JOB_NAME];

export interface ScrapeProspectAssetPayload {
  assetId: string;
  prospectId: string;
  userId: string;
}

export interface ScrapeOfferingSourcePayload {
  sourceId: string;
  offeringId: string;
  userId: string;
}

export interface ConsolidateInsightsPayload {
  prospectId: string;
  userId: string;
}

export interface GenerateMessagePayload {
  generationId: string;
  userId: string;
  prospectId: string;
  offeringId: string;
  promptId: string;
}

export interface GenerateReplyPayload {
  generationId: string;
  conversationId: string;
  userId: string;
  replyContent: string;
}

/** Maps each job name to its payload type for end-to-end type safety. */
export interface JobPayloadMap {
  [JOB_NAME.scrapeProspectAsset]: ScrapeProspectAssetPayload;
  [JOB_NAME.scrapeOfferingSource]: ScrapeOfferingSourcePayload;
  [JOB_NAME.consolidateInsights]: ConsolidateInsightsPayload;
  [JOB_NAME.generateMessage]: GenerateMessagePayload;
  [JOB_NAME.generateReply]: GenerateReplyPayload;
}

/** Which queue each job is dispatched on. */
export const JOB_QUEUE: Record<JobName, QueueName> = {
  [JOB_NAME.scrapeProspectAsset]: QUEUE_NAME.scrape,
  [JOB_NAME.scrapeOfferingSource]: QUEUE_NAME.scrape,
  [JOB_NAME.consolidateInsights]: QUEUE_NAME.scrape,
  [JOB_NAME.generateMessage]: QUEUE_NAME.generate,
  [JOB_NAME.generateReply]: QUEUE_NAME.generate,
};
