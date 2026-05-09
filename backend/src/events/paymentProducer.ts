import crypto from "crypto";

import { publishEvent, KafkaTopics, CloudEvent } from "../config/kafka";
import env from "../config/env";

/* ======================================================
   PAYMENT SERVICE — KAFKA PRODUCERS
   
   Publishes SAGA completion events:
   1. PAYMENT_SUCCESS → Rider Service (COMPLETED_UNPAID → COMPLETED_PAID)
   2. PAYMENT_FAILED → Rider Service (notifies rider to retry)
====================================================== */

type PaymentSuccessPayload = {
  rideId: string;
  paymentId: string;
  amount: number;
  gatewayTransactionId: string;
};

type PaymentFailedPayload = {
  rideId: string;
  paymentId: string;
  reason: string;
};

/**
 * Publish PAYMENT_SUCCESS → Rider Service.
 * SAGA completion — ride transitions to COMPLETED_PAID.
 */
export const publishPaymentSuccess = async (
  rideId: string,
  paymentId: string,
  amount: number,
  gatewayTransactionId: string,
  traceId: string
): Promise<void> => {
  const event: CloudEvent<PaymentSuccessPayload> = {
    eventId: crypto.randomUUID(),
    version: "1.0",
    type: "payment.success",
    source: env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
    traceId,
    payload: { rideId, paymentId, amount, gatewayTransactionId },
  };

  await publishEvent(KafkaTopics.PAYMENT_SUCCESS, event);
};

/**
 * Publish PAYMENT_FAILED → Rider Service.
 * Rider notified to try alternative payment.
 */
export const publishPaymentFailed = async (
  rideId: string,
  paymentId: string,
  reason: string,
  traceId: string
): Promise<void> => {
  const event: CloudEvent<PaymentFailedPayload> = {
    eventId: crypto.randomUUID(),
    version: "1.0",
    type: "payment.failed",
    source: env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
    traceId,
    payload: { rideId, paymentId, reason },
  };

  await publishEvent(KafkaTopics.PAYMENT_FAILED, event);
};
