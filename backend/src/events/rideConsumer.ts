import { Consumer, EachMessagePayload } from "kafkajs";
import { createKafkaConsumer, KafkaTopics, CloudEvent } from "../config/kafka";
import { redisClient } from "../config/redis";
import logger from "../config/logger";

import {
  handleDriverAssigned,
  handleMatchFailed,
  handlePaymentSuccess,
  handlePaymentFailed,
} from "../services/ride.service";

/* ======================================================
   RIDER SERVICE — KAFKA CONSUMER
   
   Consumer group: rider-service-group
   Subscribes to events produced by Matching + Payment services.
   
   Deduplication: Each event is checked against Redis
   SET NX event:{topic}:{eventId} EX 86400
   to prevent processing the same event twice (at-least-once → exactly-once).
====================================================== */

let consumer: Consumer | null = null;

/**
 * Kafka consumer deduplication — O(1) Redis SET NX.
 * Returns true if this event has NOT been processed before.
 */
const deduplicateEvent = async (topic: string, eventId: string): Promise<boolean> => {
  if (!redisClient.isReady) {
    /* Fail-open for dedup — process the event but log warning.
       The handlers themselves are idempotent via DB WHERE guards. */
    logger.warn({ topic, eventId }, "Redis unavailable — skipping dedup check");
    return true;
  }

  const key = `event:${topic}:${eventId}`;
  const result = await redisClient.set(key, "1", { NX: true, EX: 86400 });
  return result !== null;
};

/**
 * Route incoming Kafka messages to the correct SAGA handler.
 */
const handleMessage = async ({ topic, message }: EachMessagePayload): Promise<void> => {
  if (!message.value) return;

  let event: CloudEvent;
  try {
    event = JSON.parse(message.value.toString());
  } catch (err) {
    logger.error({ err, topic, offset: message.offset }, "Failed to parse Kafka message — skipping");
    return;
  }

  const { eventId, traceId, payload } = event;

  /* ---- Deduplication — O(1) ---- */
  const isNew = await deduplicateEvent(topic, eventId);
  if (!isNew) {
    logger.debug({ topic, eventId, traceId }, "Duplicate Kafka event — skipping");
    return;
  }

  logger.info({ topic, eventId, type: event.type, traceId }, "Processing Kafka event");

  try {
    switch (topic) {
      case KafkaTopics.DRIVER_ASSIGNED: {
        const { rideId, driverId } = payload as { rideId: string; driverId: string };
        await handleDriverAssigned(rideId, driverId, traceId);
        break;
      }

      case KafkaTopics.MATCH_FAILED: {
        const { rideId } = payload as { rideId: string };
        await handleMatchFailed(rideId, traceId);
        break;
      }

      case KafkaTopics.PAYMENT_SUCCESS: {
        const { rideId } = payload as { rideId: string };
        await handlePaymentSuccess(rideId, traceId);
        break;
      }

      case KafkaTopics.PAYMENT_FAILED: {
        const { rideId } = payload as { rideId: string };
        await handlePaymentFailed(rideId, traceId);
        break;
      }

      default:
        logger.warn({ topic, eventId }, "Unknown Kafka topic — skipping");
    }
  } catch (err) {
    logger.error({ err, topic, eventId, traceId }, "Error processing Kafka event");
    /* Don't rethrow — KafkaJS will retry via consumer group rebalancing.
       The event is NOT deduped on error, so it will be reprocessed. */
    if (redisClient.isReady) {
      try {
        await redisClient.del(`event:${topic}:${eventId}`);
      } catch {}
    }
  }
};

/**
 * Start the Kafka consumer for the Rider Service.
 * Subscribes to DRIVER_ASSIGNED, MATCH_FAILED, PAYMENT_SUCCESS, PAYMENT_FAILED.
 */
export const startRideConsumer = async (): Promise<void> => {
  consumer = createKafkaConsumer("rider-service-group");

  await consumer.connect();
  logger.info("Kafka consumer connected (rider-service-group)");

  await consumer.subscribe({
    topics: [
      KafkaTopics.DRIVER_ASSIGNED,
      KafkaTopics.MATCH_FAILED,
      KafkaTopics.PAYMENT_SUCCESS,
      KafkaTopics.PAYMENT_FAILED,
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: handleMessage,
  });

  logger.info(
    {
      topics: [
        KafkaTopics.DRIVER_ASSIGNED,
        KafkaTopics.MATCH_FAILED,
        KafkaTopics.PAYMENT_SUCCESS,
        KafkaTopics.PAYMENT_FAILED,
      ],
    },
    "Kafka consumer running — listening for SAGA events"
  );
};

/**
 * Gracefully disconnect the Kafka consumer.
 */
export const stopRideConsumer = async (): Promise<void> => {
  if (consumer) {
    await consumer.disconnect();
    consumer = null;
    logger.info("Kafka consumer disconnected");
  }
};
