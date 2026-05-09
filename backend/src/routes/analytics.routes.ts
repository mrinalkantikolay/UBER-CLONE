import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller";
import { validateQuery } from "../middlewares/validate.middleware";
import { verifyAccessToken, requireRole } from "../middlewares/auth.middleware";
import { rateLimiter } from "../middlewares/ratelimiter.middleware";
import { analyticsQuerySchema } from "../validators/analytics.validator";
import { UserRole } from "@prisma/client";

const router = Router();

/* ======================================================
   ANALYTICS ROUTES — ADMIN ONLY
   
   All analytics REST endpoints require ADMIN role.
   The Ride Service calls getSurgeMultiplier() internally
   (no REST needed for riders).
====================================================== */

router.use(verifyAccessToken, requireRole(UserRole.ADMIN));

/**
 * @openapi
 * /api/analytics/system:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get overall system statistics (ADMIN ONLY)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: System stats retrieved
 */
router.get(
  "/system",
  rateLimiter("analytics-system", 10, 60),
  validateQuery(analyticsQuerySchema),
  analyticsController.getSystemStats
);

/**
 * @openapi
 * /api/analytics/demand:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get ride demand statistics (ADMIN ONLY)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Demand stats retrieved
 */
router.get(
  "/demand",
  rateLimiter("analytics-demand", 20, 60),
  validateQuery(analyticsQuerySchema),
  analyticsController.getDemandStats
);

/**
 * @openapi
 * /api/analytics/revenue:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get revenue statistics (ADMIN ONLY)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue stats retrieved
 */
router.get(
  "/revenue",
  rateLimiter("analytics-revenue", 10, 60),
  validateQuery(analyticsQuerySchema),
  analyticsController.getRevenue
);

/**
 * @openapi
 * /api/analytics/surge/{city}:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get current surge multiplier for a city (ADMIN ONLY)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Surge multiplier retrieved
 */
router.get(
  "/surge/:city",
  rateLimiter("analytics-surge", 30, 60),
  analyticsController.getSurge
);

/**
 * @openapi
 * /api/analytics/realtime:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get real-time system metrics (ADMIN ONLY)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time metrics retrieved
 */
router.get(
  "/realtime",
  rateLimiter("analytics-realtime", 30, 60),
  analyticsController.getRealTimeMetrics
);

/**
 * @openapi
 * /api/analytics/anomalies:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get system anomalies and alerts (ADMIN ONLY)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Anomaly alerts retrieved
 */
router.get(
  "/anomalies",
  rateLimiter("analytics-anomalies", 10, 60),
  analyticsController.getAnomalyAlerts
);

export default router;
