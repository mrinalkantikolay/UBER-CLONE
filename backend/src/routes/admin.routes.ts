import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { validate, validateParams } from "../middlewares/validate.middleware";
import { verifyAdminToken, requirePermission } from "../middlewares/auth.middleware";
import { rateLimiter } from "../middlewares/ratelimiter.middleware";
import {
  adminLoginSchema,
  blockUserSchema,
  refundSchema,
  toggleFeatureSchema,
} from "../validators/admin.validator";

const router = Router();

/* ======================================================
   ADMIN AUTHENTICATION
====================================================== */

/**
 * @openapi
 * /api/admin/login:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Admin login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post(
  "/login",
  rateLimiter("admin-login", 5, 15),
  validate(adminLoginSchema),
  adminController.login
);

/* ======================================================
   PROTECTED ADMIN ROUTES
====================================================== */

router.use(verifyAdminToken);

// Rate limiter for admin API requests
router.use(rateLimiter("admin-api", 100, 60));

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all users (ADMIN ONLY)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved
 */
router.get(
  "/users",
  requirePermission("users:read"),
  adminController.getUsers
);

/**
 * @openapi
 * /api/admin/users/search:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Search users by query (ADMIN ONLY)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results retrieved
 */
router.get(
  "/users/search",
  requirePermission("users:read"),
  adminController.searchUsers
);

/**
 * @openapi
 * /api/admin/drivers:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all drivers (ADMIN ONLY)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of drivers retrieved
 */
router.get(
  "/drivers",
  requirePermission("users:read"),
  adminController.getDrivers
);

/**
 * @openapi
 * /api/admin/drivers/{id}/suspend:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Suspend a driver (ADMIN ONLY)
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
 *         description: Driver suspended
 */
router.patch(
  "/drivers/:id/suspend",
  requirePermission("users:write"),
  validateParams(blockUserSchema),
  adminController.suspendDriver
);

/**
 * @openapi
 * /api/admin/drivers/{id}/unsuspend:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Unsuspend a driver (ADMIN ONLY)
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
 *         description: Driver unsuspended
 */
router.patch(
  "/drivers/:id/unsuspend",
  requirePermission("users:write"),
  validateParams(blockUserSchema),
  adminController.unsuspendDriver
);

/**
 * @openapi
 * /api/admin/documents/{id}/approve:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Approve a driver document (ADMIN ONLY)
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
 *         description: Document approved
 */
router.patch(
  "/documents/:id/approve",
  requirePermission("documents:write"),
  validateParams(blockUserSchema),
  adminController.approveDocument
);

/**
 * @openapi
 * /api/admin/users/{id}/block:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Block a user (ADMIN ONLY)
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
 *         description: User blocked
 */
router.patch(
  "/users/:id/block",
  requirePermission("users:write"),
  validateParams(blockUserSchema),
  adminController.blockUser
);

/**
 * @openapi
 * /api/admin/users/{id}/unblock:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Unblock a user (ADMIN ONLY)
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
 *         description: User unblocked
 */
router.patch(
  "/users/:id/unblock",
  requirePermission("users:write"),
  validateParams(blockUserSchema),
  adminController.unblockUser
);

/**
 * @openapi
 * /api/admin/rides/{id}/force-cancel:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Force cancel a ride (EMERGENCY) (ADMIN ONLY)
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
 *         description: Ride force-cancelled
 */
router.post(
  "/rides/:id/force-cancel",
  requirePermission("rides:cancel"),
  validateParams(blockUserSchema),
  adminController.forceCancelRide
);

/**
 * @openapi
 * /api/admin/rides/{id}/force-complete:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Force complete a ride (ADMIN ONLY)
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
 *         description: Ride force-completed
 */
router.post(
  "/rides/:id/force-complete",
  requirePermission("rides:cancel"),
  validateParams(blockUserSchema),
  adminController.forceCompleteRide
);

/**
 * @openapi
 * /api/admin/payments/refund:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Dispatch a refund for a ride (ADMIN ONLY)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rideId
 *             properties:
 *               rideId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund dispatched
 */
router.post(
  "/payments/refund",
  requirePermission("payments:refund"),
  validate(refundSchema),
  adminController.dispatchRefund
);

/**
 * @openapi
 * /api/admin/feature-flags:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Toggle a system feature flag (ADMIN ONLY)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - flag
 *               - enabled
 *             properties:
 *               flag:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Feature flag toggled
 */
router.put(
  "/feature-flags",
  requirePermission("system:config"),
  validate(toggleFeatureSchema),
  adminController.toggleFeature
);

/**
 * @openapi
 * /api/admin/audit-logs:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get system audit logs (ADMIN ONLY)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Audit logs retrieved
 */
router.get(
  "/audit-logs",
  requirePermission("system:audit"),
  adminController.getAuditLogs
);

/**
 * @openapi
 * /api/admin/health:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get full system health metrics (ADMIN ONLY)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Health report retrieved
 */
router.get(
  "/health",
  requirePermission("system:audit"),
  adminController.getSystemHealth
);

export default router;
