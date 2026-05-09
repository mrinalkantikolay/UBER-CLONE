import { z } from "zod";

/* ================================
   BASE FIELDS
================================ */

const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);

/*
 * Idempotency key — client-generated UUID.
 * Prevents duplicate ride creation on network retries.
 * Must be a valid UUID v4.
 */
const idempotencyKey = z
  .string()
  .uuid("Idempotency key must be a valid UUID");

/* ================================
   URL PARAM SCHEMAS
================================ */

/**
 * Validates :rideId URL parameter.
 * Used by cancel, complete, and rate routes.
 */
export const rideIdParamSchema = z.object({
  rideId: z.string().uuid("Invalid ride ID"),
});

/* ================================
   BODY SCHEMAS
================================ */

export const createRideSchema = z.object({
  originLat: latitude,
  originLng: longitude,
  destLat: latitude,
  destLng: longitude,
  idempotencyKey,
  surgeMultiplier: z
    .number()
    .min(1, "Surge must be at least 1.0")
    .max(5, "Surge must be at most 5.0")
    .optional()
    .default(1.0),
});

/**
 * Rate ride body — rideId comes from URL param, not body.
 */
export const rateRideBodySchema = z.object({
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z.string().max(500, "Comment must be at most 500 characters").trim().optional(),
});

/**
 * Ride history query params — cursor-based pagination.
 */
export const rideHistoryQuerySchema = z.object({
  cursor: z.string().uuid("Invalid cursor").optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10),
});
