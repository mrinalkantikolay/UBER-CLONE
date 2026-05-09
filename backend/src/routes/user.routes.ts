import { Router } from "express";

import * as userController from "../controllers/user.controller";

import { validate } from "../middlewares/validate.middleware";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { rateLimiter } from "../middlewares/ratelimiter.middleware";
import { uploadProfilePhoto, handleMulterError } from "../middlewares/upload.middleware";

import {
  updateProfileSchema,
  changePasswordSchema,
  addPaymentMethodSchema,
} from "../validators/user.validator";

const router = Router();

/* All user routes require authentication */
router.use(verifyAccessToken);

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags:
 *       - User
 *     summary: Get own profile
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get(
  "/me",
  rateLimiter("user-profile", 30, 60),
  userController.getProfile
);

/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     tags:
 *       - User
 *     summary: Update profile details
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch(
  "/me",
  rateLimiter("user-update", 10, 60),
  validate(updateProfileSchema),
  userController.updateProfile
);

/**
 * @openapi
 * /api/users/me/photo:
 *   patch:
 *     tags:
 *       - User
 *     summary: Upload profile picture
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - photo
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo file (JPEG, PNG, WebP — max 5 MB)
 *     responses:
 *       200:
 *         description: Profile picture updated
 *       400:
 *         description: Invalid file type or size exceeded
 */
router.patch(
  "/me/photo",
  rateLimiter("user-photo", 10, 60),
  uploadProfilePhoto,
  handleMulterError,
  userController.uploadProfilePicture
);

/* ======================================================
   PASSWORD
====================================================== */

/**
 * @openapi
 * /api/users/me/password:
 *   patch:
 *     tags:
 *       - User
 *     summary: Change password
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully. All sessions revoked.
 */
router.patch(
  "/me/password",
  rateLimiter("user-password", 5, 300),
  validate(changePasswordSchema),
  userController.changePassword
);

/* ======================================================
   PAYMENT METHODS
====================================================== */

/**
 * @openapi
 * /api/users/me/payment-methods:
 *   post:
 *     tags:
 *       - User
 *     summary: Add a payment method
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - last4
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [STRIPE, RAZORPAY, UPI]
 *               last4:
 *                 type: string
 *               label:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment method added
 */
router.post(
  "/me/payment-methods",
  rateLimiter("user-payment-add", 10, 60),
  validate(addPaymentMethodSchema),
  userController.addPaymentMethod
);

/**
 * @openapi
 * /api/users/me/payment-methods:
 *   get:
 *     tags:
 *       - User
 *     summary: List all payment methods
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment methods
 */
router.get(
  "/me/payment-methods",
  rateLimiter("user-payment-list", 30, 60),
  userController.getPaymentMethods
);

/* ======================================================
   ACCOUNT
====================================================== */

/**
 * @openapi
 * /api/users/me:
 *   delete:
 *     tags:
 *       - User
 *     summary: Deactivate account
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated. All sessions revoked.
 */
router.delete(
  "/me",
  rateLimiter("user-deactivate", 3, 3600),
  userController.deactivateAccount
);

export default router;
