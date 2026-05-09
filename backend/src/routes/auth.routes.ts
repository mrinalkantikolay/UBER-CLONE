import { Router } from "express";

import * as authController from "../controllers/auth.controller";

import { validate } from "../middlewares/validate.middleware";
import { verifyAccessToken, verifyAccessTokenAllowExpired } from "../middlewares/auth.middleware";
import { rateLimiter } from "../middlewares/ratelimiter.middleware";

import {
  signupSchema,
  loginSchema,
  sendOTPSchema,
  verifyOTPSchema,
  completeOTPLoginSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

const router = Router();

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/signup",
  rateLimiter("signup", 10, 60),
  validate(signupSchema),
  authController.signup
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login user
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
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account locked or OTP required
 */
router.post(
  "/login",
  rateLimiter("login", 10, 60),
  validate(loginSchema),
  authController.login
);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Refresh access token
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid/Expired refresh token
 */
router.post(
  "/refresh",
  rateLimiter("refresh", 20, 60),
  authController.refreshToken
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout user from current session
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post(
  "/logout",
  verifyAccessTokenAllowExpired,
  authController.logout
);

/**
 * @openapi
 * /api/auth/logout-all:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout user from all devices
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices
 */
router.post(
  "/logout-all",
  verifyAccessToken,
  authController.logoutAll
);

/* ======================================================
   OTP
====================================================== */

/**
 * @openapi
 * /api/auth/send-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Send OTP for verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post(
  "/send-otp",
  rateLimiter("otp", 5, 300),
  validate(sendOTPSchema),
  authController.sendOTP
);

/**
 * @openapi
 * /api/auth/verify-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - requestId
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               requestId:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 */
router.post(
  "/verify-otp",
  rateLimiter("verify-otp", 5, 300),
  validate(verifyOTPSchema),
  authController.verifyOTP
);

/**
 * @openapi
 * /api/auth/complete-otp-login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Complete login with OTP (for HIGH_RISK)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - requestId
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               requestId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login completed
 */
router.post(
  "/complete-otp-login",
  rateLimiter("complete-otp-login", 5, 300),
  validate(completeOTPLoginSchema),
  authController.completeOTPLogin
);

/* ======================================================
   PASSWORD RESET
====================================================== */

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset password using OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - requestId
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               requestId:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post(
  "/reset-password",
  rateLimiter("reset-password", 5, 300),
  validate(resetPasswordSchema),
  authController.resetPassword
);

export default router;