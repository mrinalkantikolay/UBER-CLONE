import app from "./app";
import env from "./config/env";
import logger from "./config/logger";
import prisma from "./config/prisma";
import { connectRedis, shutdownRedis } from "./config/redis";
import { shutdownIORedis } from "./config/bullmq";
import { startCleanupJobs } from "./jobs/cleanup.job";
import { disconnectKafkaProducer } from "./config/kafka";
import { startRideConsumer, stopRideConsumer } from "./events/rideConsumer";
import { startMatchingConsumer, stopMatchingConsumer } from "./events/matchingConsumer";
import { startPaymentConsumer, stopPaymentConsumer } from "./events/paymentConsumer";
import { startNotificationConsumer, stopNotificationConsumer } from "./events/notificationConsumer";
import { startAnalyticsConsumer, stopAnalyticsConsumer } from "./events/analyticsConsumer";

/* Import workers so they start processing */
import { notificationWorker } from "./queues/notification.queue";
import { ocrWorker } from "./queues/ocr.queue";
import { rideNotificationWorker } from "./queues/rideNotification.queue";
import { matchingTimeoutWorker } from "./queues/matchingTimeout.queue";
import { paymentRefundWorker } from "./queues/paymentRefund.queue";
import { receiptGenerationWorker } from "./queues/receiptGeneration.queue";
import { notificationSendWorker } from "./queues/notificationSend.queue";
import { analyticsWorker, registerAnalyticsJobs } from "./queues/analytics.queue";
import { adminFraudWorker, registerAdminJobs } from "./queues/adminFraud.queue";
import { outboxRelayWorker, registerOutboxRelayJob } from "./queues/outboxRelay.queue";
/* matching.service.ts registers its timeout processor on import */
import "./services/matching.service";

let server: ReturnType<typeof app.listen>;

const startServer = async () => {
  try {
    /* ---------------- Database ---------------- */

    await prisma.$connect();
    logger.info("PostgreSQL connected (Prisma)");

    /* ---------------- Redis ---------------- */

    await connectRedis();
    // start background maintenance jobs (non-blocking)
    try { startCleanupJobs(); } catch (err) { logger.error({ err }, "Failed to start cleanup jobs"); }

    /* ---------------- Kafka Consumer ---------------- */

    try {
      await startRideConsumer();
    } catch (err) {
      logger.warn({ err }, "Kafka ride consumer failed to start — SAGA events will not be processed. Is Kafka running?");
    }

    try {
      await startMatchingConsumer();
    } catch (err) {
      logger.warn({ err }, "Kafka matching consumer failed to start — driver matching will not be processed.");
    }

    try {
      await startPaymentConsumer();
    } catch (err) {
      logger.warn({ err }, "Kafka payment consumer failed to start — auto-payments will not be processed.");
    }

    try {
      await startNotificationConsumer();
    } catch (err) {
      logger.warn({ err }, "Kafka notification consumer failed to start — event-driven notifications disabled.");
    }

    try {
      await startAnalyticsConsumer();
    } catch (err) {
      logger.warn({ err }, "Kafka analytics consumer failed to start.");
    }

    /* ---------------- Register BullMQ Repeatable Jobs ---------------- */
    try {
      await registerAnalyticsJobs();
    } catch(err) {
      logger.warn({ err }, "Analytics jobs failed to register.");
    }

    try {
      await registerAdminJobs();
    } catch(err) {
      logger.warn({ err }, "Admin jobs failed to register.");
    }

    try {
      await registerOutboxRelayJob();
    } catch(err) {
      logger.warn({ err }, "Outbox relay job failed to register.");
    }

    /* ---------------- Start Server ---------------- */

    server = app.listen(env.PORT, () => {
      logger.info(`${env.SERVICE_NAME} running on port ${env.PORT}`);
    });

  } catch (error) {

    logger.error({ err: error }, "Server startup failed");
    process.exit(1);

  }
};

