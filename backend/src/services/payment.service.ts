import crypto from "crypto";

import logger from "../config/logger";
import { redisClient } from "../config/redis";
import prisma from "../config/prisma";
import { KafkaTopics } from "../config/kafka";
import ApiError from "../utils/ApiError";
import auditLogger from "../utils/auditLogger";
import { buildCloudEvent, insertOutboxEvent } from "../utils/outbox";

import paymentModel from "../models/payment.model";
import { createOrder, verifyWebhookSignature } from "../utils/paymentGateway";
import { paymentRefundQueue } from "../queues/paymentRefund.queue";
import { receiptGenerationQueue } from "../queues/receiptGeneration.queue";

/* ======================================================
   PAYMENT SERVICE — CORE ENGINE
   
   All 5 MVP functions:
   1. createPaymentIntent — Kafka RIDE_COMPLETED handler
   2. handleWebhook — Gateway callback processing
   3. issueRefund — Safe state transition + BullMQ
   4. getPaymentById — Single payment lookup
   5. getPaymentHistory — Cursor-based pagination
====================================================== */

/* ======================================================
   REDIS KEYS (per MVP)
====================================================== */

const Keys = {
  idempotency: (userId: string, rideId: string) => `idempotency:payment:${userId}:${rideId}`,
  webhookProcessed: (eventId: string) => `webhook:processed:${eventId}`,
};

/* ======================================================
   HELPERS
====================================================== */

const ensureTraceId = (traceId?: string): string =>
  traceId ?? crypto.randomUUID();

const safeAudit = (
  event: string,
  payload: Record<string, unknown>,
  traceId: string
): void => {
  try {
    auditLogger(event, { ...payload, traceId });
  } catch (err) {
    logger.error({ err, event, traceId }, "AUDIT LOG FAILED");
  }
};

/* ======================================================
   1. CREATE PAYMENT INTENT
   
   Consumed via Kafka RIDE_COMPLETED event.
   
   Flow:
   1. Deduplicate via Redis SET NX
   2. Create DB record (PENDING)
   3. Call payment gateway (via Circuit Breaker)
   4. Update DB with gateway transaction ID
   5. Publish PAYMENT_SUCCESS or PAYMENT_FAILED
====================================================== */

export const createPaymentIntent = async (
  rideId: string,
  userId: string,
  fare: number,
  traceId?: string
): Promise<void> => {
  const tid = ensureTraceId(traceId);

  /* ---- Idempotency — O(1) ---- */
  if (redisClient.isReady) {
    const idempKey = Keys.idempotency(userId, rideId);
    const setResult = await redisClient.set(idempKey, "1", {
      NX: true,
      EX: 3600,
    });
    if (!setResult) {
      logger.info({ rideId, userId, traceId: tid }, "Duplicate payment intent — skipping");
      return;
    }
  }

  /* ---- Check if payment already exists for this ride ---- */
  const existing = await paymentModel.findByRideId(rideId);
  if (existing) {
    logger.info({ rideId, paymentId: existing.id, traceId: tid }, "Payment already exists — skipping");
    return;
  }

  /* ---- Create DB record (PENDING) ---- */
  const payment = await paymentModel.create({
    rideId,
    userId,
    amount: fare,
    status: "PENDING",
  });

  logger.info({ paymentId: payment.id, rideId, amount: fare, traceId: tid }, "Payment intent created (PENDING)");

  /* ---- Call payment gateway (via Circuit Breaker) ---- */
  try {
    const order = await createOrder(fare, rideId, userId);

    /* ---- Transactional Outbox: DB update + PAYMENT_SUCCESS event ---- */
    const updated = await prisma.$transaction(async (tx) => {
      let u;
      try {
        u = await tx.payment.update({
          where: { id: payment.id, status: "PENDING" },
          data: {
            status: "SUCCESS",
            gatewayTransactionId: order.transactionId,
          },
        });
      } catch (err: unknown) {
        if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2025") {
          return null;
        }
        throw err;
      }

      await insertOutboxEvent(tx, KafkaTopics.PAYMENT_SUCCESS, buildCloudEvent(
        "payment.success",
        {
          rideId,
          paymentId: payment.id,
          amount: fare,
          gatewayTransactionId: order.transactionId,
        },
        tid
      ));

      return u;
    });

    if (!updated) {
      logger.warn({ paymentId: payment.id, traceId: tid }, "Payment status update failed — not in PENDING state");
      return;
    }

    /* ---- Queue receipt generation ---- */
    try {
      await receiptGenerationQueue.add(`receipt:${rideId}`, {
        paymentId: payment.id,
        rideId,
        userId,
        amount: fare,
        traceId: tid,
      });
    } catch (err) {
      logger.error({ err, paymentId: payment.id, traceId: tid }, "Failed to queue receipt generation");
    }

    safeAudit("payment:success", { paymentId: payment.id, rideId, amount: fare }, tid);
    logger.info({ paymentId: payment.id, transactionId: order.transactionId, traceId: tid }, "Payment successful (outbox event queued)");

  } catch (err) {
    /* Gateway call failed — Transactional Outbox: mark FAILED + PAYMENT_FAILED event */
    logger.error({ err, paymentId: payment.id, rideId, traceId: tid }, "Payment gateway failed");

    await prisma.$transaction(async (tx) => {
      try {
        await tx.payment.update({
          where: { id: payment.id, status: "PENDING" },
          data: { status: "FAILED" },
        });
      } catch (updateErr: unknown) {
        if (updateErr && typeof updateErr === "object" && "code" in updateErr && (updateErr as { code: string }).code === "P2025") {
          return; // Already changed status
        }
        throw updateErr;
      }

      await insertOutboxEvent(tx, KafkaTopics.PAYMENT_FAILED, buildCloudEvent(
        "payment.failed",
        {
          rideId,
          paymentId: payment.id,
          reason: "Payment gateway error",
        },
        tid
      ));
    });

    safeAudit("payment:failed", { paymentId: payment.id, rideId, reason: "gateway_error" }, tid);
  }
};

