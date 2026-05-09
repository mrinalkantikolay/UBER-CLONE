import crypto from "crypto";

import logger from "../config/logger";
import { redisClient } from "../config/redis";
import ApiError from "../utils/ApiError";
import auditLogger from "../utils/auditLogger";

import locationModel from "../models/location.model";
import driverModel from "../models/driver.model";

/* ======================================================
   TYPES
====================================================== */

type Coordinates = {
  lat: number;
  lng: number;
};

type NearbyDriver = {
  driverId: string;
  distance: number;
  coordinates: { longitude: number; latitude: number };
};

type ETAResult = {
  distanceKm: number;
  estimatedMinutes: number;
};

type RoutePathResult = {
  origin: Coordinates;
  destination: Coordinates;
  distanceKm: number;
  estimatedMinutes: number;
  provider: string;
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
   HAVERSINE FORMULA
   Calculates great-circle distance between two points.
   O(1) — pure math, no external calls.
====================================================== */

const EARTH_RADIUS_KM = 6371;
const AVG_SPEED_KMH = 30; // Urban average

const toRadians = (deg: number): number => (deg * Math.PI) / 180;

const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
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

/* ======================================================
   1. UPDATE DRIVER LOCATION
   O(log N) — Redis GEOADD
====================================================== */

export const updateDriverLocation = async (
  userId: string,
  lat: number,
  lng: number,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  if (!redisClient.isReady) {
    throw new ApiError(503, "Location service unavailable");
  }

  /* Verify the user is a registered driver */
  const driver = await driverModel.findByUserId(userId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  await locationModel.updateDriverLocation(driver.id, lng, lat);

  logger.debug(
    { driverId: driver.id, lat, lng, traceId: tid },
    "Driver location updated"
  );

  return { driverId: driver.id, lat, lng };
};

/* ======================================================
   2. GET NEARBY DRIVERS
   O(log N + K) — Redis GEOSEARCH
====================================================== */

export const getNearbyDrivers = async (
  lat: number,
  lng: number,
  radiusKm: number = 5,
  limit: number = 10,
  traceId?: string
): Promise<NearbyDriver[]> => {
  const tid = ensureTraceId(traceId);

  if (!redisClient.isReady) {
    throw new ApiError(503, "Location service unavailable");
  }

  const drivers = await locationModel.getNearbyDrivers(lng, lat, radiusKm, limit);

  logger.debug(
    { lat, lng, radiusKm, found: drivers.length, traceId: tid },
    "Nearby drivers queried"
  );

  return drivers.map((d) => ({
    driverId: d.member,
    distance: d.distance,
    coordinates: d.coordinates,
  }));
};

/* ======================================================
   3. UPDATE RIDER LOCATION
   O(1) — Redis SET
====================================================== */

export const updateRiderLocation = async (
  userId: string,
  lat: number,
  lng: number,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  if (!redisClient.isReady) {
    throw new ApiError(503, "Location service unavailable");
  }

  await locationModel.updateRiderLocation(userId, lng, lat);

  logger.debug({ userId, lat, lng, traceId: tid }, "Rider location updated");

  return { userId, lat, lng };
};

/* ======================================================
   4. CALCULATE ETA
   O(1) — Haversine formula (pure math)
====================================================== */

export const calculateETA = async (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  traceId?: string
): Promise<ETAResult> => {
  const tid = ensureTraceId(traceId);

  const distanceKm = haversineDistance(originLat, originLng, destLat, destLng);

  /* Road distance is roughly 1.4x straight-line distance (urban factor) */
  const roadDistance = distanceKm * 1.4;
  const estimatedMinutes = Math.ceil((roadDistance / AVG_SPEED_KMH) * 60);

  logger.debug(
    { originLat, originLng, destLat, destLng, distanceKm: roadDistance, estimatedMinutes, traceId: tid },
    "ETA calculated"
  );

  return {
    distanceKm: Math.round(roadDistance * 100) / 100,
    estimatedMinutes,
  };
};

/* ======================================================
   5. GET ROUTE PATH
   Stub for Google Maps Directions API.
   In production, replace with actual API call.
   Currently returns Haversine-based estimate.
====================================================== */

export const getRoutePath = async (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  traceId?: string
): Promise<RoutePathResult> => {
  const tid = ensureTraceId(traceId);

  /*
   * TODO: Replace with actual Google Maps Directions API call:
   *
   * const response = await fetch(
   *   `https://maps.googleapis.com/maps/api/directions/json?` +
   *   `origin=${originLat},${originLng}&destination=${destLat},${destLng}` +
   *   `&key=${env.GOOGLE_MAPS_API_KEY}`
   * );
   *
   * For now, return Haversine-based estimate.
   */

  const distanceKm = haversineDistance(originLat, originLng, destLat, destLng);
  const roadDistance = distanceKm * 1.4;
  const estimatedMinutes = Math.ceil((roadDistance / AVG_SPEED_KMH) * 60);

  logger.info(
    { originLat, originLng, destLat, destLng, provider: "haversine-stub", traceId: tid },
    "Route path calculated (stub)"
  );

  return {
    origin: { lat: originLat, lng: originLng },
    destination: { lat: destLat, lng: destLng },
    distanceKm: Math.round(roadDistance * 100) / 100,
    estimatedMinutes,
    provider: "haversine-stub",
  };
};

/* ======================================================
   6. REMOVE DRIVER FROM ACTIVE POOL
   O(log N) — Redis ZREM + SREM
====================================================== */

export const removeDriverFromPool = async (
  userId: string,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  if (!redisClient.isReady) {
    throw new ApiError(503, "Location service unavailable");
  }

  const driver = await driverModel.findByUserId(userId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  await locationModel.removeDriver(driver.id);

  safeAudit("location:driver:remove", { userId, driverId: driver.id }, tid);

  logger.info({ driverId: driver.id, traceId: tid }, "Driver removed from active pool");

  return { message: "Driver removed from active pool" };
};

/* ======================================================
   7. GET DRIVER LAST KNOWN LOCATION
   O(1) — Redis GEOPOS
====================================================== */

export const getDriverLastLocation = async (
  userId: string,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  if (!redisClient.isReady) {
    throw new ApiError(503, "Location service unavailable");
  }

  const driver = await driverModel.findByUserId(userId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  const position = await locationModel.getDriverPosition(driver.id);
  if (!position) throw new ApiError(404, "No location data found for this driver");

  logger.debug({ driverId: driver.id, traceId: tid }, "Driver last location fetched");

  return {
    driverId: driver.id,
    lat: position.latitude,
    lng: position.longitude,
  };
};
