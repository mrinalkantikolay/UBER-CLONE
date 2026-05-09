import { Consumer, EachMessagePayload } from "kafkajs";
import { createKafkaConsumer, KafkaTopics, CloudEvent } from "../config/kafka";
import { redisClient } from "../config/redis";
import logger from "../config/logger";
import { recordEvent } from "../services/analytics.service";

/* ======================================================
   ANALYTICS SERVICE — KAFKA CONSUMER
   
   Consumer group: analytics-service-group
   Subscribes to: RIDE_REQUESTED, DRIVER_ASSIGNED, RIDE_COMPLETED, PAYMENT_SUCCESS
   
   Deduplication: SET NX analytics:event:{eventId} EX 86400
====================================================== */

let consumer: Consumer | null = null;

const deduplicateEvent = async (eventId: string): Promise<boolean> => {
  if (!redisClient.isReady) {
    logger.warn({ eventId }, "Redis unavailable — skipping dedup (analytics)");
    return true;
  }
  const key = `analytics:event:${eventId}`;
  const result = await redisClient.set(key, "1", { NX: true, EX: 86400 });
  return result !== null;
};

const handleMessage = async ({ topic, message }: EachMessagePayload): Promise<void> => {
  if (!message.value) return;

  let event: CloudEvent;
  try {
    event = JSON.parse(message.value.toString());
  } catch (err) {
    logger.error({ err, topic }, "Failed to parse Kafka message (analytics) — skipping");
    return;
  }

  const { eventId, traceId, payload } = event;
  
  const eventPayload = payload as { city?: string; amount?: number };

  const isNew = await deduplicateEvent(eventId);
  if (!isNew) {
    logger.debug({ topic, eventId, traceId }, "Duplicate Kafka event (analytics) — skipping");
    return;
  }

  logger.info({ topic, eventId, traceId }, "Processing Kafka event (analytics)");

  const city = eventPayload.city || "global";

  try {
    switch (topic) {
      case KafkaTopics.RIDE_REQUESTED:
        await recordEvent("demand", city);
        break;

      case KafkaTopics.DRIVER_ASSIGNED:
        await recordEvent("supply", city);
        await recordEvent("active", city);
        break;

      case KafkaTopics.RIDE_COMPLETED:
      case KafkaTopics.RIDE_CANCELLED:
        await recordEvent("inactive", city);
        break;

      case KafkaTopics.PAYMENT_SUCCESS: {
        const amount = eventPayload.amount;
        if (amount) await recordEvent("revenue", city, amount);
        break;
      }
    }
  } catch (err) {
    logger.error({ err, topic, eventId, traceId }, "Error processing analytics event");
    if (redisClient.isReady) {
      try {
        await redisClient.del(`analytics:event:${eventId}`);
      } catch {}
    }
  }
};

export const startAnalyticsConsumer = async (): Promise<void> => {
  consumer = createKafkaConsumer("analytics-service-group");

  await consumer.connect();
  logger.info("Kafka consumer connected (analytics-service-group)");

  await consumer.subscribe({
    topics: [
      KafkaTopics.RIDE_REQUESTED,
      KafkaTopics.DRIVER_ASSIGNED,
      KafkaTopics.RIDE_COMPLETED,
      KafkaTopics.RIDE_CANCELLED,
      KafkaTopics.PAYMENT_SUCCESS,
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: handleMessage,
  });

  logger.info("Kafka consumer running (analytics) — listening for SAGA events");
};

export const stopAnalyticsConsumer = async (): Promise<void> => {
  if (consumer) {
    await consumer.disconnect();
    consumer = null;
    logger.info("Kafka consumer disconnected (analytics)");
  }
};
