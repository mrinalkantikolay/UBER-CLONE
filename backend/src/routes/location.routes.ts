import { Router } from "express";

import * as locationController from "../controllers/location.controller";

import { validate } from "../middlewares/validate.middleware";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { rateLimiter } from "../middlewares/ratelimiter.middleware";

import {
  updateDriverLocationSchema,
  getNearbyDriversSchema,
  updateRiderLocationSchema,
  calculateETASchema,
  getRoutePathSchema,
} from "../validators/location.validator";

const router = Router();

/* All location routes require authentication */
router.use(verifyAccessToken);

/**
 * @openapi
 * /api/location/driver:
 *   put:
 *     tags:
 *       - Location
 *     summary: Update driver's live location
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *             properties:
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated
 */
router.put(
  "/driver",
  rateLimiter("loc-driver-update", 60, 60),
  validate(updateDriverLocationSchema),
  locationController.updateDriverLocation
);

/**
 * @openapi
 * /api/location/driver:
 *   get:
 *     tags:
 *       - Location
 *     summary: Get driver's last known location
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Last known location retrieved
 */
router.get(
  "/driver",
  rateLimiter("loc-driver-get", 30, 60),
  locationController.getDriverLastLocation
);

/**
 * @openapi
 * /api/location/driver:
 *   delete:
 *     tags:
 *       - Location
 *     summary: Remove driver from active pool
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Driver removed from pool
 */
router.delete(
  "/driver",
  rateLimiter("loc-driver-remove", 10, 60),
  locationController.removeDriverFromPool
);

/* ======================================================
   RIDER LOCATION
====================================================== */

/**
 * @openapi
 * /api/location/rider:
 *   put:
 *     tags:
 *       - Location
 *     summary: Update rider's location
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *             properties:
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated
 */
router.put(
  "/rider",
  rateLimiter("loc-rider-update", 60, 60),
  validate(updateRiderLocationSchema),
  locationController.updateRiderLocation
);

/* ======================================================
   QUERIES
====================================================== */

/**
 * @openapi
 * /api/location/nearby:
 *   post:
 *     tags:
 *       - Location
 *     summary: Find drivers near a point
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *             properties:
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *               radius:
 *                 type: number
 *                 description: Radius in km
 *               limit:
 *                 type: integer
 *     responses:
 *       200:
 *         description: List of nearby drivers
 */
router.post(
  "/nearby",
  rateLimiter("loc-nearby", 30, 60),
  validate(getNearbyDriversSchema),
  locationController.getNearbyDrivers
);

/**
 * @openapi
 * /api/location/eta:
 *   post:
 *     tags:
 *       - Location
 *     summary: Calculate ETA between two points
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
 *             properties:
 *               originLat:
 *                 type: number
 *               originLng:
 *                 type: number
 *               destLat:
 *                 type: number
 *               destLng:
 *                 type: number
 *     responses:
 *       200:
 *         description: ETA details retrieved
 */
router.post(
  "/eta",
  rateLimiter("loc-eta", 30, 60),
  validate(calculateETASchema),
  locationController.calculateETA
);

/**
 * @openapi
 * /api/location/route:
 *   post:
 *     tags:
 *       - Location
 *     summary: Get route path between two points
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
 *             properties:
 *               originLat:
 *                 type: number
 *               originLng:
 *                 type: number
 *               destLat:
 *                 type: number
 *               destLng:
 *                 type: number
 *     responses:
 *       200:
 *         description: Route path details retrieved
 */
router.post(
  "/route",
  rateLimiter("loc-route", 20, 60),
  validate(getRoutePathSchema),
  locationController.getRoutePath
);

export default router;
