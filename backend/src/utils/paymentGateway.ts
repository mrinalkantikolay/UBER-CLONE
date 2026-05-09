import crypto from "crypto";
import logger from "../config/logger";

/* ======================================================
   PAYMENT GATEWAY — STUB IMPLEMENTATION
   
   Simulates Razorpay/Stripe payment gateway behavior.
   Replace this file with real SDK integration for production.
   
   Features:
   - createOrder() → returns mock transaction ID
   - verifyWebhookSignature() → validates test secret
   - processRefund() → returns mock refund ID
   - Built-in Circuit Breaker (lightweight, no dependencies)
   
   Production swap:
   - Replace createOrder with Razorpay.orders.create()
   - Replace verifyWebhookSignature with Razorpay.validateWebhookSignature()
   - Replace processRefund with Razorpay.payments.refund()
====================================================== */

/* ======================================================
   CIRCUIT BREAKER — Lightweight implementation
   
   Wraps external calls to prevent cascading failures.
   If 50% of requests fail over the last 10 requests,
   the circuit opens and rejects immediately with 503.
   
   States: CLOSED (normal) → OPEN (rejecting) → HALF_OPEN (testing)
====================================================== */

enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalCount = 0;
  private lastFailureTime = 0;

  private readonly failureThreshold: number;  // percentage (0-100)
  private readonly minimumCalls: number;       // min calls before tripping
  private readonly resetTimeoutMs: number;     // ms before trying HALF_OPEN

  constructor(
    failureThreshold = 50,
    minimumCalls = 10,
    resetTimeoutMs = 30000
  ) {
    this.failureThreshold = failureThreshold;
    this.minimumCalls = minimumCalls;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  async execute<T>(fn: () => Promise<T>, fallback?: string): Promise<T> {
    /* ---- OPEN: reject immediately ---- */
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        logger.info("Circuit breaker → HALF_OPEN (testing)");
      } else {
        throw new Error(
          fallback ?? "Circuit breaker OPEN — payment gateway temporarily unavailable"
        );
      }
    }

    /* ---- CLOSED or HALF_OPEN: attempt the call ---- */
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.successCount++;
    this.totalCount++;

    if (this.state === CircuitState.HALF_OPEN) {
      /* Successful test call → close the circuit */
      this.state = CircuitState.CLOSED;
      this.reset();
      logger.info("Circuit breaker → CLOSED (recovered)");
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.totalCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      /* Failed test call → reopen */
      this.state = CircuitState.OPEN;
      logger.warn("Circuit breaker → OPEN (half-open test failed)");
      return;
    }

    /* Check if we should trip the circuit */
    if (
      this.totalCount >= this.minimumCalls &&
      (this.failureCount / this.totalCount) * 100 >= this.failureThreshold
    ) {
      this.state = CircuitState.OPEN;
      logger.warn(
        { failures: this.failureCount, total: this.totalCount },
        "Circuit breaker → OPEN (threshold exceeded)"
      );
    }
  }

  private reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.totalCount = 0;
  }

  getState(): CircuitState {
    return this.state;
  }
}

/* ======================================================
   GATEWAY STUB — Simulates payment operations
====================================================== */

/* Circuit breaker instance for the gateway */
const circuitBreaker = new CircuitBreaker(50, 10, 30000);

/**
 * STUB: Simulate creating a payment order/intent.
 * 
 * In production, replace with:
 *   Razorpay: razorpay.orders.create({ amount, currency, receipt: rideId })
 *   Stripe: stripe.paymentIntents.create({ amount, idempotencyKey: rideId })
 * 
 * The stub succeeds 90% of the time to simulate real-world behavior.
 */
export const createOrder = async (
  amount: number,
  rideId: string,
  _userId: string
): Promise<{ transactionId: string; status: "created" }> => {
  return circuitBreaker.execute(async () => {
    /* Simulate network latency */
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

    /* 10% simulated failure rate */
    if (Math.random() < 0.1) {
      throw new Error("GATEWAY_ERROR: Payment gateway temporarily unavailable");
    }

    const transactionId = `txn_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;

    logger.info(
      { transactionId, amount, rideId },
      "STUB: Payment order created successfully"
    );

    return { transactionId, status: "created" as const };
  });
};

/**
 * STUB: Verify webhook signature.
 * 
 * In production, replace with:
 *   Razorpay: Razorpay.validateWebhookSignature(body, signature, webhookSecret)
 *   Stripe: stripe.webhooks.constructEvent(body, signature, webhookSecret)
 * 
 * The stub accepts "test_webhook_secret" as valid signature.
 */
export const verifyWebhookSignature = (
  _body: string,
  signature: string,
  _webhookSecret: string
): boolean => {
  /* In stub mode, accept "test_webhook_secret" OR any non-empty signature */
  if (!signature) return false;
  return signature === "test_webhook_secret" || signature.length > 0;
};

/**
 * STUB: Process a refund.
 * 
 * In production, replace with:
 *   Razorpay: razorpay.payments.refund(transactionId, { amount })
 *   Stripe: stripe.refunds.create({ payment_intent: transactionId, amount })
 */
export const processRefund = async (
  transactionId: string,
  amount: number
): Promise<{ refundId: string; status: "processed" }> => {
  return circuitBreaker.execute(async () => {
    /* Simulate network latency */
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

    /* 5% simulated failure for refunds */
    if (Math.random() < 0.05) {
      throw new Error("GATEWAY_ERROR: Refund processing failed");
    }

    const refundId = `rfnd_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;

    logger.info(
      { refundId, transactionId, amount },
      "STUB: Refund processed successfully"
    );

    return { refundId, status: "processed" as const };
  });
};

/**
 * Get the current circuit breaker state (for health checks).
 */
export const getCircuitBreakerState = (): string => {
  return circuitBreaker.getState();
};
