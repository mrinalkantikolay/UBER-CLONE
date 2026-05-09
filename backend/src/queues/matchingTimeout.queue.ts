import { Queue, Worker, Job } from "bullmq";
import { ioRedisConnection } from "../config/bullmq";
import logger from "../config/logger";

import type { MatchTimeoutJobData } from "../types/matching.types";

/* ======================================================
   MATCHING TIMEOUT QUEUE
   
   15-second crash-proof delay window for driver response.
   
   Flow:
   1. Matching Service dispatches ride to driver
   2. Adds delayed job (15s) to this queue
   3. If driver accepts → job is removed before processing
   4. If 15s passes → worker fires, unlocks driver, tries next
   
   No retries — timeout is a one-shot decision.
   removeOnComplete/removeOnFail keep the queue clean.
====================================================== */

/* ---- Queue ---- */

export const matchingTimeoutQueue = new Queue<MatchTimeoutJobData>(
  "matching-timeout",
  {
    connection: ioRedisConnection,
    defaultJobOptions: {
      attempts: 1,             // One-shot — no retries for timeouts
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  }
);

/* ---- Worker ---- */

/*
 * The worker processor is set dynamically by matching.service.ts
 * via setTimeoutProcessor() to avoid circular imports.
 * This pattern is used because:
 * - The worker needs to call matching.service.handleTimeout()
 * - matching.service imports this queue to schedule jobs
 * - Direct import would create a circular dependency
 */
let timeoutProcessor: ((job: Job<MatchTimeoutJobData>) => Promise<void>) | null = null;

export const setTimeoutProcessor = (
  processor: (job: Job<MatchTimeoutJobData>) => Promise<void>
): void => {
  timeoutProcessor = processor;
};

export const matchingTimeoutWorker = new Worker<MatchTimeoutJobData>(
  "matching-timeout",
  async (job: Job<MatchTimeoutJobData>) => {
    if (!timeoutProcessor) {
      logger.error({ jobId: job.id }, "Matching timeout processor not registered — skipping");
      return;
    }
    await timeoutProcessor(job);
  },
  {
    connection: ioRedisConnection,
    concurrency: 10,
  }
);

/* ---- Event Listeners ---- */

matchingTimeoutWorker.on("completed", (job) => {
  logger.debug(
    { jobId: job.id, rideId: job.data.rideId },
    "Matching timeout job completed"
  );
});

matchingTimeoutWorker.on("failed", (job, err) => {
  logger.error(
    { jobId: job?.id, rideId: job?.data.rideId, err },
    "Matching timeout job failed"
  );
});
