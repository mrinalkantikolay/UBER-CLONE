import crypto from "crypto";

import logger from "../config/logger";
import { redisClient } from "../config/redis";
import prisma from "../config/prisma";
import { KafkaTopics } from "../config/kafka";
import ApiError from "../utils/ApiError";
import auditLogger from "../utils/auditLogger";
import { buildCloudEvent, insertOutboxEvent } from "../utils/outbox";

import rideModel from "../models/ride.model";
import driverModel from "../models/driver.model";
import { rideNotificationQueue } from "../queues/rideNotification.queue";
import metrics from "../metrics";

/* ======================================================
   TYPES
====================================================== */

type CreateRideInput = {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  idempotencyKey: string;
  surgeMultiplier: number;
};

type CancelRideInput = {
  rideId: string;
};

type RateRideInput = {
  rideId: string;
  rating: number;
  comment?: string;
};

/* ======================================================
   CONSTANTS
====================================================== */

const BASE_RATE_PER_KM = 12; // ₹12/km base rate
const MINIMUM_FARE = 50;     // ₹50 minimum fare
const CANCELLATION_FREE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const CANCELLATION_FEE = 50; // ₹50 cancellation fee

/* ======================================================
   REDIS KEYS (per MVP)
====================================================== */

const Keys = {
  activeRide: (userId: string) => `rider:${userId}:activeRide`,
  idempotency: (userId: string, key: string) => `idempotency:ride:${userId}:${key}`,
  rateIdempotency: (rideId: string) => `idempotency:rate:${rideId}`,
};

/* ======================================================
   HELPERS
====================================================== */

const ensureTraceId = (traceId?: string): string =>
  traceId ?? crypto.randomUUID();

const safeAudit = (
  event: string,
  payload: Record<string, unknown>,
  traceId: string
): void => {
  try {
    auditLogger(event, { ...payload, traceId });
  } catch (err) {
    logger.error({ err, event, traceId }, "AUDIT LOG FAILED");
  }
};

/* ======================================================
   HAVERSINE — O(1) pure math
   Calculates great-circle distance between two points.
====================================================== */

const EARTH_RADIUS_KM = 6371;
const toRadians = (deg: number): number => (deg * Math.PI) / 180;

const haversineDistance = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

/**
 * Calculate fare using Haversine distance × road factor × base rate × surge.
 * O(1) — pure computation.
 */
const calculateFare = (
  originLat: number, originLng: number,
  destLat: number, destLng: number,
  surgeMultiplier: number
): number => {
  const straightLine = haversineDistance(originLat, originLng, destLat, destLng);
  const roadDistance = straightLine * 1.4; // urban road factor
  const rawFare = roadDistance * BASE_RATE_PER_KM * surgeMultiplier;
  return Math.max(MINIMUM_FARE, Math.round(rawFare * 100) / 100);
};

/* ======================================================
   1. CREATE RIDE REQUEST
   O(1) Redis SET NX + O(1) DB insert + O(1) Kafka produce

   Atomic idempotency via Redis SET NX:
   - If key exists → return the existing ride (duplicate request)
   - If key doesn't exist → create new ride
   
   Also checks for an active ride — a user can only have
   one active ride at a time.
====================================================== */

export const createRide = async (
  userId: string,
  input: CreateRideInput,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  if (!redisClient.isReady) {
    throw new ApiError(503, "Ride service temporarily unavailable");
  }

  /* ---- Idempotency check — O(1) ---- */
  const idempKey = Keys.idempotency(userId, input.idempotencyKey);
  const setResult = await redisClient.set(idempKey, "1", {
    NX: true,
    EX: 60,
  });

  if (!setResult) {
    /* Key already exists — return existing ride */
    const existing = await rideModel.findByIdempotencyKey(
      `${userId}:${input.idempotencyKey}`
    );
    if (existing) {
      logger.info({ rideId: existing.id, traceId: tid }, "Idempotent ride request — returning existing");
      return existing;
    }
    throw new ApiError(409, "Duplicate ride request. Please wait.");
  }

  /* ---- Check no active ride ---- */
  const activeRide = await rideModel.findActiveRideByUserId(userId);
  if (activeRide) {
    throw new ApiError(409, "You already have an active ride", [activeRide.id]);
  }

  /* ---- Calculate fare — O(1) ---- */
  const fare = calculateFare(
    input.originLat, input.originLng,
    input.destLat, input.destLng,
    input.surgeMultiplier
  );

  /* ---- Transactional Outbox: DB save + event insert — O(1) ---- */
  const ride = await prisma.$transaction(async (tx) => {
    const r = await tx.ride.create({
      data: {
        userId,
        originLat: input.originLat,
        originLng: input.originLng,
        destLat: input.destLat,
        destLng: input.destLng,
        fare,
        surgeMultiplier: input.surgeMultiplier,
        idempotencyKey: `${userId}:${input.idempotencyKey}`,
      },
    });

    await insertOutboxEvent(tx, KafkaTopics.RIDE_REQUESTED, buildCloudEvent(
      "ride.requested",
      {
        rideId: r.id,
        userId: r.userId,
        originLat: r.originLat,
        originLng: r.originLng,
        destLat: r.destLat,
        destLng: r.destLng,
        fare: r.fare,
        surgeMultiplier: r.surgeMultiplier,
      },
      tid
    ));

    return r;
  });

  /* ---- Cache active ride — O(1) ---- */
  await redisClient.setEx(Keys.activeRide(userId), 86400, ride.id);

  metrics.rideCreated.inc();
  safeAudit("ride:created", { rideId: ride.id, userId, fare }, tid);

  logger.info({ rideId: ride.id, userId, fare, traceId: tid }, "Ride created (outbox event queued)");
  return ride;
};

