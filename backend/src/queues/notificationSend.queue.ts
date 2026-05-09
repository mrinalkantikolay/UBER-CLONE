import { Queue, Worker, Job } from "bullmq";
import { ioRedisConnection } from "../config/bullmq";
import { redisClient } from "../config/redis";
import logger from "../config/logger";

import notificationModel from "../models/notification.model";
import {
  sendEmailNotification,
  sendSMSNotification,
  sendPushNotification,
} from "../utils/notificationProvider";

/* ======================================================
   NOTIFICATION SEND QUEUE
   
   BullMQ priority queue for reliable multi-channel delivery.
   
   Priority mapping (lower = processed first):
   - HIGH: 1 (PAYMENT_FAILED, MATCH_FAILED)
   - MEDIUM: 5 (RIDE_COMPLETED receipts)
   - LOW: 10 (promotional, non-critical)
   
   5 retries with exponential backoff.
   Failed jobs after max retries → logged for manual inspection.
====================================================== */

export type NotificationSendJobData = {
  notificationId: string;
  userId: string;
  type: "EMAIL" | "SMS" | "PUSH";
  title: string;
  message: string;
  email?: string;
  phone?: string;
  traceId: string;
};

/* ---- Priority Constants ---- */

export const NOTIFICATION_PRIORITY = {
  HIGH: 1,
  MEDIUM: 5,
  LOW: 10,
} as const;

/* ---- Queue ---- */

export const notificationSendQueue = new Queue<NotificationSendJobData>(
  "notification-send",
  {
    connection: ioRedisConnection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 2000, // 2s → 4s → 8s → 16s → 32s
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  }
);

/* ---- Worker ---- */

export const notificationSendWorker = new Worker<NotificationSendJobData>(
  "notification-send",
  async (job: Job<NotificationSendJobData>) => {
    const { notificationId, userId, type, title, message, email, phone, traceId } = job.data;

    logger.info(
      { jobId: job.id, notificationId, type, userId, attempt: job.attemptsMade + 1, traceId },
      `Sending ${type} notification`
    );

    /* ---- Dispatch to the correct provider ---- */
    switch (type) {
      case "EMAIL":
        if (!email) throw new Error("Email address required for EMAIL notification");
        await sendEmailNotification({
          to: email,
          subject: title,
          text: message,
          html: `<p>${message}</p>`,
        });
        break;

      case "SMS":
        if (!phone) throw new Error("Phone number required for SMS notification");
        await sendSMSNotification({
          to: phone,
          message: `${title}: ${message}`,
        });
        break;

      case "PUSH":
        await sendPushNotification({
          userId,
          title,
          body: message,
        });
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    /* ---- Update DB status: QUEUED → SENT ---- */
    await notificationModel.updateStatus(notificationId, "SENT");

    /* ---- Increment Redis unread counter ---- */
    if (redisClient.isReady) {
      try {
        const key = `notification:unread:${userId}`;
        await redisClient.incr(key);
        await redisClient.expire(key, 86400); // 24h TTL
      } catch (err) {
        logger.warn({ err, userId, traceId }, "Failed to increment unread counter");
      }
    }

    logger.info(
      { jobId: job.id, notificationId, type, traceId },
      `${type} notification sent successfully`
    );
  },
  {
    connection: ioRedisConnection,
    concurrency: 10,
  }
);

/* ---- Event Listeners ---- */

notificationSendWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id, type: job.data.type }, "Notification send job completed");
});

notificationSendWorker.on("failed", (job, err) => {
  if (job && job.attemptsMade >= (job.opts.attempts ?? 5)) {
    /* Max retries exceeded — mark as FAILED in DB */
    notificationModel.updateStatus(job.data.notificationId, "FAILED").catch(() => {});
    logger.error(
      { jobId: job.id, notificationId: job.data.notificationId, type: job.data.type, err },
      "Notification PERMANENTLY failed — max retries exceeded"
    );
  } else {
    logger.warn(
      { jobId: job?.id, err, attempts: job?.attemptsMade },
      "Notification send job failed — will retry"
    );
  }
});
