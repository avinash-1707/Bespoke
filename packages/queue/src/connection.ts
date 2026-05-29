import IORedis from "ioredis";

/**
 * Build the shared ioredis connection for BullMQ from the Upstash TCP URL
 * (`rediss://…`). `maxRetriesPerRequest: null` is REQUIRED — BullMQ throws on
 * startup without it. TLS is implied by the `rediss://` scheme. The caller
 * owns reading and validating `REDIS_URL`; this factory never reads env.
 */
export function createRedisConnection(redisUrl: string): IORedis {
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
}
