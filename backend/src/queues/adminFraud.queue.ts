import { Queue, Worker, Job } from "bullmq";
import { ioRedisConnection } from "../config/bullmq";
import logger from "../config/logger";
import adminModel from "../models/admin.model";

/* ======================================================
   ADMIN FRAUD DETECTION QUEUE
====================================================== */

export const adminFraudQueue = new Queue("admin-fraud-queue", {
  connection: ioRedisConnection,
});

/* ---- Worker ---- */

export const adminFraudWorker = new Worker(
  "admin-fraud-queue",
  async (job: Job) => {
    logger.info({ jobName: job.name }, "Running recurring fraud detection job");

    // Stub for MVP: A fully implemented fraud detector would scan
    // rapid cancellation counts, failed payments, etc.
    // e.g. finding users with 5+ cancellations in past hour.
    const mockFraudFound = false;

    if (mockFraudFound) {
      const suspiciousUserId = "some-user-uuid";
      
      // Auto-block the user or just raise an alert via AuditLog
      await adminModel.createAuditLog({
        adminId: "SYSTEM",
        action: "FRAUD_ALERT",
        entity: "User",
        entityId: suspiciousUserId,
        traceId: `fraud-scan-${Date.now()}`,
        metadata: { reason: "High cancellation rate detected automatically" },
      });

      logger.warn({ userId: suspiciousUserId }, "Fraud detection alert generated");
    }
  },
  {
    connection: ioRedisConnection,
    concurrency: 1,
  }
);

/* ---- Setup repeatable jobs ---- */
export const registerAdminJobs = async () => {
  // Fraud detection every hour
  await adminFraudQueue.add("fraud-scan", {}, {
    repeat: {
      pattern: "0 * * * *", // Every top of the hour
    },
  });

  logger.info("Admin jobs registered");
};
