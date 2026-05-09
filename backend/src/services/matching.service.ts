import crypto from "crypto";
import { Job } from "bullmq";

import logger from "../config/logger";
import { redisClient } from "../config/redis";

import locationModel from "../models/location.model";
import { publishDriverAssigned, publishMatchFailed, publishDriverDispatch } from "../events/matchingProducer";
import { matchingTimeoutQueue, setTimeoutProcessor } from "../queues/matchingTimeout.queue";

import { MatchingStatus, DriverCandidate, MatchTimeoutJobData } from "../types/matching.types";

/* ======================================================
   MATCHING SERVICE — CORE ENGINE
   
   Purely event-driven. No REST endpoints.
   Consumes RIDE_REQUESTED → orchestrates driver matching.
   
   Flow: GEOSEARCH → Sort (Min Heap) → Lock → Dispatch → Timeout
         ↓ (on accept)     ↓ (on timeout)     ↓ (on empty heap)
     DRIVER_ASSIGNED     Try next driver      MATCH_FAILED
====================================================== */

/* ======================================================
   CONSTANTS
====================================================== */

const MAX_RETRY = 5;             // Max drivers to try before giving up
const SEARCH_RADIUS_KM = 5;     // Initial search radius
const DRIVER_LOCK_TTL = 15;     // Seconds to wait for driver response
const MATCHING_STATUS_TTL = 3600; // 1 hour TTL for matching status keys

/* ======================================================
   REDIS KEYS
====================================================== */

const Keys = {
  matchingStatus: (rideId: string) => `matching:${rideId}:status`,
  matchingAttempts: (rideId: string) => `matching:${rideId}:attempts`,
  driverLock: (driverId: string) => `lock:driver:${driverId}`,
};

/* ======================================================
   LUA SCRIPTS — Atomic Redis operations
   
   These prevent race conditions in the matching lifecycle:
   1. SAFE_UNLOCK: Only delete lock if value === expected rideId
   2. VERIFY_LOCK: Read lock value atomically for acceptance check
====================================================== */

/**
 * Lua: Safe unlock — only DEL if current value matches rideId.
 * Prevents unlocking a driver that was already re-matched to
 * a different ride after the original lock expired.
 * Returns 1 if unlocked, 0 if not (stale or missing).
 */
const SAFE_UNLOCK_SCRIPT = `
  local key = KEYS[1]
  local expected = ARGV[1]
  if redis.call('GET', key) == expected then
    redis.call('DEL', key)
    return 1
  end
  return 0
`;

/**
 * Lua: Verify lock — returns the current value of the lock key.
 * Used when a driver clicks ACCEPT to verify the lock is still
 * held for the same rideId (hasn't expired or been reassigned).
 */
const VERIFY_LOCK_SCRIPT = `
  local key = KEYS[1]
  return redis.call('GET', key)
`;

/* ======================================================
   HELPERS
====================================================== */

const ensureTraceId = (traceId?: string): string =>
  traceId ?? crypto.randomUUID();

/**
 * Set matching status in Redis with TTL.
 * O(1) — single SET.
 */
const setMatchingStatus = async (rideId: string, status: MatchingStatus): Promise<void> => {
  await redisClient.setEx(Keys.matchingStatus(rideId), MATCHING_STATUS_TTL, status);
};

/**
 * Get matching status from Redis.
 * O(1) — single GET.
 */
const getMatchingStatus = async (rideId: string): Promise<string | null> => {
  return redisClient.get(Keys.matchingStatus(rideId));
};

/**
 * Increment attempt counter.
 * Returns the new count. TTL auto-set on first increment.
 */
const incrementAttempts = async (rideId: string): Promise<number> => {
  const key = Keys.matchingAttempts(rideId);
  const count = await redisClient.incr(key);
  if (count === 1) {
    await redisClient.expire(key, MATCHING_STATUS_TTL);
  }
  return count;
};

/* ======================================================
   1. START MATCHING — Entry point
   
   Called when RIDE_REQUESTED is consumed from Kafka.
   Finds nearby drivers via GEOSEARCH, sorts by distance
   (Min Heap / ascending sort), and dispatches to the nearest.
====================================================== */

