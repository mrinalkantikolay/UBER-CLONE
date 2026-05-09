import { Router } from "express";

import * as driverController from "../controllers/driver.controller";

import { validate } from "../middlewares/validate.middleware";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { rateLimiter } from "../middlewares/ratelimiter.middleware";
import { uploadDocument, handleMulterError } from "../middlewares/upload.middleware";

import { requireRole } from "../middlewares/role.middleware";

import {
  registerDriverSchema,
  updateStatusSchema,
  addVehicleSchema,
  updateVehicleSchema,
  verifyDocumentSchema,
} from "../validators/driver.validator";

const router = Router();

/* All driver routes require authentication */
router.use(verifyAccessToken);

/**
 * @openapi
 * /api/drivers/register:
 *   post:
 *     tags:
 *       - Driver
 *     summary: Register authenticated user as a driver
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleNumber
 *               - licenseNumber
 *             properties:
 *               vehicleNumber:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Driver registered successfully
 */
router.post(
  "/register",
  rateLimiter("driver-register", 5, 3600),
  validate(registerDriverSchema),
  driverController.registerDriver
);

/**
 * @openapi
 * /api/drivers/me:
 *   get:
 *     tags:
 *       - Driver
 *     summary: Get driver profile with vehicle and documents
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Driver profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get(
  "/me",
  rateLimiter("driver-profile", 30, 60),
  driverController.getDriverProfile
);

/* ======================================================
   STATUS
====================================================== */

/**
 * @openapi
 * /api/drivers/status:
 *   patch:
 *     tags:
 *       - Driver
 *     summary: Toggle driver availability status
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, BUSY, OFFLINE]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  "/status",
  rateLimiter("driver-status", 30, 60),
  validate(updateStatusSchema),
  driverController.updateStatus
);

/* ======================================================
   VEHICLE
====================================================== */

/**
 * @openapi
 * /api/drivers/vehicle:
 *   post:
 *     tags:
 *       - Driver
 *     summary: Add a vehicle (1:1 per driver)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - make
 *               - model
 *               - year
 *               - licensePlate
 *               - color
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [SEDAN, SUV, HATCHBACK, AUTO, BIKE]
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               licensePlate:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vehicle added
 */
router.post(
  "/vehicle",
  rateLimiter("driver-vehicle", 10, 60),
  validate(addVehicleSchema),
  driverController.addVehicle
);

/**
 * @openapi
 * /api/drivers/vehicle:
 *   patch:
 *     tags:
 *       - Driver
 *     summary: Update vehicle details
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               licensePlate:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vehicle updated
 */
router.patch(
  "/vehicle",
  rateLimiter("driver-vehicle-update", 10, 60),
  validate(updateVehicleSchema),
  driverController.updateVehicle
);

/* ======================================================
   DOCUMENTS
====================================================== */

/**
 * @openapi
 * /api/drivers/documents:
 *   post:
 *     tags:
 *       - Driver
 *     summary: Upload a compliance document
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *               - type
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Document file (JPEG, PNG, WebP, PDF — max 10 MB)
 *               type:
 *                 type: string
 *                 enum: [LICENSE, REGISTRATION, INSURANCE, AADHAR, PAN]
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional document expiration date
 *     responses:
 *       201:
 *         description: Document uploaded and queued for verification
 *       400:
 *         description: Invalid file type, size exceeded, or missing fields
 */
router.post(
  "/documents",
  rateLimiter("driver-doc-add", 10, 60),
  uploadDocument,
  handleMulterError,
  driverController.addDocument
);

/**
 * @openapi
 * /api/drivers/documents:
 *   get:
 *     tags:
 *       - Driver
 *     summary: List all driver documents
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get(
  "/documents",
  rateLimiter("driver-doc-list", 30, 60),
  driverController.getDocuments
);

/**
 * @openapi
 * /api/drivers/documents/{id}:
 *   delete:
 *     tags:
 *       - Driver
 *     summary: Delete a document
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
 *         description: Document deleted
 */
router.delete(
  "/documents/:id",
  rateLimiter("driver-doc-delete", 10, 60),
  driverController.deleteDocument
);

/**
 * @openapi
 * /api/drivers/documents/{id}/verify:
 *   patch:
 *     tags:
 *       - Driver
 *     summary: Approve or reject a document (ADMIN ONLY)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - verified
 *             properties:
 *               verified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Verification status updated
 */
router.patch(
  "/documents/:id/verify",
  rateLimiter("driver-doc-verify", 20, 60),
  requireRole("ADMIN"),
  validate(verifyDocumentSchema),
  driverController.verifyDocument
);

export default router;