/* ======================================================
   2. CANCEL RIDE
   O(1) Redis + O(1) DB atomic update + O(1) Kafka produce

   Cancellation fee logic:
   - If ride is REQUESTED → no fee (driver not assigned yet)
   - If ride is ACCEPTED and < 5 min since accepted → no fee
   - If ride is ACCEPTED and > 5 min since accepted → ₹50 fee
====================================================== */

export const cancelRide = async (
  userId: string,
  input: CancelRideInput,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const ride = await rideModel.findById(input.rideId);
  if (!ride) throw new ApiError(404, "Ride not found");
  if (ride.userId !== userId) throw new ApiError(403, "Not your ride");

  if (!["REQUESTED", "ACCEPTED"].includes(ride.status)) {
    throw new ApiError(400, `Cannot cancel ride in ${ride.status} status`);
  }

  /* ---- Calculate cancellation fee — O(1) ---- */
  let cancellationFee = 0;

  if (ride.status === "ACCEPTED" && ride.acceptedAt) {
    const timeSinceAccepted = Date.now() - ride.acceptedAt.getTime();
    if (timeSinceAccepted > CANCELLATION_FREE_WINDOW_MS) {
      cancellationFee = CANCELLATION_FEE;
    }
  }

  /* ---- Transactional Outbox: DB update + event insert ---- */
  const updated = await prisma.$transaction(async (tx) => {
    /* Atomic DB update with WHERE guard */
    const statusFilter = ["REQUESTED", "ACCEPTED"] as const;
    let u;
    try {
      u = await tx.ride.update({
        where: {
          id: ride.id,
          status: { in: [...statusFilter] },
        },
        data: {
          status: "CANCELLED",
          cancellationFee,
        },
      });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2025") {
        return null;
      }
      throw err;
    }

    await insertOutboxEvent(tx, KafkaTopics.RIDE_CANCELLED, buildCloudEvent(
      "ride.cancelled",
      {
        rideId: ride.id,
        userId: ride.userId,
        driverId: ride.driverId,
        cancellationFee,
        previousStatus: ride.status,
      },
      tid
    ));

    return u;
  });

  if (!updated) {
    throw new ApiError(409, "Ride status changed — cannot cancel");
  }

  /* ---- Clear active ride cache ---- */
  try {
    await redisClient.del(Keys.activeRide(userId));
  } catch {}

  metrics.rideCancelled.inc();
  safeAudit("ride:cancelled", { rideId: ride.id, userId, cancellationFee }, tid);

  logger.info({ rideId: ride.id, userId, cancellationFee, traceId: tid }, "Ride cancelled (outbox event queued)");
  return updated;
};

/* ======================================================
   3. COMPLETE RIDE
   O(1) atomic DB update + O(1) Kafka produce

   Only IN_PROGRESS → COMPLETED_UNPAID is valid.
   Called by the driver (or system) when the ride ends.
====================================================== */

