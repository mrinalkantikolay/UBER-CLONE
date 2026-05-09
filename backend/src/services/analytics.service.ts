import { redisClient } from "../config/redis";
import analyticsModel from "../models/analytics.model";
import logger from "../config/logger";
import crypto from "crypto";

/* ======================================================
   REDIS KEYS
   
   Matches MVP spec §REDIS DESIGN exactly:
   - analytics:demand:{city}:{minuteBucket} → Counter EX 600
   - analytics:supply:{city}:{minuteBucket} → Counter EX 600
   - analytics:surge:{city}                 → String  EX 60
   - analytics:activeDrivers                → Counter EX 60
   - analytics:event:{eventId}              → String  EX 86400
====================================================== */
const Keys = {
  demand: (city: string, minuteBucket: number) => `analytics:demand:${city}:${minuteBucket}`,
  supply: (city: string, minuteBucket: number) => `analytics:supply:${city}:${minuteBucket}`,
  surge: (city: string) => `analytics:surge:${city}`,
  activeDrivers: "analytics:activeDrivers",
  revenue: (city: string, minuteBucket: number) => `analytics:revenue:${city}:${minuteBucket}`,
};

const BUCKET_TTL = 600; // 10 minutes — covers full 5-min sliding window
const ACTIVE_DRIVERS_TTL = 60; // 60s TTL per MVP spec

/* ======================================================
   HELPERS
====================================================== */
const getCurrentMinuteBucket = () => Math.floor(Date.now() / 60000);

/**
 * Record a domain event into Redis sliding-window buckets.
 * Called by analyticsConsumer.ts for each Kafka event.
 */
export const recordEvent = async (
  eventType: "demand" | "supply" | "active" | "inactive" | "revenue",
  city: string = "global",
  amount: number = 1
): Promise<void> => {
  if (!redisClient.isReady) return;

  const bucket = getCurrentMinuteBucket();

  try {
    if (eventType === "demand") {
      const key = Keys.demand(city, bucket);
      await redisClient.incrBy(key, amount);
      await redisClient.expire(key, BUCKET_TTL);
    } else if (eventType === "supply") {
      const key = Keys.supply(city, bucket);
      await redisClient.incrBy(key, amount);
      await redisClient.expire(key, BUCKET_TTL);
    } else if (eventType === "active") {
      await redisClient.incr(Keys.activeDrivers);
      await redisClient.expire(Keys.activeDrivers, ACTIVE_DRIVERS_TTL); // MVP: EX 60
    } else if (eventType === "inactive") {
      const current = await redisClient.get(Keys.activeDrivers);
      if (current && parseInt(current, 10) > 0) {
        await redisClient.decr(Keys.activeDrivers);
        await redisClient.expire(Keys.activeDrivers, ACTIVE_DRIVERS_TTL);
      }
    } else if (eventType === "revenue") {
      const key = Keys.revenue(city, bucket);
      await redisClient.incrByFloat(key, amount);
      await redisClient.expire(key, BUCKET_TTL);
    }
  } catch (error) {
    logger.error({ error, eventType, city }, "Failed to record analytics event to Redis");
  }
};

/* ======================================================
   CORE FUNCTION 4: GET SURGE PRICING ZONES
   
   MVP: Read from analytics:surge:{city} cache (O(1)).
   If cache miss, compute on-demand from buckets.
====================================================== */
export const getSurgeMultiplier = async (city: string): Promise<number> => {
  if (redisClient.isReady) {
    const cached = await redisClient.get(Keys.surge(city));
    if (cached) return parseFloat(cached);

    /* Cache miss — compute on-demand from sliding window buckets */
    return calculateSurge(city);
  }
  return 1.0; // Default when Redis is down
};

