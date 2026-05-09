import { Consumer, EachMessagePayload } from "kafkajs";
import { createKafkaConsumer, KafkaTopics, CloudEvent } from "../config/kafka";
import { redisClient } from "../config/redis";
import logger from "../config/logger";

import { createPaymentIntent } from "../services/payment.service";

/* ======================================================
   PAYMENT SERVICE — KAFKA CONSUMER
   
   Consumer group: payment-service-group
   Subscribes to:
   - RIDE_COMPLETED → triggers payment intent creation
   
   Deduplication: SET NX event:{topic}:{eventId} EX 86400
====================================================== */

let consumer: Consumer | null = null;

/**
 * Kafka event deduplication — O(1) Redis SET NX.
 */
const deduplicateEvent = async (topic: string, eventId: string): Promise<boolean> => {
  if (!redisClient.isReady) {
    logger.warn({ topic, eventId }, "Redis unavailable — skipping dedup check (payment)");
    return true;
  }
  const key = `event:${topic}:${eventId}`;
  const result = await redisClient.set(key, "1", { NX: true, EX: 86400 });
  return result !== null;
};

/**
 * Route incoming Kafka messages to the payment handler.
 */
const handleMessage = async ({ topic, message }: EachMessagePayload): Promise<void> => {
  if (!message.value) return;

  let event: CloudEvent;
  try {
    event = JSON.parse(message.value.toString());
  } catch (err) {
    logger.error({ err, topic, offset: message.offset }, "Failed to parse Kafka message (payment) — skipping");
    return;
  }

  const { eventId, traceId, payload } = event;

  /* ---- Deduplication ---- */
  const isNew = await deduplicateEvent(topic, eventId);
  if (!isNew) {
    logger.debug({ topic, eventId, traceId }, "Duplicate Kafka event (payment) — skipping");
    return;
  }

  logger.info({ topic, eventId, type: event.type, traceId }, "Processing Kafka event (payment)");

  try {
    switch (topic) {
      case KafkaTopics.RIDE_COMPLETED: {
        const { rideId, userId, fare } = payload as {
          rideId: string;
          userId: string;
          driverId: string | null;
          fare: number | null;
        };

        if (!fare || fare <= 0) {
          logger.warn({ rideId, fare, traceId }, "Invalid fare — cannot create payment intent");
          return;
        }

        await createPaymentIntent(rideId, userId, fare, traceId);
        break;
      }

      default:
        logger.warn({ topic, eventId }, "Unknown Kafka topic (payment) — skipping");
    }
  } catch (err) {
    logger.error({ err, topic, eventId, traceId }, "Error processing Kafka event (payment)");
    /* Delete dedup key so event is reprocessed */
    if (redisClient.isReady) {
      try {
        await redisClient.del(`event:${topic}:${eventId}`);
      } catch {}
    }
  }
};

/**
 * Start the Kafka consumer for the Payment Service.
 */
export const startPaymentConsumer = async (): Promise<void> => {
  consumer = createKafkaConsumer("payment-service-group");

  await consumer.connect();
  logger.info("Kafka consumer connected (payment-service-group)");

  await consumer.subscribe({
    topics: [KafkaTopics.RIDE_COMPLETED],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: handleMessage,
  });

  logger.info(
    { topics: [KafkaTopics.RIDE_COMPLETED] },
    "Kafka consumer running (payment) — listening for ride completed events"
  );
};

/**
 * Gracefully disconnect the Kafka consumer.
 */
export const stopPaymentConsumer = async (): Promise<void> => {
  if (consumer) {
    await consumer.disconnect();
    consumer = null;
    logger.info("Kafka consumer disconnected (payment)");
  }
};
