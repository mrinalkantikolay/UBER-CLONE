import { Queue, Worker, Job } from "bullmq";
import { ioRedisConnection } from "../config/bullmq";
import prisma from "../config/prisma";
import { publishEvent, CloudEvent, KafkaTopic } from "../config/kafka";
import logger from "../config/logger";

/* ======================================================
   OUTBOX RELAY WORKER (mvp.md §2)

   BullMQ repeatable job that polls the OutboxEvent table
   for unpublished rows and publishes them to Kafka.

   Schedule: Every 5 seconds.
   Batch size: 50 rows per poll cycle.

   Flow:
   1. Query OutboxEvent WHERE published = false ORDER BY createdAt ASC LIMIT 50
   2. For each row, publish to Kafka using the existing publishEvent() helper
   3. On success, mark published = true
   4. On Kafka failure, log error and skip (retries on next poll cycle)

   This guarantees crash-safe event delivery — if the app
   crashes between a DB write and Kafka publish, the event
   row survives in the DB and will be picked up by the relay.
====================================================== */

const QUEUE_NAME = "outbox-relay";
const BATCH_SIZE = 50;

/* ---- Queue ---- */

export const outboxRelayQueue = new Queue(QUEUE_NAME, {
  connection: ioRedisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 100,     // Keep last 100 failed for inspection
  },
});

/* ---- Worker ---- */

const processOutboxRelay = async (_job: Job): Promise<void> => {
  /* 1. Fetch unpublished events — O(log N) index scan on [published, createdAt] */
  const events = await prisma.outboxEvent.findMany({
    where: { published: false },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  if (events.length === 0) return;

  logger.debug({ count: events.length }, "Outbox relay: processing batch");

  let publishedCount = 0;

  for (const event of events) {
    try {
      const cloudEvent = event.payload as unknown as CloudEvent;

      /* 2. Publish to Kafka using existing infrastructure */
      await publishEvent(event.topic as KafkaTopic, cloudEvent);

      /* 3. Mark as published — O(1) */
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { published: true },
      });

      publishedCount++;
    } catch (err) {
      /* 4. On failure, skip — relay retries on next poll cycle.
       *    The event stays unpublished in the DB, so it won't be lost. */
      logger.error(
        { err, outboxId: event.id, topic: event.topic },
        "Outbox relay: failed to publish event — will retry on next cycle"
      );
    }
  }

  if (publishedCount > 0) {
    logger.info(
      { publishedCount, totalInBatch: events.length },
      "Outbox relay: batch completed"
    );
  }
};

export const outboxRelayWorker = new Worker(
  QUEUE_NAME,
  processOutboxRelay,
  {
    connection: ioRedisConnection,
    concurrency: 1, // Single-threaded to prevent duplicate publishes
    limiter: {
      max: 1,
      duration: 1000,
    },
  }
);

outboxRelayWorker.on("failed", (job, err) => {
  logger.error(
    { err, jobId: job?.id },
    "Outbox relay worker job failed"
  );
});

outboxRelayWorker.on("error", (err) => {
  logger.error({ err }, "Outbox relay worker error");
});

/* ---- Register Repeatable Job ----
 * Call this once on server startup to schedule the polling job.
 * BullMQ deduplicates repeatable jobs by their key, so calling
 * this multiple times is safe.
 */
export const registerOutboxRelayJob = async (): Promise<void> => {
  await outboxRelayQueue.add(
    "relay-poll",
    {},
    {
      repeat: {
        every: 5000, // Poll every 5 seconds
      },
    }
  );
  logger.info("Outbox relay repeatable job registered (every 5s)");
};
