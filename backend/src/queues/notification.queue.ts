import { Queue, Worker, Job } from "bullmq";
import { ioRedisConnection } from "../config/bullmq";
import logger from "../config/logger";

import { sendEmail } from "../utils/emailProvider";
import { sendSMS } from "../utils/smsProvider";

/* ======================================================
   NOTIFICATION QUEUE
   Handles async delivery of OTPs via SMS/Email.
   3 retries with exponential backoff (2s, 4s, 8s).
====================================================== */

type NotificationJobData = {
  userId: string;
  email: string;
  phone: string | null;
  otp: string;
  traceId: string;
};

/* ---- Queue ---- */

export const notificationQueue = new Queue<NotificationJobData>(
  "notification-queue",
  {
    connection: ioRedisConnection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 2000, // 2s → 4s → 8s
      },
      removeOnComplete: 100,  // Keep last 100 completed jobs
      removeOnFail: 200,      // Keep last 200 failed jobs for debugging
    },
  }
);

/* ---- Worker ---- */

export const notificationWorker = new Worker<NotificationJobData>(
  "notification-queue",
  async (job: Job<NotificationJobData>) => {
    const { email, phone, otp, traceId } = job.data;

    logger.info(
      { jobId: job.id, email, traceId, attempt: job.attemptsMade + 1 },
      "Processing OTP notification job"
    );

    let delivered = false;

    /* Try SMS first */
    if (phone) {
      try {
        await sendSMS({
          to: phone,
          message: `Your verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
        });
        delivered = true;
        logger.info({ traceId, channel: "sms", jobId: job.id }, "OTP delivered via SMS (BullMQ)");
      } catch (err) {
        logger.error(
          { err, traceId, channel: "sms", jobId: job.id },
          "SMS OTP delivery failed — attempting email fallback"
        );
      }
    }

    /* Fallback to email */
    if (!delivered) {
      try {
        await sendEmail({
          to: email,
          subject: "Your verification code",
          text: `Your verification code is: ${otp}\n\nValid for 5 minutes. Do not share this code.`,
          html: `<p>Your verification code is: <strong>${otp}</strong></p><p>Valid for 5 minutes. Do not share this code.</p>`,
        });
        logger.info({ traceId, channel: "email", jobId: job.id }, "OTP delivered via email (BullMQ)");
      } catch (err) {
        logger.error(
          { err, traceId, channel: "email", jobId: job.id },
          "Email OTP delivery also failed — BullMQ will retry"
        );
        throw err; // Re-throw so BullMQ retries
      }
    }
  },
  {
    connection: ioRedisConnection,
    concurrency: 5, // Process up to 5 notifications in parallel
  }
);

/* ---- Event Listeners ---- */

notificationWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "Notification job completed");
});

notificationWorker.on("failed", (job, err) => {
  logger.error(
    { jobId: job?.id, err, attempts: job?.attemptsMade },
    "Notification job failed"
  );
});