export const completeRide = async (
  userId: string,
  rideId: string,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const ride = await rideModel.findById(rideId);
  if (!ride) throw new ApiError(404, "Ride not found");

  /* ---- Authorization check ----
   * Rider: compare ride.userId === userId directly.
   * Driver: look up Driver record by userId first, then compare
   *         ride.driverId === driver.id (Driver PK ≠ User PK). */
  let isAuthorized = ride.userId === userId;

  if (!isAuthorized) {
    const driver = await driverModel.findByUserId(userId);
    if (driver && ride.driverId === driver.id) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    throw new ApiError(403, "Not authorized to complete this ride");
  }

  /* ---- Transactional Outbox: DB update + event insert ---- */
  const updated = await prisma.$transaction(async (tx) => {
    let u;
    try {
      u = await tx.ride.update({
        where: {
          id: rideId,
          status: "IN_PROGRESS",
        },
        data: {
          status: "COMPLETED_UNPAID",
          completedAt: new Date(),
        },
      });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2025") {
        return null;
      }
      throw err;
    }

    await insertOutboxEvent(tx, KafkaTopics.RIDE_COMPLETED, buildCloudEvent(
      "ride.completed",
      {
        rideId: u.id,
        userId: u.userId,
        driverId: u.driverId,
        fare: u.fare,
      },
      tid
    ));

    return u;
  });

  if (!updated) {
    throw new ApiError(409, "Ride is not in progress");
  }

  /* Clear active ride cache */
  try {
    await redisClient.del(Keys.activeRide(ride.userId));
  } catch {}

  metrics.rideCompleted.inc();
  safeAudit("ride:completed", { rideId, userId: ride.userId }, tid);

  logger.info({ rideId, traceId: tid }, "Ride completed (outbox event queued)");
  return updated;
};

/* ======================================================
   4. GET ACTIVE RIDE
   O(1) Redis GET → O(1) DB fallback

   Hot path — checks Redis first for the cached ride ID,
   then loads full ride from DB if found.
====================================================== */

export const getActiveRide = async (
  userId: string,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  /* Try Redis cache first — O(1) */
  if (redisClient.isReady) {
    const cachedRideId = await redisClient.get(Keys.activeRide(userId));
    if (cachedRideId) {
      const ride = await rideModel.findByIdWithRelations(cachedRideId);
      if (ride && ["REQUESTED", "ACCEPTED", "IN_PROGRESS"].includes(ride.status)) {
        return ride;
      }
      /* Stale cache — clear it */
      await redisClient.del(Keys.activeRide(userId));
    }
  }

  /* Fallback to DB — O(log N) compound index [userId, status] */
  const ride = await rideModel.findActiveRideByUserId(userId);
  if (!ride) return null;

  /* Populate cache for next hit */
  if (redisClient.isReady) {
    try {
      await redisClient.setEx(Keys.activeRide(userId), 86400, ride.id);
    } catch {}
  }

  return rideModel.findByIdWithRelations(ride.id);
};

/* ======================================================
   5. GET RIDE HISTORY
   O(log N) cursor-based pagination using UUID id

   Uses Prisma cursor pagination — skip 1 + cursor.
   Client sends the last ride's `id` as cursor to get
   the next page.
====================================================== */

export const getRideHistory = async (
  userId: string,
  limit: number = 10,
  cursor?: string,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const rides = await rideModel.findByUserId(userId, limit, cursor);

  logger.debug(
    { userId, limit, cursor, found: rides.length, traceId: tid },
    "Ride history fetched"
  );

  return {
    rides,
    nextCursor: rides.length === limit ? rides[rides.length - 1].id : null,
    hasMore: rides.length === limit,
  };
};

/* ======================================================
   6. RATE RIDE
   O(1) Redis SET NX (idempotency) + O(1) DB insert

   Can only rate completed rides (COMPLETED_UNPAID or COMPLETED_PAID).
   One rating per ride — enforced by unique constraint on rideId
   AND Redis SET NX for fast-path dedup.
====================================================== */

export const rateRide = async (
  userId: string,
  input: RateRideInput,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  /* ---- Idempotency fast-check via Redis — O(1) ---- */
  if (redisClient.isReady) {
    const idempKey = Keys.rateIdempotency(input.rideId);
    const setResult = await redisClient.set(idempKey, "1", {
      NX: true,
      EX: 86400,
    });
    if (!setResult) {
      const existing = await rideModel.findRatingByRideId(input.rideId);
      if (existing) return existing;
      throw new ApiError(409, "Rating already submitted");
    }
  }

  /* ---- Verify ride ownership and status ---- */
  const ride = await rideModel.findById(input.rideId);
  if (!ride) throw new ApiError(404, "Ride not found");
  if (ride.userId !== userId) throw new ApiError(403, "Not your ride");

  if (!["COMPLETED_UNPAID", "COMPLETED_PAID"].includes(ride.status)) {
    throw new ApiError(400, "Can only rate completed rides");
  }

  if (!ride.driverId) {
    throw new ApiError(400, "Cannot rate a ride without a driver");
  }

  /* ---- DB insert — unique constraint is final idempotency guard ---- */
  try {
    const rating = await rideModel.createRating({
      rideId: input.rideId,
      userId,
      driverId: ride.driverId,
      rating: input.rating,
      comment: input.comment,
    });

    safeAudit("ride:rated", { rideId: input.rideId, userId, rating: input.rating }, tid);
    logger.info({ rideId: input.rideId, rating: input.rating, traceId: tid }, "Ride rated");

    return rating;
  } catch (err: unknown) {
    /* Prisma unique constraint violation = already rated */
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      const existing = await rideModel.findRatingByRideId(input.rideId);
      if (existing) return existing;
    }
    throw err;
  }
};

