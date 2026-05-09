import { Router } from "express";

import * as rideController from "../controllers/ride.controller";

import { validate } from "../middlewares/validate.middleware";
import { validateParams } from "../middlewares/validate.middleware";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { rateLimiter } from "../middlewares/ratelimiter.middleware";

import {
  createRideSchema,
  rideIdParamSchema,
  rateRideBodySchema,
  rideHistoryQuerySchema,
} from "../validators/ride.validator";

const router = Router();

/* All ride routes require authentication */
router.use(verifyAccessToken);

/**
 * @openapi
 * /api/rides:
 *   post:
 *     tags:
 *       - Ride
 *     summary: Create a new ride request
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originLat
 *               - originLng
 *               - destLat
 *               - destLng
 *               - idempotencyKey
 *             properties:
 *               originLat:
 *                 type: number
 *               originLng:
 *                 type: number
 *               destLat:
 *                 type: number
 *               destLng:
 *                 type: number
 *               idempotencyKey:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ride request created
 */
router.post(
  "/",
  rateLimiter("ride-create", 5, 60),
  validate(createRideSchema),
  rideController.createRide
);

/**
 * @openapi
 * /api/rides/{rideId}/cancel:
 *   patch:
 *     tags:
 *       - Ride
 *     summary: Cancel an active ride
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ride cancelled
 */
router.patch(
  "/:rideId/cancel",
  rateLimiter("ride-cancel", 5, 60),
  validateParams(rideIdParamSchema),
  rideController.cancelRide
);

/**
 * @openapi
 * /api/rides/{rideId}/complete:
 *   patch:
 *     tags:
 *       - Ride
 *     summary: Mark ride as completed (Driver or Rider)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ride completed
 */
router.patch(
  "/:rideId/complete",
  rateLimiter("ride-complete", 10, 60),
  validateParams(rideIdParamSchema),
  rideController.completeRide
);

/**
 * @openapi
 * /api/rides/active:
 *   get:
 *     tags:
 *       - Ride
 *     summary: Get user's current active ride
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active ride details retrieved
 */
router.get(
  "/active",
  rateLimiter("ride-active", 30, 60),
  rideController.getActiveRide
);

/**
 * @openapi
 * /api/rides/history:
 *   get:
 *     tags:
 *       - Ride
 *     summary: Get paginated ride history
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of previous rides
 */
router.get(
  "/history",
  rateLimiter("ride-history", 20, 60),
  rideController.getRideHistory
);

/**
 * @openapi
 * /api/rides/{rideId}/rate:
 *   post:
 *     tags:
 *       - Ride
 *     summary: Rate a completed ride
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rating submitted
 */
router.post(
  "/:rideId/rate",
  rateLimiter("ride-rate", 5, 60),
  validateParams(rideIdParamSchema),
  validate(rateRideBodySchema),
  rideController.rateRide
);

export default router;
