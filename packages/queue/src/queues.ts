import { Queue } from "bullmq";
import type IORedis from "ioredis";
import { QUEUE_NAME, type QueueName } from "./types";

export type Queues = Record<QueueName, Queue>;

/**
 * Instantiate one BullMQ Queue per logical queue, sharing a single ioredis
 * connection. Default job options apply retry/backoff to every enqueue so
 * transient scrape/AI failures recover without bespoke per-call config.
 */
export function createQueues(connection: IORedis): Queues {
  const defaultJobOptions = {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 86400 },
  } as const;

  return {
    [QUEUE_NAME.scrape]: new Queue(QUEUE_NAME.scrape, {
      connection,
      defaultJobOptions,
    }),
    [QUEUE_NAME.generate]: new Queue(QUEUE_NAME.generate, {
      connection,
      defaultJobOptions,
    }),
  };
}