/* ======================================================
   2. HANDLE WEBHOOK
   
   Called by the payment gateway (Razorpay/Stripe) callback.
   
   Flow:
   1. Deduplicate via Redis SET NX
   2. Verify cryptographic signature
   3. Atomic DB update: PENDING → SUCCESS or FAILED
   4. Publish SAGA completion event
====================================================== */

export const handleWebhook = async (
  eventId: string,
  signature: string,
  rideId: string,
  gatewayTransactionId: string,
  status: "success" | "failed",
  webhookSecret: string,
  traceId?: string
): Promise<void> => {
  const tid = ensureTraceId(traceId);

  /* ---- Deduplicate webhook — O(1) ---- */
  if (redisClient.isReady) {
    const dedupKey = Keys.webhookProcessed(eventId);
    const setResult = await redisClient.set(dedupKey, "1", {
      NX: true,
      EX: 86400,
    });
    if (!setResult) {
      logger.info({ eventId, rideId, traceId: tid }, "Duplicate webhook — skipping");
      return;
    }
  }

  /* ---- Verify signature ---- */
  const isValid = verifyWebhookSignature(
    JSON.stringify({ eventId, rideId, gatewayTransactionId, status }),
    signature,
    webhookSecret
  );

  if (!isValid) {
    logger.warn({ eventId, rideId, traceId: tid }, "Invalid webhook signature — rejecting");
    throw new ApiError(401, "Invalid webhook signature");
  }

  /* ---- Find payment ---- */
  const payment = await paymentModel.findByRideId(rideId);
  if (!payment) {
    logger.warn({ rideId, eventId, traceId: tid }, "Webhook received for unknown ride — ignoring");
    return;
  }

  if (status === "success") {
    /* ---- Transactional Outbox: PENDING → SUCCESS + PAYMENT_SUCCESS event ---- */
    const updated = await prisma.$transaction(async (tx) => {
      let u;
      try {
        u = await tx.payment.update({
          where: { id: payment.id, status: "PENDING" },
          data: {
            status: "SUCCESS",
            gatewayTransactionId,
          },
        });
      } catch (err: unknown) {
        if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2025") {
          return null;
        }
        throw err;
      }

      await insertOutboxEvent(tx, KafkaTopics.PAYMENT_SUCCESS, buildCloudEvent(
        "payment.success",
        {
          rideId,
          paymentId: payment.id,
          amount: payment.amount,
          gatewayTransactionId,
        },
        tid
      ));

      return u;
    });

    if (!updated) {
      logger.info({ paymentId: payment.id, traceId: tid }, "Payment already processed — ignoring webhook");
      return;
    }

    /* Queue receipt */
    try {
      await receiptGenerationQueue.add(`receipt:${rideId}`, {
        paymentId: payment.id,
        rideId,
        userId: payment.userId,
        amount: payment.amount,
        traceId: tid,
      });
    } catch (err) {
      logger.error({ err, traceId: tid }, "Failed to queue receipt from webhook");
    }

    safeAudit("payment:webhook_success", { paymentId: payment.id, rideId, eventId }, tid);
    logger.info({ paymentId: payment.id, rideId, traceId: tid }, "Webhook processed — payment SUCCESS (outbox event queued)");

  } else {
    /* ---- Transactional Outbox: PENDING → FAILED + PAYMENT_FAILED event ---- */
    await prisma.$transaction(async (tx) => {
      try {
        await tx.payment.update({
          where: { id: payment.id, status: "PENDING" },
          data: { status: "FAILED" },
        });
      } catch (err: unknown) {
        if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2025") {
          return;
        }
        throw err;
      }

      await insertOutboxEvent(tx, KafkaTopics.PAYMENT_FAILED, buildCloudEvent(
        "payment.failed",
        {
          rideId,
          paymentId: payment.id,
          reason: "Gateway reported failure",
        },
        tid
      ));
    });

    safeAudit("payment:webhook_failed", { paymentId: payment.id, rideId, eventId }, tid);
    logger.info({ paymentId: payment.id, rideId, traceId: tid }, "Webhook processed — payment FAILED (outbox event queued)");
  }
};