export const startMatching = async (
  rideId: string,
  userId: string,
  originLng: number,
  originLat: number,
  destLng: number,
  destLat: number,
  fare: number,
  surgeMultiplier: number,
  traceId?: string
): Promise<void> => {
  const tid = ensureTraceId(traceId);

  if (!redisClient.isReady) {
    logger.error({ rideId, traceId: tid }, "Redis unavailable — cannot start matching");
    return;
  }

  /* Prevent duplicate matching for the same ride */
  const existingStatus = await getMatchingStatus(rideId);
  if (existingStatus && existingStatus !== MatchingStatus.CANCELLED) {
    logger.warn({ rideId, existingStatus, traceId: tid }, "Matching already in progress — skipping");
    return;
  }

  await setMatchingStatus(rideId, MatchingStatus.MATCHING);

  logger.info({ rideId, originLng, originLat, traceId: tid }, "Starting driver matching");

  /* ---- GEOSEARCH — O(log N + K) ---- */
  const nearbyDrivers = await locationModel.getNearbyDrivers(
    originLng,
    originLat,
    SEARCH_RADIUS_KM,
    MAX_RETRY * 2, // Fetch more candidates than needed for fallback
  );

  if (nearbyDrivers.length === 0) {
    logger.info({ rideId, traceId: tid }, "No nearby drivers found — matching failed immediately");
    await failMatching(rideId, "No drivers available in your area", tid);
    return;
  }

  /* ---- Min Heap Sort — O(K log K) ----
   * Sort by distance ascending. For MVP scale (< 100 candidates),
   * Array.sort is equivalent to a binary min-heap extract. */
  const sortedDrivers: DriverCandidate[] = nearbyDrivers
    .map((d) => ({
      driverId: d.member,
      distance: d.distance,
      coordinates: d.coordinates,
    }))
    .sort((a, b) => a.distance - b.distance);

  logger.info(
    { rideId, candidates: sortedDrivers.length, nearest: sortedDrivers[0]?.distance, traceId: tid },
    "Driver candidates sorted by distance"
  );

  /* ---- Dispatch to nearest available driver ---- */
  await dispatchToNextDriver(
    rideId, userId,
    originLng, originLat,
    destLng, destLat,
    fare, surgeMultiplier,
    sortedDrivers,
    0,
    tid
  );
};

/* ======================================================
   2. DISPATCH TO NEXT DRIVER
   
   Recursive dispatcher. Tries to lock and dispatch each
   candidate in order. Skips already-locked drivers.
====================================================== */

const dispatchToNextDriver = async (
  rideId: string,
  userId: string,
  originLng: number,
  originLat: number,
  destLng: number,
  destLat: number,
  fare: number,
  surgeMultiplier: number,
  candidates: DriverCandidate[],
  currentIndex: number,
  traceId: string
): Promise<void> => {

  /* ---- Check if ride was cancelled during matching ---- */
  const status = await getMatchingStatus(rideId);
  if (status === MatchingStatus.CANCELLED || status === MatchingStatus.MATCHED) {
    logger.info({ rideId, status, traceId }, "Matching stopped — ride status changed");
    return;
  }

  /* ---- Check retry limit ---- */
  const attempts = await incrementAttempts(rideId);
  if (attempts > MAX_RETRY) {
    logger.info({ rideId, attempts, traceId }, "Max retry limit reached — matching failed");
    await failMatching(rideId, "All nearby drivers declined or timed out", traceId);
    return;
  }

  /* ---- Find next lockable driver ---- */
  while (currentIndex < candidates.length) {
    const candidate = candidates[currentIndex];
    const locked = await lockDriver(candidate.driverId, rideId, traceId);

    if (locked) {
      /* ---- Driver locked — dispatch ---- */
      await setMatchingStatus(rideId, MatchingStatus.DISPATCHED);

      /* Publish to Kafka for WS Gateway to ring driver's phone */
      try {
        await publishDriverDispatch(
          {
            driverId: candidate.driverId,
            rideId,
            userId,
            pickup: { lng: originLng, lat: originLat },
            destination: { lng: destLng, lat: destLat },
            fare,
            surgeMultiplier,
          },
          traceId
        );
      } catch (err) {
        logger.error({ err, rideId, driverId: candidate.driverId, traceId }, "Failed to publish driver dispatch");
        /* Unlock and try next */
        await safeUnlockDriver(candidate.driverId, rideId, traceId);
        currentIndex++;
        continue;
      }

      /* Schedule BullMQ timeout job (15s delay) */
      const remainingDrivers = candidates.slice(currentIndex + 1);
      const jobId = `timeout:${rideId}:${candidate.driverId}`;

      try {
        await matchingTimeoutQueue.add(
          jobId,
          {
            rideId,
            driverId: candidate.driverId,
            userId,
            originLng,
            originLat,
            destLng,
            destLat,
            fare,
            surgeMultiplier,
            remainingDrivers,
            attempt: attempts,
            traceId,
          },
          {
            delay: DRIVER_LOCK_TTL * 1000, // 15 seconds
            jobId,                          // Deduplicate by jobId
          }
        );
      } catch (err) {
        logger.error({ err, rideId, driverId: candidate.driverId, traceId }, "Failed to schedule timeout job");
      }

      logger.info(
        { rideId, driverId: candidate.driverId, distance: candidate.distance, attempt: attempts, traceId },
        "Driver dispatched — waiting for response"
      );
      return;
    }

    /* Lock failed — driver already matched, try next */
    logger.debug(
      { rideId, driverId: candidate.driverId, traceId },
      "Driver already locked — skipping"
    );
    currentIndex++;
  }

  /* No more candidates — matching failed */
  logger.info({ rideId, traceId }, "All candidates exhausted — matching failed");
  await failMatching(rideId, "All nearby drivers are currently busy", traceId);
};

