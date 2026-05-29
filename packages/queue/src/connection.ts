import IORedis from "ioredis";

/** The ioredis connection type BullMQ queues and workers share. */
export type RedisConnection = IORedis;

/**
 * Build the shared ioredis connection for BullMQ from the Upstash TCP URL
 * (`rediss://…`). `maxRetriesPerRequest: null` is REQUIRED — BullMQ throws on
 * startup without it. TLS is implied by the `rediss://` scheme. The caller
 * owns reading and validating `REDIS_URL`; this factory never reads env.
 */
export function createRedisConnection(redisUrl: string): RedisConnection {
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    // Connect on first command, not on construction — lets the api boot even
    // when Redis is unreachable; only enqueue/consume then fails.
    lazyConnect: true,
  });
}
