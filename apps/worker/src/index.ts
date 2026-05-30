import { Worker, type Job, type Processor } from "bullmq";
import {
  createRedisConnection,
  JOB_NAME,
  QUEUE_NAME,
  type ConsolidateInsightsPayload,
  type GenerateMessagePayload,
  type GenerateReplyPayload,
  type ScrapeOfferingSourcePayload,
  type ScrapeProspectAssetPayload,
} from "@bespoke/queue";
import { config } from "./config";
import { logger } from "./lib/logger";
import { scrapeOfferingSource } from "./processors/scrape-offering-source";
import { scrapeProspectAsset } from "./processors/scrape-prospect-asset";
import { consolidateInsights } from "./processors/consolidate-insights";
import { generateMessage } from "./processors/generate-message";
import { generateReply } from "./processors/generate-reply";

/**
 * Worker bootstrap. Spins up one BullMQ Worker per queue sharing a single
 * ioredis connection. Per-queue concurrency follows the architecture default
 * (5 scrape, 3 generate). Job processors are registered per type as their
 * units land; until then unknown jobs fail loudly rather than silently.
 */
const connection = createRedisConnection(config.REDIS_URL);

const notImplemented: Processor = async (job) => {
  throw new Error(`No processor registered for job "${job.name}"`);
};

/** Routes scrape-queue jobs to their processor by job name. */
const scrapeProcessor: Processor = async (job) => {
  switch (job.name) {
    case JOB_NAME.scrapeOfferingSource:
      return scrapeOfferingSource(job as Job<ScrapeOfferingSourcePayload>);
    case JOB_NAME.scrapeProspectAsset:
      return scrapeProspectAsset(job as Job<ScrapeProspectAssetPayload>);
    case JOB_NAME.consolidateInsights:
      return consolidateInsights(job as Job<ConsolidateInsightsPayload>);
    default:
      return notImplemented(job);
  }
};

/** Routes generate-queue jobs to their processor by job name. */
const generateProcessor: Processor = async (job) => {
  switch (job.name) {
    case JOB_NAME.generateMessage:
      return generateMessage(job as Job<GenerateMessagePayload>);
    case JOB_NAME.generateReply:
      return generateReply(job as Job<GenerateReplyPayload>);
    default:
      return notImplemented(job);
  }
};

const workers: Worker[] = [
  new Worker(QUEUE_NAME.scrape, scrapeProcessor, {
    connection,
    concurrency: 5,
  }),
  new Worker(QUEUE_NAME.generate, generateProcessor, {
    connection,
    concurrency: 3,
  }),
];

for (const worker of workers) {
  worker.on("active", (job) => {
    logger.info("job started", { jobId: job.id, job: job.name, queue: job.queueName });
  });
  worker.on("completed", (job) => {
    const durationMs =
      job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : null;
    logger.info("job completed", {
      jobId: job.id,
      job: job.name,
      queue: job.queueName,
      durationMs,
    });
  });
  worker.on("failed", (job, err) => {
    logger.error("job failed", {
      jobId: job?.id ?? null,
      job: job?.name ?? null,
      queue: job?.queueName ?? null,
      attemptsMade: job?.attemptsMade ?? null,
      error: err.message,
    });
  });
  worker.on("error", (err) => {
    logger.error("worker error", { error: err.message });
  });
}

logger.info("worker ready", {
  queues: [QUEUE_NAME.scrape, QUEUE_NAME.generate],
});

async function shutdown(): Promise<void> {
  logger.info("worker shutting down");
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
