import crypto from "crypto";
import { Ride } from "@prisma/client";

import { publishEvent, KafkaTopics, CloudEvent } from "../config/kafka";
import env from "../config/env";

/* ======================================================
   RIDE EVENT PRODUCER
   
   Publishes CloudEvents-compliant messages to Kafka.
   All events include traceId for end-to-end correlation.
====================================================== */

type RideRequestedPayload = {
  rideId: string;
  userId: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  fare: number | null;
  surgeMultiplier: number;
};

type RideCancelledPayload = {
  rideId: string;
  userId: string;
  driverId: string | null;
  cancellationFee: number;
  previousStatus: string;
};

type RideCompletedPayload = {
  rideId: string;
  userId: string;
  driverId: string | null;
  fare: number | null;
};

/**
 * Publish RIDE_REQUESTED → consumed by Matching Service.
 * O(1) — single Kafka produce.
 */
export const publishRideRequested = async (
  ride: Ride,
  traceId: string
): Promise<void> => {
  const event: CloudEvent<RideRequestedPayload> = {
    eventId: crypto.randomUUID(),
    version: "1.0",
    type: "ride.requested",
    source: env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
    traceId,
    payload: {
      rideId: ride.id,
      userId: ride.userId,
      originLat: ride.originLat,
      originLng: ride.originLng,
      destLat: ride.destLat,
      destLng: ride.destLng,
      fare: ride.fare,
      surgeMultiplier: ride.surgeMultiplier,
    },
  };

  await publishEvent(KafkaTopics.RIDE_REQUESTED, event);
};

/**
 * Publish RIDE_CANCELLED → consumed by Matching Service.
 * Releases driver lock immediately if still matching.
 * O(1) — single Kafka produce.
 */
export const publishRideCancelled = async (
  ride: Ride,
  cancellationFee: number,
  traceId: string
): Promise<void> => {
  const event: CloudEvent<RideCancelledPayload> = {
    eventId: crypto.randomUUID(),
    version: "1.0",
    type: "ride.cancelled",
    source: env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
    traceId,
    payload: {
      rideId: ride.id,
      userId: ride.userId,
      driverId: ride.driverId,
      cancellationFee,
      previousStatus: ride.status,
    },
  };

  await publishEvent(KafkaTopics.RIDE_CANCELLED, event);
};

/**
 * Publish RIDE_COMPLETED → consumed by Payment Service.
 * Triggers payment intent creation.
 * O(1) — single Kafka produce.
 */
export const publishRideCompleted = async (
  ride: Ride,
  traceId: string
): Promise<void> => {
  const event: CloudEvent<RideCompletedPayload> = {
    eventId: crypto.randomUUID(),
    version: "1.0",
    type: "ride.completed",
    source: env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
    traceId,
    payload: {
      rideId: ride.id,
      userId: ride.userId,
      driverId: ride.driverId,
      fare: ride.fare,
    },
  };

  await publishEvent(KafkaTopics.RIDE_COMPLETED, event);
};