startServer();

/* =========================
   Graceful Shutdown
========================= */

const shutdown = async (signal: string) => {

  logger.info(`Received ${signal} — shutting down gracefully...`);

  try {

    /* 1. Stop accepting new HTTP connections */
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
      logger.info("HTTP server closed");
    }

    /* 2. Close Kafka consumer + producer */
    try {
      await stopRideConsumer();
    } catch (err) {
      logger.error({ err }, "Kafka ride consumer close error");
    }

    try {
      await stopMatchingConsumer();
    } catch (err) {
      logger.error({ err }, "Kafka matching consumer close error");
    }

    try {
      await stopPaymentConsumer();
    } catch (err) {
      logger.error({ err }, "Kafka payment consumer close error");
    }

    try {
      await stopNotificationConsumer();
    } catch (err) {
      logger.error({ err }, "Kafka notification consumer close error");
    }

    try {
      await stopAnalyticsConsumer();
    } catch (err) {
      logger.error({ err }, "Kafka analytics consumer close error");
    }

    try {
      await disconnectKafkaProducer();
    } catch (err) {
      logger.error({ err }, "Kafka producer close error");
    }

    /* 3. Close BullMQ workers (drain in-flight jobs) */
    try {
      await notificationWorker.close();
      logger.info("Notification worker closed");
    } catch (err) {
      logger.error({ err }, "Notification worker close error");
    }

    try {
      await ocrWorker.close();
      logger.info("OCR worker closed");
    } catch (err) {
      logger.error({ err }, "OCR worker close error");
    }

    try {
      await rideNotificationWorker.close();
      logger.info("Ride notification worker closed");
    } catch (err) {
      logger.error({ err }, "Ride notification worker close error");
    }

    try {
      await matchingTimeoutWorker.close();
      logger.info("Matching timeout worker closed");
    } catch (err) {
      logger.error({ err }, "Matching timeout worker close error");
    }

    try {
      await paymentRefundWorker.close();
      logger.info("Payment refund worker closed");
    } catch (err) {
      logger.error({ err }, "Payment refund worker close error");
    }

    try {
      await receiptGenerationWorker.close();
      logger.info("Receipt generation worker closed");
    } catch (err) {
      logger.error({ err }, "Receipt generation worker close error");
    }

    try {
      await notificationSendWorker.close();
      logger.info("Notification send worker closed");
    } catch (err) {
      logger.error({ err }, "Notification send worker close error");
    }

    try {
      await analyticsWorker.close();
      logger.info("Analytics worker closed");
    } catch (err) {
      logger.error({ err }, "Analytics worker close error");
    }

    try {
      await adminFraudWorker.close();
      logger.info("Admin fraud worker closed");
    } catch (err) {
      logger.error({ err }, "Admin fraud worker close error");
    }

    try {
      await outboxRelayWorker.close();
      logger.info("Outbox relay worker closed");
    } catch (err) {
      logger.error({ err }, "Outbox relay worker close error");
    }

    /* 4. Disconnect Prisma */
    await prisma.$disconnect();
    logger.info("Prisma disconnected");

    /* 5. Close Redis connections (node-redis + ioredis) */
    await shutdownRedis();
    await shutdownIORedis();

    logger.info("Shutdown complete");

  } catch (error) {

    logger.error({ err: error }, "Shutdown error");

  }

  process.exit(0);
};

/* CTRL + C */
process.on("SIGINT", () => shutdown("SIGINT"));

/* Docker / Kubernetes */
process.on("SIGTERM", () => shutdown("SIGTERM"));

/* =========================
   Unhandled Errors
========================= */

process.on("unhandledRejection", (reason: unknown) => {
  logger.error({ err: reason }, "Unhandled Promise Rejection");
});

process.on("uncaughtException", (error: Error) => {
  logger.fatal({ err: error }, "Uncaught Exception — shutting down");
  process.exit(1);
});