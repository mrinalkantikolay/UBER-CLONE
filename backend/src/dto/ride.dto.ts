import { Ride, Rating } from "@prisma/client";

/* ======================================================
   RIDE DTO
   Strips internal fields. Formats for API response.
====================================================== */

export class RideDTO {
  id: string;
  userId: string;
  driverId: string | null;
  status: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  fare: number | null;
  surgeMultiplier: number;
  cancellationFee: number;
  acceptedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  rating: RatingDTO | null;
  driver: Record<string, unknown> | null;

  constructor(ride: Ride & { rating?: Rating | null; driver?: Record<string, unknown> | null }) {
    this.id = ride.id;
    this.userId = ride.userId;
    this.driverId = ride.driverId;
    this.status = ride.status;
    this.origin = { lat: ride.originLat, lng: ride.originLng };
    this.destination = { lat: ride.destLat, lng: ride.destLng };
    this.fare = ride.fare;
    this.surgeMultiplier = ride.surgeMultiplier;
    this.cancellationFee = ride.cancellationFee;
    this.acceptedAt = ride.acceptedAt;
    this.completedAt = ride.completedAt;
    this.createdAt = ride.createdAt;
    this.rating = ride.rating ? new RatingDTO(ride.rating) : null;
    this.driver = ride.driver ?? null;
  }

  static toDTO(ride: (Ride & { rating?: Rating | null; driver?: Record<string, unknown> | null }) | null): RideDTO | null {
    if (!ride) return null;
    return new RideDTO(ride);
  }

  static toDTOArray(rides: (Ride & { rating?: Rating | null; driver?: Record<string, unknown> | null })[]): RideDTO[] {
    return rides.map((r) => new RideDTO(r));
  }
}

/* ======================================================
   RATING DTO
====================================================== */

export class RatingDTO {
  id: string;
  rideId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;

  constructor(rating: Rating) {
    this.id = rating.id;
    this.rideId = rating.rideId;
    this.rating = rating.rating;
    this.comment = rating.comment;
    this.createdAt = rating.createdAt;
  }
}
