import { Consumer, EachMessagePayload } from "kafkajs";
import { createKafkaConsumer, KafkaTopics, CloudEvent } from "../config/kafka";
import { redisClient } from "../config/redis";
import logger from "../config/logger";

import { handleSagaEvent } from "../services/notification.service";

/* ======================================================
   NOTIFICATION SERVICE — KAFKA CONSUMER
   
   Consumer group: notification-service-group
   Subscribes to:
   - MATCH_FAILED → Push notification to rider
   - PAYMENT_FAILED → Push + Email to rider
   - RIDE_COMPLETED → Receipt email to rider
   
   Deduplication: SET NX idempotency:notification:{eventId} EX 86400
====================================================== */

let consumer: Consumer | null = null;

/**
 * Kafka event deduplication — O(1) Redis SET NX.
 */
const deduplicateEvent = async (eventId: string): Promise<boolean> => {
  if (!redisClient.isReady) {
    logger.warn({ eventId }, "Redis unavailable — skipping dedup (notification)");
    return true;
  }
  const key = `idempotency:notification:${eventId}`;
  const result = await redisClient.set(key, "1", { NX: true, EX: 86400 });
  return result !== null;
};

/**
 * Route incoming Kafka messages to the notification handler.
 */
const handleMessage = async ({ topic, message }: EachMessagePayload): Promise<void> => {
  if (!message.value) return;

  let event: CloudEvent;
  try {
    event = JSON.parse(message.value.toString());
  } catch (err) {
    logger.error({ err, topic }, "Failed to parse Kafka message (notification) — skipping");
    return;
  }

  const { eventId, traceId, payload, type } = event;

  /* ---- Deduplication ---- */
  const isNew = await deduplicateEvent(eventId);
  if (!isNew) {
    logger.debug({ topic, eventId, traceId }, "Duplicate Kafka event (notification) — skipping");
    return;
  }

  logger.info({ topic, eventId, type, traceId }, "Processing Kafka event (notification)");

  try {
    await handleSagaEvent(type, payload as Record<string, unknown>, traceId);
  } catch (err) {
    logger.error({ err, topic, eventId, traceId }, "Error processing notification event");
    /* Delete dedup key so event is reprocessed */
    if (redisClient.isReady) {
      try {
        await redisClient.del(`idempotency:notification:${eventId}`);
      } catch {}
    }
  }
};

/**
 * Start the Kafka consumer for the Notification Service.
 */
export const startNotificationConsumer = async (): Promise<void> => {
  consumer = createKafkaConsumer("notification-service-group");

  await consumer.connect();
  logger.info("Kafka consumer connected (notification-service-group)");

  await consumer.subscribe({
    topics: [
      KafkaTopics.MATCH_FAILED,
      KafkaTopics.PAYMENT_FAILED,
      KafkaTopics.RIDE_COMPLETED,
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: handleMessage,
  });

  logger.info(
    {
      topics: [
        KafkaTopics.MATCH_FAILED,
        KafkaTopics.PAYMENT_FAILED,
        KafkaTopics.RIDE_COMPLETED,
      ],
    },
    "Kafka consumer running (notification) — listening for SAGA events"
  );
};

/**
 * Gracefully disconnect the Kafka consumer.
 */
export const stopNotificationConsumer = async (): Promise<void> => {
  if (consumer) {
    await consumer.disconnect();
    consumer = null;
    logger.info("Kafka consumer disconnected (notification)");
  }
};