/* ======================================================
   3. ISSUE REFUND
   
   Safe state transition: SUCCESS → REFUND_PROCESSING.
   Actual refund is processed asynchronously via BullMQ.
====================================================== */

export const issueRefund = async (
  paymentId: string,
  userId: string,
  traceId?: string
): Promise<void> => {
  const tid = ensureTraceId(traceId);

  const payment = await paymentModel.findById(paymentId);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.userId !== userId) throw new ApiError(403, "Not your payment");

  if (payment.status !== "SUCCESS") {
    throw new ApiError(400, `Cannot refund payment in ${payment.status} status`);
  }

  if (!payment.gatewayTransactionId) {
    throw new ApiError(400, "Payment has no gateway transaction — cannot refund");
  }

  /* ---- Atomic: SUCCESS → REFUND_PROCESSING ---- */
  const updated = await paymentModel.updateStatus(
    paymentId,
    "SUCCESS",
    "REFUND_PROCESSING"
  );

  if (!updated) {
    throw new ApiError(409, "Payment status changed — cannot refund");
  }

  /* ---- Add to BullMQ refund queue ---- */
  await paymentRefundQueue.add(`refund:${payment.rideId}`, {
    paymentId,
    rideId: payment.rideId,
    gatewayTransactionId: payment.gatewayTransactionId,
    amount: payment.amount,
    traceId: tid,
  });

  safeAudit("payment:refund_initiated", { paymentId, rideId: payment.rideId }, tid);
  logger.info({ paymentId, rideId: payment.rideId, traceId: tid }, "Refund initiated — added to queue");
};

/* ======================================================
   4. GET PAYMENT BY ID
====================================================== */

export const getPaymentById = async (
  paymentId: string,
  userId: string
): Promise<any> => {
  const payment = await paymentModel.findById(paymentId);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.userId !== userId) throw new ApiError(403, "Not your payment");
  return payment;
};

/* ======================================================
   5. PAYMENT HISTORY — Cursor-based pagination
====================================================== */

export const getPaymentHistory = async (
  userId: string,
  limit: number = 10,
  cursor?: string
) => {
  const payments = await paymentModel.findByUserId(userId, limit, cursor);

  return {
    payments,
    nextCursor: payments.length === limit ? payments[payments.length - 1].id : null,
    hasMore: payments.length === limit,
  };
};
