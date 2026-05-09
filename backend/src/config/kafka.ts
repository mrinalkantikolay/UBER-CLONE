import { Kafka, Producer, Consumer, logLevel, EachMessagePayload } from "kafkajs";
import env from "./env";
import logger from "./logger";

/* ======================================================
   KAFKA CLIENT (KafkaJS)

   Central Kafka configuration. Creates a singleton Kafka
   client, a lazy-connect producer, and a consumer factory.
   
   All messages use CloudEvents-compliant format:
   { eventId, version, type, source, timestamp, traceId, payload }
====================================================== */

const kafka = new Kafka({
  clientId: env.SERVICE_NAME,
  brokers: env.KAFKA_BROKERS.split(","),
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
});

/* ---- TOPICS ---- */

export const KafkaTopics = {
  RIDE_REQUESTED: "ride.requested",
  RIDE_CANCELLED: "ride.cancelled",
  RIDE_COMPLETED: "ride.completed",
  DRIVER_ASSIGNED: "driver.assigned",
  DRIVER_DISPATCH: "driver.dispatch",
  MATCH_FAILED: "match.failed",
  PAYMENT_SUCCESS: "payment.success",
  PAYMENT_FAILED: "payment.failed",
} as const;

export type KafkaTopic = (typeof KafkaTopics)[keyof typeof KafkaTopics];

/* ---- CLOUD EVENTS FORMAT ---- */

export interface CloudEvent<T = unknown> {
  eventId: string;
  version: string;
  type: string;
  source: string;
  timestamp: string;
  traceId: string;
  payload: T;
}

/* ---- PRODUCER (Singleton, lazy-connect) ---- */

let producerInstance: Producer | null = null;

export const getKafkaProducer = async (): Promise<Producer> => {
  if (!producerInstance) {
    producerInstance = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
    await producerInstance.connect();
    logger.info("Kafka producer connected");
  }
  return producerInstance;
};

export const disconnectKafkaProducer = async (): Promise<void> => {
  if (producerInstance) {
    await producerInstance.disconnect();
    producerInstance = null;
    logger.info("Kafka producer disconnected");
  }
};

/* ---- CONSUMER FACTORY ---- */

export const createKafkaConsumer = (groupId: string): Consumer => {
  return kafka.consumer({
    groupId,
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });
};

/* ---- PUBLISH HELPER ---- */

export const publishEvent = async <T>(
  topic: KafkaTopic,
  event: CloudEvent<T>
): Promise<void> => {
  const producer = await getKafkaProducer();

  await producer.send({
    topic,
    messages: [
      {
        key: event.eventId,
        value: JSON.stringify(event),
        headers: {
          "ce-type": event.type,
          "ce-source": event.source,
          "ce-id": event.eventId,
          "ce-traceid": event.traceId,
        },
      },
    ],
  });

  logger.info(
    { topic, eventId: event.eventId, type: event.type, traceId: event.traceId },
    "Kafka event published"
  );
};

export default kafka;
