/* ======================================================
   MATCHING SERVICE — SHARED TYPES
====================================================== */

/**
 * Matching lifecycle states.
 * Stored in Redis at `matching:{rideId}:status`.
 */
export enum MatchingStatus {
  MATCHING = "MATCHING",       // Finding nearby drivers
  DISPATCHED = "DISPATCHED",   // Waiting for driver response
  MATCHED = "MATCHED",         // Driver accepted
  FAILED = "FAILED",           // No driver found after all retries
  CANCELLED = "CANCELLED",     // Rider cancelled during matching
}

/**
 * A driver candidate from GEOSEARCH, sorted by distance (ascending).
 */
export interface DriverCandidate {
  driverId: string;
  distance: number;            // km from pickup point
  coordinates: {
    longitude: number;
    latitude: number;
  };
}

/**
 * BullMQ job data for the matching-timeout queue.
 * Contains the state needed to continue matching if driver doesn't respond.
 */
export interface MatchTimeoutJobData {
  rideId: string;
  driverId: string;
  userId: string;
  originLng: number;
  originLat: number;
  destLng: number;
  destLat: number;
  fare: number;
  surgeMultiplier: number;
  remainingDrivers: DriverCandidate[];
  attempt: number;
  traceId: string;
}