/* ======================================================
   SURGE PRICING — SLIDING WINDOW ALGORITHM
   
   MVP Spec §SURGE PRICING:
   1. Divide time into 1-minute buckets
   2. Each bucket TTL = 600s
   3. To calculate surge:
      a. Read last 5 buckets (5-min window): SUM(demand), SUM(supply)
      b. surge = MAX(1.0, demand / supply)
      c. Smoothing: newSurge = (0.7 × currentSurge) + (0.3 × previousSurge)
      d. Cap at 5.0x maximum
      e. Cache: SET analytics:surge:{city} {surge} EX 60
   4. Recalculate every 60 seconds via BullMQ repeatable job.
====================================================== */
export const calculateSurge = async (city: string): Promise<number> => {
  if (!redisClient.isReady) return 1.0;

  const currentBucket = getCurrentMinuteBucket();
  let totalDemand = 0;
  let totalSupply = 0;

  // Read last 5 minute-buckets
  for (let i = 0; i < 5; i++) {
    const dVal = await redisClient.get(Keys.demand(city, currentBucket - i));
    const sVal = await redisClient.get(Keys.supply(city, currentBucket - i));
    totalDemand += dVal ? parseInt(dVal, 10) : 0;
    totalSupply += sVal ? parseInt(sVal, 10) : 0;
  }

  // step b: surge = MAX(1.0, demand / supply)
  const rawSurge = totalSupply > 0
    ? totalDemand / totalSupply
    : (totalDemand > 0 ? 2.0 : 1.0);
  let surge = Math.max(1.0, rawSurge);

  // step c: Smoothing
  const prevSurgeRaw = await redisClient.get(Keys.surge(city));
  const prevSurge = prevSurgeRaw ? parseFloat(prevSurgeRaw) : 1.0;
  surge = (0.7 * surge) + (0.3 * prevSurge);

  // step d: Cap at 5.0x
  surge = Math.min(5.0, surge);

  // step e: Cache result
  await redisClient.set(Keys.surge(city), surge.toFixed(2), { EX: 60 });

  logger.info(
    { city, totalDemand, totalSupply, surge: surge.toFixed(2) },
    "Surge recalculated"
  );

  return surge;
};

/* ======================================================
   AGGREGATION SWEEP
   
   MVP: Hourly/daily batch sweep over real-time Redis
   data to Postgres. Uses createMany (micro-batching).
   Sweeps multiple buckets in a range for reliability.
====================================================== */
export const sweepAggregationsToDB = async (city: string): Promise<void> => {
  if (!redisClient.isReady) return;

  const currentBucket = getCurrentMinuteBucket();
  const rideRows: { city: string; demand: number; supply: number; timestamp: Date }[] = [];
  const revenueRows: { city: string; total: number; timestamp: Date }[] = [];

  // Sweep a range of expired buckets (10–15 minutes ago)
  for (let offset = 10; offset <= 15; offset++) {
    const bucket = currentBucket - offset;
    const dVal = await redisClient.get(Keys.demand(city, bucket));
    const sVal = await redisClient.get(Keys.supply(city, bucket));
    const rVal = await redisClient.get(Keys.revenue(city, bucket));

    if (dVal || sVal) {
      rideRows.push({
        city,
        demand: dVal ? parseInt(dVal, 10) : 0,
        supply: sVal ? parseInt(sVal, 10) : 0,
        timestamp: new Date(bucket * 60000),
      });
    }

    if (rVal) {
      revenueRows.push({
        city,
        total: parseFloat(rVal),
        timestamp: new Date(bucket * 60000),
      });
    }
  }

  // Micro-batch insert to DB via createMany
  if (rideRows.length > 0) {
    await analyticsModel.createRideAnalyticsBatch(rideRows);
    logger.info({ city, count: rideRows.length }, "Ride analytics swept to DB");
  }

  if (revenueRows.length > 0) {
    await analyticsModel.createRevenueAnalyticsBatch(revenueRows);
    logger.info({ city, count: revenueRows.length }, "Revenue analytics swept to DB");
  }
};

