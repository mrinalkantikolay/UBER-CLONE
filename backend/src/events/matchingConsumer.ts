import { Consumer, EachMessagePayload } from "kafkajs";
import { createKafkaConsumer, KafkaTopics, CloudEvent } from "../config/kafka";
import { redisClient } from "../config/redis";
import logger from "../config/logger";

import { startMatching, handleRideCancelled } from "../services/matching.service";

/* ======================================================
   MATCHING SERVICE — KAFKA CONSUMER
   
   Consumer group: matching-service-group
   Subscribes to:
   - RIDE_REQUESTED → triggers driver matching
   - RIDE_CANCELLED → cancels in-progress matching
   
   Deduplication: SET NX event:{topic}:{eventId} EX 86400
   (Same pattern as Rider Service consumer)
====================================================== */

let consumer: Consumer | null = null;

/**
 * Kafka event deduplication — O(1) Redis SET NX.
 * Returns true if this event has NOT been processed before.
 */
const deduplicateEvent = async (topic: string, eventId: string): Promise<boolean> => {
  if (!redisClient.isReady) {
    /* Fail-open for dedup — process the event but log warning.
       The handlers are idempotent via Redis status checks. */
    logger.warn({ topic, eventId }, "Redis unavailable — skipping dedup check (matching)");
    return true;
  }

  const key = `event:${topic}:${eventId}`;
  const result = await redisClient.set(key, "1", { NX: true, EX: 86400 });
  return result !== null;
};

/**
 * Route incoming Kafka messages to the correct handler.
 */
const handleMessage = async ({ topic, message }: EachMessagePayload): Promise<void> => {
  if (!message.value) return;

  let event: CloudEvent;
  try {
    event = JSON.parse(message.value.toString());
  } catch (err) {
    logger.error({ err, topic, offset: message.offset }, "Failed to parse Kafka message (matching) — skipping");
    return;
  }

  const { eventId, traceId, payload } = event;

  /* ---- Deduplication — O(1) ---- */
  const isNew = await deduplicateEvent(topic, eventId);
  if (!isNew) {
    logger.debug({ topic, eventId, traceId }, "Duplicate Kafka event (matching) — skipping");
    return;
  }

  logger.info({ topic, eventId, type: event.type, traceId }, "Processing Kafka event (matching)");

  try {
    switch (topic) {
      case KafkaTopics.RIDE_REQUESTED: {
        const {
          rideId, userId,
          originLng, originLat,
          destLng, destLat,
          fare, surgeMultiplier,
        } = payload as {
          rideId: string;
          userId: string;
          originLat: number;
          originLng: number;
          destLat: number;
          destLng: number;
          fare: number;
          surgeMultiplier: number;
        };

        await startMatching(
          rideId, userId,
          originLng, originLat,
          destLng, destLat,
          fare ?? 0,
          surgeMultiplier ?? 1.0,
          traceId
        );
        break;
      }

      case KafkaTopics.RIDE_CANCELLED: {
        const { rideId, driverId } = payload as {
          rideId: string;
          driverId: string | null;
        };
        await handleRideCancelled(rideId, driverId, traceId);
        break;
      }

      default:
        logger.warn({ topic, eventId }, "Unknown Kafka topic (matching) — skipping");
    }
  } catch (err) {
    logger.error({ err, topic, eventId, traceId }, "Error processing Kafka event (matching)");
    /* Delete dedup key so event is reprocessed */
    if (redisClient.isReady) {
      try {
        await redisClient.del(`event:${topic}:${eventId}`);
      } catch {}
    }
  }
};

/**
 * Start the Kafka consumer for the Matching Service.
 */
export const startMatchingConsumer = async (): Promise<void> => {
  consumer = createKafkaConsumer("matching-service-group");

  await consumer.connect();
  logger.info("Kafka consumer connected (matching-service-group)");

  await consumer.subscribe({
    topics: [
      KafkaTopics.RIDE_REQUESTED,
      KafkaTopics.RIDE_CANCELLED,
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: handleMessage,
  });

  logger.info(
    {
      topics: [
        KafkaTopics.RIDE_REQUESTED,
        KafkaTopics.RIDE_CANCELLED,
      ],
    },
    "Kafka consumer running (matching) — listening for ride events"
  );
};

/**
 * Gracefully disconnect the Kafka consumer.
 */
export const stopMatchingConsumer = async (): Promise<void> => {
  if (consumer) {
    await consumer.disconnect();
    consumer = null;
    logger.info("Kafka consumer disconnected (matching)");
  }
};
