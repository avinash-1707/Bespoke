import { JOB_QUEUE, type JobName, type JobPayloadMap } from "./types";
import type { Queues } from "./queues";

/**
 * Type-safe enqueue helper. The payload type is inferred from the job name
 * via `JobPayloadMap`, so a mismatched payload is a compile error. Returns
 * the BullMQ job id, which callers persist on the Postgres job row for
 * status correlation.
 */
export async function enqueueJob<T extends JobName>(
  queues: Queues,
  jobName: T,
  payload: JobPayloadMap[T],
): Promise<string> {
  const queue = queues[JOB_QUEUE[jobName]];
  const job = await queue.add(jobName, payload);
  if (!job.id) {
    throw new Error(`BullMQ did not return a job id for "${jobName}"`);
  }
  return job.id;
}
