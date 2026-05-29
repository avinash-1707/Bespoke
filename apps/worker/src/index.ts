import { Worker, type Processor } from "bullmq";
import { createRedisConnection, QUEUE_NAME } from "@bespoke/queue";
import { config } from "./config";

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

const workers: Worker[] = [
  new Worker(QUEUE_NAME.scrape, notImplemented, {
    connection,
    concurrency: 5,
  }),
  new Worker(QUEUE_NAME.generate, notImplemented, {
    connection,
    concurrency: 3,
  }),
];

for (const worker of workers) {
  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id ?? "?"} (${job?.name}) failed:`, err.message);
  });
}

console.log("Worker ready — listening on scrape-queue and generate-queue");

async function shutdown(): Promise<void> {
  console.log("Shutting down worker…");
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
