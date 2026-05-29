import { createQueues, createRedisConnection, type Queues } from "@bespoke/queue";
import { config } from "../config";

/**
 * Queue handles for the worker to *enqueue* follow-up jobs (e.g. a completed
 * asset scrape enqueues `consolidate-insights`). Uses its own lazy ioredis
 * connection — separate from the Workers' consuming connection — so producing
 * never contends with the blocking commands BullMQ Workers hold.
 */
const connection = createRedisConnection(config.REDIS_URL);
export const queues: Queues = createQueues(connection);