/* ======================================================
   SAGA EVENT HANDLERS
   Called by Kafka consumers in rideConsumer.ts
====================================================== */

/**
 * Handle DRIVER_ASSIGNED event from Matching Service.
 * Updates ride status REQUESTED → ACCEPTED.
 */
export const handleDriverAssigned = async (
  rideId: string,
  driverId: string,
  traceId: string
) => {
  const updated = await rideModel.assignDriver(rideId, driverId);
  if (!updated) {
    logger.warn({ rideId, driverId, traceId }, "DRIVER_ASSIGNED: ride not in REQUESTED state — ignoring");
    return;
  }

  /* Dispatch push notification to rider */
  try {
    await rideNotificationQueue.add("RIDE_ACCEPTED", {
      type: "RIDE_ACCEPTED",
      userId: updated.userId,
      rideId,
      driverId,
      traceId,
    });
  } catch (err) {
    logger.error({ err, rideId, traceId }, "Failed to queue RIDE_ACCEPTED notification");
  }

  safeAudit("ride:driver_assigned", { rideId, driverId }, traceId);
  logger.info({ rideId, driverId, traceId }, "Driver assigned to ride");
};

/**
 * Handle MATCH_FAILED event from Matching Service.
 * Updates ride status to CANCELLED + notifies rider.
 */
export const handleMatchFailed = async (
  rideId: string,
  traceId: string
) => {
  const ride = await rideModel.findById(rideId);
  if (!ride) {
    logger.warn({ rideId, traceId }, "MATCH_FAILED: ride not found — ignoring");
    return;
  }

  const updated = await rideModel.updateStatus(rideId, "REQUESTED", "CANCELLED");
  if (!updated) {
    logger.warn({ rideId, traceId }, "MATCH_FAILED: ride not in REQUESTED state — ignoring");
    return;
  }

  /* Clear active ride cache */
  try {
    await redisClient.del(Keys.activeRide(ride.userId));
  } catch {}

  /* Notify rider via BullMQ */
  try {
    await rideNotificationQueue.add("MATCH_FAILED", {
      type: "MATCH_FAILED",
      userId: ride.userId,
      rideId,
      traceId,
    });
  } catch (err) {
    logger.error({ err, rideId, traceId }, "Failed to queue MATCH_FAILED notification");
  }

  metrics.rideCancelled.inc();
  safeAudit("ride:match_failed", { rideId, userId: ride.userId }, traceId);
  logger.info({ rideId, traceId }, "Ride cancelled — no drivers available");
};

/**
 * Handle PAYMENT_SUCCESS from Payment Service.
 * Atomic: COMPLETED_UNPAID → COMPLETED_PAID.
 */
export const handlePaymentSuccess = async (
  rideId: string,
  traceId: string
) => {
  const updated = await rideModel.updateStatus(rideId, "COMPLETED_UNPAID", "COMPLETED_PAID");
  if (!updated) {
    logger.warn({ rideId, traceId }, "PAYMENT_SUCCESS: ride not in COMPLETED_UNPAID state");
    return;
  }

  /* Notify rider */
  try {
    await rideNotificationQueue.add("RIDE_COMPLETED", {
      type: "RIDE_COMPLETED",
      userId: updated.userId,
      rideId,
      traceId,
    });
  } catch (err) {
    logger.error({ err, rideId, traceId }, "Failed to queue RIDE_COMPLETED notification");
  }

  safeAudit("ride:payment_success", { rideId }, traceId);
  logger.info({ rideId, traceId }, "SAGA complete — ride fully paid");
};

/**
 * Handle PAYMENT_FAILED from Payment Service.
 * Keeps status as COMPLETED_UNPAID + notifies rider.
 */
export const handlePaymentFailed = async (
  rideId: string,
  traceId: string
) => {
  const ride = await rideModel.findById(rideId);
  if (!ride) {
    logger.warn({ rideId, traceId }, "PAYMENT_FAILED: ride not found");
    return;
  }

  /* Notify rider to try alternative payment */
  try {
    await rideNotificationQueue.add("PAYMENT_FAILED", {
      type: "PAYMENT_FAILED",
      userId: ride.userId,
      rideId,
      traceId,
    });
  } catch (err) {
    logger.error({ err, rideId, traceId }, "Failed to queue PAYMENT_FAILED notification");
  }

  safeAudit("ride:payment_failed", { rideId, userId: ride.userId }, traceId);
  logger.info({ rideId, traceId }, "Payment failed — rider notified for alternative payment");
};
