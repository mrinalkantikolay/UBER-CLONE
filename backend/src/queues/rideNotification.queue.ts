import { Queue, Worker, Job } from "bullmq";
import { ioRedisConnection } from "../config/bullmq";
import logger from "../config/logger";

/* ======================================================
   RIDE NOTIFICATION QUEUE
   
   Handles async delivery of ride lifecycle notifications.
   Job types: RIDE_ACCEPTED, MATCH_FAILED, RIDE_COMPLETED, PAYMENT_FAILED.
   
   5 retries with exponential backoff per MVP mandate.
   In production, integrate with FCM/APNs push notification service.
====================================================== */

type RideNotificationJobData = {
  type: "RIDE_ACCEPTED" | "MATCH_FAILED" | "RIDE_COMPLETED" | "PAYMENT_FAILED";
  userId: string;
  rideId: string;
  driverId?: string;
  traceId: string;
};

/* ---- Queue ---- */

export const rideNotificationQueue = new Queue<RideNotificationJobData>(
  "ride-notification",
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

export const rideNotificationWorker = new Worker<RideNotificationJobData>(
  "ride-notification",
  async (job: Job<RideNotificationJobData>) => {
    const { type, userId, rideId, driverId, traceId } = job.data;

    logger.info(
      { jobId: job.id, type, userId, rideId, traceId, attempt: job.attemptsMade + 1 },
      `Processing ride notification: ${type}`
    );

    /*
     * TODO: Replace with actual push notification delivery:
     *
     * switch (type) {
     *   case "RIDE_ACCEPTED":
     *     await fcm.send(userId, {
     *       title: "Driver is on the way!",
     *       body: `Your driver ${driverName} is heading to your pickup point.`,
     *     });
     *     break;
     *   case "MATCH_FAILED":
     *     await fcm.send(userId, {
     *       title: "No drivers available",
     *       body: "We couldn't find a driver near you. Please try again.",
     *     });
     *     break;
     *   case "RIDE_COMPLETED":
     *     await fcm.send(userId, {
     *       title: "Ride completed!",
     *       body: "Thank you for riding. Rate your driver.",
     *     });
     *     break;
     *   case "PAYMENT_FAILED":
     *     await fcm.send(userId, {
     *       title: "Payment failed",
     *       body: "Please update your payment method and try again.",
     *     });
     *     break;
     * }
     *
     * For now, log the notification as delivered.
     */

    logger.info(
      { jobId: job.id, type, userId, rideId, traceId },
      `Ride notification delivered: ${type} (stub)`
    );
  },
  {
    connection: ioRedisConnection,
    concurrency: 5,
  }
);

/* ---- Event Listeners ---- */

rideNotificationWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "Ride notification job completed");
});

rideNotificationWorker.on("failed", (job, err) => {
  logger.error(
    { jobId: job?.id, err, attempts: job?.attemptsMade },
    "Ride notification job failed"
  );
});
