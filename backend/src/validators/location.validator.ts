import { z } from "zod";

/* ================================
   BASE FIELDS
================================ */

const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);

/* ================================
   SCHEMAS
================================ */

export const updateDriverLocationSchema = z.object({
  lat: latitude,
  lng: longitude,
});

export const getNearbyDriversSchema = z.object({
  lat: latitude,
  lng: longitude,
  radiusKm: z.number().min(0.1, "Radius must be at least 0.1 km").max(50, "Radius must be at most 50 km").optional().default(5),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const updateRiderLocationSchema = z.object({
  lat: latitude,
  lng: longitude,
});

export const calculateETASchema = z.object({
  originLat: latitude,
  originLng: longitude,
  destLat: latitude,
  destLng: longitude,
});

export const getRoutePathSchema = z.object({
  originLat: latitude,
  originLng: longitude,
  destLat: latitude,
  destLng: longitude,
});