/* ======================================================
   3. LOCK DRIVER — Atomic SET NX EX 15
   
   Returns true if lock acquired, false if driver is
   already locked (being dispatched for another ride).
   O(1) — single Redis SET NX.
====================================================== */

const lockDriver = async (
  driverId: string,
  rideId: string,
  traceId: string
): Promise<boolean> => {
  const result = await redisClient.set(
    Keys.driverLock(driverId),
    rideId,
    { NX: true, EX: DRIVER_LOCK_TTL }
  );

  if (result) {
    logger.debug({ driverId, rideId, traceId }, "Driver locked");
  }

  return result !== null;
};

/* ======================================================
   4. SAFE UNLOCK DRIVER — Lua Script
   
   Only deletes the lock if it still holds the expected rideId.
   Prevents unlocking a driver that was already re-matched.
   O(1) — single Lua eval.
====================================================== */

export const safeUnlockDriver = async (
  driverId: string,
  rideId: string,
  traceId: string
): Promise<boolean> => {
  const result = await redisClient.eval(SAFE_UNLOCK_SCRIPT, {
    keys: [Keys.driverLock(driverId)],
    arguments: [rideId],
  }) as number;

  if (result === 1) {
    logger.debug({ driverId, rideId, traceId }, "Driver safely unlocked");
  }

  return result === 1;
};

/* ======================================================
   5. VERIFY DRIVER LOCK — Lua Script
   
   Called when a driver clicks ACCEPT. Verifies the lock
   key still contains the expected rideId. If expired or
   reassigned, returns false → reject the driver with 410.
   O(1) — single Lua eval.
====================================================== */

export const verifyDriverLock = async (
  driverId: string,
  rideId: string
): Promise<boolean> => {
  const value = await redisClient.eval(VERIFY_LOCK_SCRIPT, {
    keys: [Keys.driverLock(driverId)],
    arguments: [],
  }) as string | null;

  return value === rideId;
};

/* ======================================================
   6. HANDLE DRIVER ACCEPTED
   
   Called when a driver accepts a ride dispatch.
   1. Verify lock still valid (Lua)
   2. Delete lock (driver is now committed)
   3. Set status MATCHED
   4. Cancel BullMQ timeout job
   5. Publish DRIVER_ASSIGNED → Rider Service
====================================================== */

