import logger from "../config/logger";

/* ======================================================
   NOTIFICATION PROVIDER ABSTRACTION
   
   Multi-channel delivery with Circuit Breaker protection.
   Each provider (Email, SMS, Push) has its own circuit breaker.
   
   Production swap:
   - Email: Replace stub with SendGrid/AWS SES SDK
   - SMS: Replace stub with Twilio SDK
   - Push: Replace stub with Firebase Cloud Messaging (FCM)
====================================================== */

/* ======================================================
   CIRCUIT BREAKER (same lightweight pattern as paymentGateway.ts)
====================================================== */

enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private totalCount = 0;
  private lastFailureTime = 0;
  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly minimumCalls: number;
  private readonly resetTimeoutMs: number;

  constructor(name: string, failureThreshold = 50, minimumCalls = 10, resetTimeoutMs = 30000) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.minimumCalls = minimumCalls;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        logger.info({ provider: this.name }, "Circuit breaker → HALF_OPEN");
      } else {
        throw new Error(`Circuit breaker OPEN — ${this.name} provider temporarily unavailable`);
      }
    }

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
    this.totalCount++;
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
      this.totalCount = 0;
      logger.info({ provider: this.name }, "Circuit breaker → CLOSED (recovered)");
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.totalCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      return;
    }

    if (
      this.totalCount >= this.minimumCalls &&
      (this.failureCount / this.totalCount) * 100 >= this.failureThreshold
    ) {
      this.state = CircuitState.OPEN;
      logger.warn({ provider: this.name, failures: this.failureCount }, "Circuit breaker → OPEN");
    }
  }

  getState(): CircuitState { return this.state; }
}

/* ======================================================
   PROVIDER INTERFACES
====================================================== */

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendSMSOptions {
  to: string;
  message: string;
}

export interface SendPushOptions {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/* ======================================================
   CIRCUIT BREAKER INSTANCES — One per provider
====================================================== */

const emailCircuit = new CircuitBreaker("email", 50, 10, 30000);
const smsCircuit = new CircuitBreaker("sms", 50, 10, 30000);
const pushCircuit = new CircuitBreaker("push", 50, 10, 30000);

/* ======================================================
   STUB PROVIDERS
   Replace these with real SDK calls in production.
====================================================== */

/**
 * STUB: Send email via SendGrid/SES.
 * Simulates 95% success rate.
 */
export const sendEmailNotification = async (opts: SendEmailOptions): Promise<void> => {
  return emailCircuit.execute(async () => {
    await new Promise((r) => setTimeout(r, 20 + Math.random() * 50));

    if (Math.random() < 0.05) {
      throw new Error("EMAIL_PROVIDER_ERROR: SendGrid temporarily unavailable");
    }

    logger.info(
      { to: opts.to, subject: opts.subject },
      "STUB: Email sent successfully"
    );
  });
};

/**
 * STUB: Send SMS via Twilio.
 * Simulates 95% success rate.
 */
export const sendSMSNotification = async (opts: SendSMSOptions): Promise<void> => {
  return smsCircuit.execute(async () => {
    await new Promise((r) => setTimeout(r, 20 + Math.random() * 50));

    if (Math.random() < 0.05) {
      throw new Error("SMS_PROVIDER_ERROR: Twilio temporarily unavailable");
    }

    logger.info(
      { to: opts.to },
      "STUB: SMS sent successfully"
    );
  });
};

/**
 * STUB: Send push notification via FCM.
 * Simulates 95% success rate.
 */
export const sendPushNotification = async (opts: SendPushOptions): Promise<void> => {
  return pushCircuit.execute(async () => {
    await new Promise((r) => setTimeout(r, 10 + Math.random() * 30));

    if (Math.random() < 0.05) {
      throw new Error("PUSH_PROVIDER_ERROR: FCM temporarily unavailable");
    }

    logger.info(
      { userId: opts.userId, title: opts.title },
      "STUB: Push notification sent successfully"
    );
  });
};

/**
 * Get circuit breaker states (for health/metrics endpoints).
 */
export const getProviderHealth = () => ({
  email: emailCircuit.getState(),
  sms: smsCircuit.getState(),
  push: pushCircuit.getState(),
});
