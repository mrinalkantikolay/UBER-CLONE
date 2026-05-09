import { Request, Response } from "express";
import crypto from "crypto";

import * as paymentService from "../services/payment.service";
import asyncHandler from "../utils/asyncHandler";
import { apiResponse } from "../utils/apiResponse";
import { AuthRequest } from "../middlewares/auth.middleware";

/* ======================================================
   TRACE ID
====================================================== */

const getTraceId = (req: Request): string =>
  (req.headers["x-trace-id"] as string) ?? crypto.randomUUID();

/* ======================================================
   1. WEBHOOK HANDLER
   POST /api/payments/webhook
   
   Called by the payment gateway (Razorpay/Stripe).
   No auth required — verified via cryptographic signature.
====================================================== */

export const handleWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const traceId = getTraceId(req);
    const { eventId, signature, rideId, gatewayTransactionId, status } = req.body;

    await paymentService.handleWebhook(
      eventId,
      signature,
      rideId,
      gatewayTransactionId,
      status,
      "test_webhook_secret", // In production: env.WEBHOOK_SECRET
      traceId
    );

    return apiResponse(res, 200, "Webhook processed");
  }
);

/* ======================================================
   2. ISSUE REFUND
   POST /api/payments/:paymentId/refund
====================================================== */

export const issueRefund = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const traceId = getTraceId(req);
    const userId = req.user!.id;
    const paymentId = req.params.paymentId as string;

    await paymentService.issueRefund(paymentId, userId, traceId);

    return apiResponse(res, 200, "Refund initiated");
  }
);

/* ======================================================
   3. GET PAYMENT BY ID
   GET /api/payments/:paymentId
====================================================== */

export const getPayment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const paymentId = req.params.paymentId as string;

    const payment = await paymentService.getPaymentById(paymentId, userId);

    return apiResponse(res, 200, "Payment retrieved", { payment });
  }
);

/* ======================================================
   4. PAYMENT HISTORY
   GET /api/payments/history?cursor=x&limit=10
====================================================== */

export const getPaymentHistory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const result = await paymentService.getPaymentHistory(userId, limit, cursor);

    return apiResponse(res, 200, "Payment history retrieved", {
      payments: result.payments,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  }
);
