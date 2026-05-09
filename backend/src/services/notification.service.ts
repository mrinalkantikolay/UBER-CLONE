import crypto from "crypto";

import logger from "../config/logger";
import { redisClient } from "../config/redis";
import ApiError from "../utils/ApiError";

import notificationModel from "../models/notification.model";
import {
  notificationSendQueue,
  NOTIFICATION_PRIORITY,
  NotificationSendJobData,
} from "../queues/notificationSend.queue";

/* ======================================================
   NOTIFICATION SERVICE — CORE ENGINE
   
   Functions:
   1. queueNotification — Create DB record + add to BullMQ
   2. handleKafkaEvent — Process SAGA events into notifications
   3. getUnreadCount — Redis-cached unread count
   4. markAsRead — Mark + decrement Redis counter
   5. getHistory — Cursor-based pagination
   6. getPreferences / updatePreferences — User channel prefs
====================================================== */

/* ======================================================
   REDIS KEYS
====================================================== */

const Keys = {
  unread: (userId: string) => `notification:unread:${userId}`,
  idempotency: (eventId: string) => `idempotency:notification:${eventId}`,
  rateLimit: (userId: string) => `rate:notification:${userId}`,
};

/* ======================================================
   HELPERS
====================================================== */

const ensureTraceId = (traceId?: string): string =>
  traceId ?? crypto.randomUUID();

/* ======================================================
   1. QUEUE NOTIFICATION
   
   Creates a DB record (QUEUED) and adds a BullMQ job.
   Respects user preferences — skips opted-out channels.
====================================================== */

export const queueNotification = async (
  userId: string,
  type: "EMAIL" | "SMS" | "PUSH",
  title: string,
  message: string,
  priority: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM",
  traceId?: string,
  email?: string,
  phone?: string
): Promise<void> => {
  const tid = ensureTraceId(traceId);

  /* ---- Check user preferences ---- */
  const prefs = await notificationModel.getPreferences(userId);
  if (prefs) {
    const channelKey = type.toLowerCase() as "email" | "sms" | "push";
    if (prefs[channelKey] === false) {
      logger.info({ userId, type, traceId: tid }, "User opted out of this channel — skipping");
      return;
    }
  }

  /* ---- Rate limit: max 60 notifications per minute per user ---- */
  if (redisClient.isReady) {
    const rlKey = Keys.rateLimit(userId);
    const count = await redisClient.incr(rlKey);
    if (count === 1) await redisClient.expire(rlKey, 60);
    if (count > 60) {
      logger.warn({ userId, count, traceId: tid }, "Notification rate limit exceeded — dropping");
      return;
    }
  }

  /* ---- Create DB record (QUEUED) ---- */
  const notification = await notificationModel.create({
    userId,
    type,
    title,
    message,
    status: "QUEUED",
    priority,
  });

  /* ---- Add to BullMQ with priority ---- */
  const jobData: NotificationSendJobData = {
    notificationId: notification.id,
    userId,
    type,
    title,
    message,
    email,
    phone,
    traceId: tid,
  };

  const priorityValue = NOTIFICATION_PRIORITY[priority];

  await notificationSendQueue.add(
    `notify:${notification.id}`,
    jobData,
    { priority: priorityValue }
  );

  logger.info(
    { notificationId: notification.id, userId, type, priority, traceId: tid },
    "Notification queued for delivery"
  );
};

/* ======================================================
   2. HANDLE KAFKA EVENTS — SAGA Integration
   
   Maps domain events to notifications:
   - MATCH_FAILED → Push (HIGH) to rider
   - PAYMENT_FAILED → Push + Email (HIGH) to rider
   - RIDE_COMPLETED → Email (MEDIUM) receipt to rider
====================================================== */

export const handleSagaEvent = async (
  eventType: string,
  payload: Record<string, unknown>,
  traceId: string
): Promise<void> => {
  const userId = payload.userId as string;
  if (!userId) {
    logger.warn({ eventType, traceId }, "No userId in SAGA payload — skipping notification");
    return;
  }

  switch (eventType) {
    case "match.failed": {
      const rideId = payload.rideId as string;
      await queueNotification(
        userId,
        "PUSH",
        "No drivers available",
        `We couldn't find a driver for your ride. Please try again in a few minutes.`,
        "HIGH",
        traceId
      );
      logger.info({ rideId, userId, traceId }, "MATCH_FAILED notification queued");
      break;
    }

    case "payment.failed": {
      const rideId = payload.rideId as string;
      /* Push notification (high priority) */
      await queueNotification(
        userId,
        "PUSH",
        "Payment failed",
        `Payment for your ride could not be processed. Please update your payment method.`,
        "HIGH",
        traceId
      );
      /* Also queue email for payment failures */
      await queueNotification(
        userId,
        "EMAIL",
        "Payment failed — action required",
        `Your ride payment could not be processed. Please update your payment method or contact support.`,
        "HIGH",
        traceId,
        payload.email as string | undefined
      );
      logger.info({ rideId, userId, traceId }, "PAYMENT_FAILED notifications queued");
      break;
    }

    case "ride.completed": {
      const rideId = payload.rideId as string;
      const fare = payload.fare as number;
      await queueNotification(
        userId,
        "EMAIL",
        "Ride completed — receipt",
        `Your ride has been completed. Fare: ₹${fare?.toFixed(2) ?? "N/A"}. Thank you for riding with us!`,
        "MEDIUM",
        traceId,
        payload.email as string | undefined
      );
      logger.info({ rideId, userId, fare, traceId }, "RIDE_COMPLETED receipt notification queued");
      break;
    }

    default:
      logger.warn({ eventType, traceId }, "Unknown SAGA event type for notification");
  }
};

/* ======================================================
   3. GET UNREAD COUNT — Redis cached
====================================================== */

export const getUnreadCount = async (userId: string): Promise<number> => {
  /* Try Redis first */
  if (redisClient.isReady) {
    const cached = await redisClient.get(Keys.unread(userId));
    if (cached !== null) return parseInt(cached, 10);
  }

  /* Fallback to DB */
  const count = await notificationModel.getUnreadCount(userId);

  /* Cache the result */
  if (redisClient.isReady) {
    await redisClient.setEx(Keys.unread(userId), 86400, String(count));
  }

  return count;
};

/* ======================================================
   4. MARK AS READ
====================================================== */

export const markAsRead = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  const notification = await notificationModel.markAsRead(notificationId, userId);
  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  /* Decrement Redis unread counter */
  if (redisClient.isReady) {
    const key = Keys.unread(userId);
    const current = await redisClient.get(key);
    if (current && parseInt(current, 10) > 0) {
      await redisClient.decr(key);
    }
  }
};

/* ======================================================
   5. GET HISTORY — Cursor-based pagination
====================================================== */

export const getHistory = async (
  userId: string,
  limit: number = 20,
  cursor?: string
) => {
  const notifications = await notificationModel.findByUserId(userId, limit, cursor);
  return {
    notifications,
    nextCursor: notifications.length === limit ? notifications[notifications.length - 1].id : null,
    hasMore: notifications.length === limit,
  };
};

/* ======================================================
   6. PREFERENCES
====================================================== */

export const getPreferences = async (userId: string) => {
  const prefs = await notificationModel.getPreferences(userId);
  if (!prefs) {
    /* Create defaults on first access */
    return notificationModel.upsertPreferences(userId, {});
  }
  return prefs;
};

export const updatePreferences = async (
  userId: string,
  data: { email?: boolean; sms?: boolean; push?: boolean }
) => {
  return notificationModel.upsertPreferences(userId, data);
};
