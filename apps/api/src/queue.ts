import {
  createQueues,
  createRedisConnection,
  type Queues,
  type RedisConnection,
} from "@bespoke/queue";
import { config } from "./config";

/**
 * Shared Redis connection and BullMQ queue instances for enqueueing jobs.
 * The connection is lazy, so importing this never blocks api startup when
 * Redis is unreachable.
 */
export const redis: RedisConnection = createRedisConnection(config.REDIS_URL);
export const queues: Queues = createQueues(redis);
