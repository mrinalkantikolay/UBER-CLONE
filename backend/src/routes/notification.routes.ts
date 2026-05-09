import { Router } from "express";

import * as notificationController from "../controllers/notification.controller";

import { validate, validateParams } from "../middlewares/validate.middleware";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { rateLimiter } from "../middlewares/ratelimiter.middleware";

import {
  notificationIdParamSchema,
  updatePreferencesSchema,
} from "../validators/notification.validator";

const router = Router();

/* All notification routes require authentication */
router.use(verifyAccessToken);

/**
 * @openapi
 * /api/notifications/unread-count:
 *   get:
 *     tags:
 *       - Notification
 *     summary: Get Redis-cached unread notification count
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved
 */
router.get(
  "/unread-count",
  rateLimiter("notif-unread", 60, 60),
  notificationController.getUnreadCount
);

/**
 * @openapi
 * /api/notifications/history:
 *   get:
 *     tags:
 *       - Notification
 *     summary: Get paginated notification history
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Notification history retrieved
 */
router.get(
  "/history",
  rateLimiter("notif-history", 20, 60),
  notificationController.getHistory
);

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   patch:
 *     tags:
 *       - Notification
 *     summary: Mark a notification as read
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch(
  "/:id/read",
  rateLimiter("notif-read", 30, 60),
  validateParams(notificationIdParamSchema),
  notificationController.markAsRead
);

/* ======================================================
   PREFERENCES
====================================================== */

/**
 * @openapi
 * /api/notifications/preferences:
 *   get:
 *     tags:
 *       - Notification
 *     summary: Get user notification preferences
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Preferences retrieved
 */
router.get(
  "/preferences",
  rateLimiter("notif-prefs-get", 10, 60),
  notificationController.getPreferences
);

/**
 * @openapi
 * /api/notifications/preferences:
 *   put:
 *     tags:
 *       - Notification
 *     summary: Update notification preferences
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: boolean
 *               sms:
 *                 type: boolean
 *               push:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.put(
  "/preferences",
  rateLimiter("notif-prefs-update", 5, 60),
  validate(updatePreferencesSchema),
  notificationController.updatePreferences
);

export default router;
