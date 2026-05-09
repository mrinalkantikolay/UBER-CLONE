import crypto from "crypto";

import { publishEvent, KafkaTopics, CloudEvent } from "../config/kafka";
import env from "../config/env";

/* ======================================================
   MATCHING SERVICE — KAFKA PRODUCERS
   
   Publishes CloudEvents-compliant messages for:
   1. DRIVER_ASSIGNED → consumed by Rider Service
   2. MATCH_FAILED → consumed by Rider Service
   3. DRIVER_DISPATCH → consumed by WS Gateway (real-time)
====================================================== */

/* ---- Payload Types ---- */

type DriverAssignedPayload = {
  rideId: string;
  driverId: string;
};

type MatchFailedPayload = {
  rideId: string;
  reason: string;
};

type DriverDispatchPayload = {
  driverId: string;
  rideId: string;
  userId: string;
  pickup: { lng: number; lat: number };
  destination: { lng: number; lat: number };
  fare: number;
  surgeMultiplier: number;
};

/* ---- Publishers ---- */

/**
 * Publish DRIVER_ASSIGNED → Rider Service updates ride status.
 * O(1) — single Kafka produce.
 */
export const publishDriverAssigned = async (
  rideId: string,
  driverId: string,
  traceId: string
): Promise<void> => {
  const event: CloudEvent<DriverAssignedPayload> = {
    eventId: crypto.randomUUID(),
    version: "1.0",
    type: "driver.assigned",
    source: env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
    traceId,
    payload: { rideId, driverId },
  };

  await publishEvent(KafkaTopics.DRIVER_ASSIGNED, event);
};

/**
 * Publish MATCH_FAILED → Rider Service cancels the ride.
 * O(1) — single Kafka produce.
 */
export const publishMatchFailed = async (
  rideId: string,
  reason: string,
  traceId: string
): Promise<void> => {
  const event: CloudEvent<MatchFailedPayload> = {
    eventId: crypto.randomUUID(),
    version: "1.0",
    type: "match.failed",
    source: env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
    traceId,
    payload: { rideId, reason },
  };

  await publishEvent(KafkaTopics.MATCH_FAILED, event);
};

/**
 * Publish DRIVER_DISPATCH → WS Gateway rings the driver's phone.
 * O(1) — single Kafka produce.
 */
export const publishDriverDispatch = async (
  data: DriverDispatchPayload,
  traceId: string
): Promise<void> => {
  const event: CloudEvent<DriverDispatchPayload> = {
    eventId: crypto.randomUUID(),
    version: "1.0",
    type: "driver.dispatch",
    source: env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
    traceId,
    payload: data,
  };

  await publishEvent(KafkaTopics.DRIVER_DISPATCH, event);
};