export const handleDriverAccepted = async (
  rideId: string,
  driverId: string,
  traceId?: string
): Promise<boolean> => {
  const tid = ensureTraceId(traceId);

  /* ---- Verify lock — Lua atomic check ---- */
  const isValid = await verifyDriverLock(driverId, rideId);
  if (!isValid) {
    logger.warn(
      { rideId, driverId, traceId: tid },
      "Driver acceptance REJECTED — lock expired or reassigned (410 Gone)"
    );
    return false;
  }

  /* ---- Delete lock (driver committed) ---- */
  await redisClient.del(Keys.driverLock(driverId));

  /* ---- Update status ---- */
  await setMatchingStatus(rideId, MatchingStatus.MATCHED);

  /* ---- Cancel BullMQ timeout job ---- */
  const jobId = `timeout:${rideId}:${driverId}`;
  try {
    const job = await matchingTimeoutQueue.getJob(jobId);
    if (job) {
      await job.remove();
      logger.debug({ rideId, driverId, traceId: tid }, "Timeout job cancelled");
    }
  } catch (err) {
    logger.warn({ err, rideId, driverId, traceId: tid }, "Failed to cancel timeout job — may have already fired");
  }

  /* ---- Publish DRIVER_ASSIGNED → Rider Service ---- */
  try {
    await publishDriverAssigned(rideId, driverId, tid);
  } catch (err) {
    logger.error({ err, rideId, driverId, traceId: tid }, "Failed to publish DRIVER_ASSIGNED");
  }

  logger.info({ rideId, driverId, traceId: tid }, "Driver accepted — SAGA event published");
  return true;
};

/* ======================================================
   7. HANDLE TIMEOUT — BullMQ Worker Processor
   
   Fires after 15 seconds if driver didn't respond.
   1. Safe unlock the timed-out driver
   2. Try the next driver in the candidates list
====================================================== */

const handleTimeout = async (job: Job<MatchTimeoutJobData>): Promise<void> => {
  const {
    rideId, driverId, userId,
    originLng, originLat,
    destLng, destLat,
    fare, surgeMultiplier,
    remainingDrivers, traceId,
  } = job.data;

  logger.info({ rideId, driverId, traceId }, "Driver dispatch timed out — trying next");

  /* ---- Safe unlock the timed-out driver ---- */
  await safeUnlockDriver(driverId, rideId, traceId);

  /* ---- Check if ride was cancelled or matched during wait ---- */
  const status = await getMatchingStatus(rideId);
  if (status === MatchingStatus.CANCELLED || status === MatchingStatus.MATCHED) {
    logger.info({ rideId, status, traceId }, "Ride status changed during timeout — stopping");
    return;
  }

  /* ---- Try next driver recursively ---- */
  if (remainingDrivers.length === 0) {
    logger.info({ rideId, traceId }, "No remaining candidates after timeout — matching failed");
    await failMatching(rideId, "All nearby drivers timed out", traceId);
    return;
  }

  await dispatchToNextDriver(
    rideId, userId,
    originLng, originLat,
    destLng, destLat,
    fare, surgeMultiplier,
    remainingDrivers,
    0,
    traceId
  );
};

/* Register the timeout processor with the queue worker */
setTimeoutProcessor(handleTimeout);

/* ======================================================
   8. FAIL MATCHING — Terminal state
   
   No drivers available or all retries exhausted.
   Sets status FAILED and publishes MATCH_FAILED to Kafka.
====================================================== */

export const failMatching = async (
  rideId: string,
  reason: string,
  traceId: string
): Promise<void> => {
  await setMatchingStatus(rideId, MatchingStatus.FAILED);

  try {
    await publishMatchFailed(rideId, reason, traceId);
  } catch (err) {
    logger.error({ err, rideId, traceId }, "Failed to publish MATCH_FAILED");
  }

  logger.info({ rideId, reason, traceId }, "Matching failed — MATCH_FAILED event published");
};

/* ======================================================
   9. HANDLE RIDE_CANCELLED — Kafka Consumer Handler
   
   Rider cancelled during matching.
   1. Safe unlock the currently dispatched driver
   2. Cancel any pending BullMQ timeout job
   3. Set status CANCELLED
====================================================== */

export const handleRideCancelled = async (
  rideId: string,
  driverId: string | null,
  traceId: string
): Promise<void> => {
  /* ---- Unlock driver if one was dispatched ---- */
  if (driverId) {
    await safeUnlockDriver(driverId, rideId, traceId);

    /* Cancel timeout job */
    const jobId = `timeout:${rideId}:${driverId}`;
    try {
      const job = await matchingTimeoutQueue.getJob(jobId);
      if (job) {
        await job.remove();
      }
    } catch (err) {
      logger.warn({ err, rideId, traceId }, "Failed to cancel timeout job on ride cancelled");
    }
  }

  await setMatchingStatus(rideId, MatchingStatus.CANCELLED);
  logger.info({ rideId, driverId, traceId }, "Matching cancelled — rider cancelled the ride");
};