/* ======================================================
   ANOMALY DETECTION
   
   MVP Core Function #9: Detect spikes in demand,
   cancellations, or revenue drops.
====================================================== */
export const runAnomalyDetection = async (city: string): Promise<{
  alerts: { type: string; severity: string; message: string; city: string; timestamp: string }[];
}> => {
  const alerts: { type: string; severity: string; message: string; city: string; timestamp: string }[] = [];

  if (!redisClient.isReady) return { alerts };

  const currentBucket = getCurrentMinuteBucket();

  // Check demand spike: if current bucket demand > 3x average of last 5 buckets
  let totalDemand = 0;
  let currentDemand = 0;
  for (let i = 0; i < 5; i++) {
    const val = await redisClient.get(Keys.demand(city, currentBucket - i));
    const parsed = val ? parseInt(val, 10) : 0;
    if (i === 0) currentDemand = parsed;
    totalDemand += parsed;
  }
  const avgDemand = totalDemand / 5;
  if (avgDemand > 0 && currentDemand > avgDemand * 3) {
    alerts.push({
      type: "DEMAND_SPIKE",
      severity: "HIGH",
      message: `Demand spike detected: current=${currentDemand}, avg=${avgDemand.toFixed(1)}`,
      city,
      timestamp: new Date().toISOString(),
    });
    logger.warn({ city, currentDemand, avgDemand }, "ANOMALY: Demand spike detected");
  }

  // Check surge level
  const surgeRaw = await redisClient.get(Keys.surge(city));
  const surge = surgeRaw ? parseFloat(surgeRaw) : 1.0;
  if (surge >= 3.0) {
    alerts.push({
      type: "HIGH_SURGE",
      severity: "MEDIUM",
      message: `Surge multiplier at ${surge.toFixed(2)}x`,
      city,
      timestamp: new Date().toISOString(),
    });
    logger.warn({ city, surge }, "ANOMALY: High surge detected");
  }

  return { alerts };
};

/* ======================================================
   CORE FUNCTION 1: GET RIDE DEMAND STATS
====================================================== */
export const getRideDemandStats = async (city: string, from: Date, to: Date) => {
  return analyticsModel.getRideStats(city, from, to);
};

/* ======================================================
   CORE FUNCTION 2: GET DRIVER ACTIVITY STATS
====================================================== */
export const getActiveDriversStat = async (): Promise<number> => {
  if (redisClient.isReady) {
    const active = await redisClient.get(Keys.activeDrivers);
    return active ? parseInt(active, 10) : 0;
  }
  return 0;
};

/* ======================================================
   CORE FUNCTION 3: GET REVENUE STATS
====================================================== */
export const getRevenueStats = async (city: string, from: Date, to: Date) => {
  return analyticsModel.getRevenueStats(city, from, to);
};

/* ======================================================
   CORE FUNCTION 5: GET SYSTEM METRICS
====================================================== */
export const getSystemMetrics = async (city: string, from: Date, to: Date) => {
  const metrics = await analyticsModel.getSystemMetrics(city, from, to);
  return {
    ...metrics,
    activeDrivers: await getActiveDriversStat(),
  };
};

/* ======================================================
   CORE FUNCTION 7: GET REAL-TIME METRICS
   
   MVP: Fast Redis O(1) lookups for live dashboard.
====================================================== */
export const getRealTimeMetrics = async (city: string): Promise<{
  activeDrivers: number;
  currentDemand: number;
  currentSupply: number;
  surgeMultiplier: number;
}> => {
  if (!redisClient.isReady) {
    return { activeDrivers: 0, currentDemand: 0, currentSupply: 0, surgeMultiplier: 1.0 };
  }

  const currentBucket = getCurrentMinuteBucket();

  const [activeRaw, demandRaw, supplyRaw, surgeRaw] = await Promise.all([
    redisClient.get(Keys.activeDrivers),
    redisClient.get(Keys.demand(city, currentBucket)),
    redisClient.get(Keys.supply(city, currentBucket)),
    redisClient.get(Keys.surge(city)),
  ]);

  return {
    activeDrivers: activeRaw ? parseInt(activeRaw, 10) : 0,
    currentDemand: demandRaw ? parseInt(demandRaw, 10) : 0,
    currentSupply: supplyRaw ? parseInt(supplyRaw, 10) : 0,
    surgeMultiplier: surgeRaw ? parseFloat(surgeRaw) : 1.0,
  };
};
