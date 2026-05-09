import { Router } from "express";

import * as paymentController from "../controllers/payment.controller";

import { validate, validateParams } from "../middlewares/validate.middleware";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { rateLimiter } from "../middlewares/ratelimiter.middleware";

import {
  webhookSchema,
  paymentIdParamSchema,
} from "../validators/payment.validator";

const router = Router();

/**
 * @openapi
 * /api/payments/webhook:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Payment gateway callback (Webhook)
 *     description: Handles success/failure webhooks from Stripe or Razorpay. Verified via signature.
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post(
  "/webhook",
  rateLimiter("payment-webhook", 50, 60),
  validate(webhookSchema),
  paymentController.handleWebhook
);

/* ======================================================
   AUTHENTICATED ROUTES
====================================================== */

router.use(verifyAccessToken);

/**
 * @openapi
 * /api/payments/{paymentId}/refund:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Issue a refund for a payment
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Refund initiated
 */
router.post(
  "/:paymentId/refund",
  rateLimiter("payment-refund", 3, 60),
  validateParams(paymentIdParamSchema),
  paymentController.issueRefund
);

/**
 * @openapi
 * /api/payments/history:
 *   get:
 *     tags:
 *       - Payment
 *     summary: Get paginated payment history
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
 *         description: List of payments
 */
router.get(
  "/history",
  rateLimiter("payment-history", 20, 60),
  paymentController.getPaymentHistory
);

/**
 * @openapi
 * /api/payments/{paymentId}:
 *   get:
 *     tags:
 *       - Payment
 *     summary: Get single payment details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details retrieved
 */
router.get(
  "/:paymentId",
  rateLimiter("payment-get", 30, 60),
  validateParams(paymentIdParamSchema),
  paymentController.getPayment
);

export default router;
