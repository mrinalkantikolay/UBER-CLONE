import prisma from "../config/prisma";
import { Prisma, Ride, RideStatus, Rating } from "@prisma/client";

/* ======================================================
   RIDE MODEL
   Pure data-access layer. O(1) or O(log N) operations.
   No business logic — that lives in ride.service.ts.
====================================================== */

class RideModel {

  /* ---- CREATE ---- O(1) */

  async createRide(data: Prisma.RideUncheckedCreateInput): Promise<Ride> {
    return prisma.ride.create({ data });
  }

  /* ---- FIND BY ID ---- O(1) PK lookup */

  async findById(id: string): Promise<Ride | null> {
    return prisma.ride.findUnique({ where: { id } });
  }

  /* ---- FIND BY ID WITH RELATIONS ---- O(1) */

  async findByIdWithRelations(id: string) {
    return prisma.ride.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, profilePhotoUrl: true },
        },
        driver: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, profilePhotoUrl: true },
            },
            vehicle: true,
          },
        },
        rating: true,
      },
    });
  }

  /* ---- FIND BY IDEMPOTENCY KEY ---- O(1) unique index */

  async findByIdempotencyKey(key: string): Promise<Ride | null> {
    return prisma.ride.findUnique({ where: { idempotencyKey: key } });
  }

  /* ---- FIND ACTIVE RIDE ---- O(log N) compound index [userId, status] */

  async findActiveRideByUserId(userId: string): Promise<Ride | null> {
    return prisma.ride.findFirst({
      where: {
        userId,
        status: {
          in: ["REQUESTED", "ACCEPTED", "IN_PROGRESS"],
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /* ---- RIDE HISTORY (cursor-based pagination) ----
   * O(log N) — uses UUID id as cursor.
   * UUID v4 is random, so we ORDER BY createdAt DESC
   * to get chronological order, using `id` for cursor stability.
   */
  async findByUserId(
    userId: string,
    limit: number = 10,
    cursor?: string
  ): Promise<Ride[]> {
    return prisma.ride.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      include: {
        driver: {
          include: {
            user: { select: { name: true, profilePhotoUrl: true } },
            vehicle: { select: { type: true, make: true, model: true, color: true, licensePlate: true } },
          },
        },
        rating: true,
      },
    });
  }

  /* ---- UPDATE STATUS (atomic with WHERE guard) ---- O(1) */

  async updateStatus(
    rideId: string,
    fromStatus: RideStatus | RideStatus[],
    toStatus: RideStatus,
    extra?: Partial<Prisma.RideUncheckedUpdateInput>
  ): Promise<Ride | null> {
    try {
      return await prisma.ride.update({
        where: {
          id: rideId,
          status: Array.isArray(fromStatus)
            ? { in: fromStatus }
            : fromStatus,
        },
        data: {
          status: toStatus,
          ...extra,
        },
      });
    } catch (err) {
      // P2025 = Record not found (status guard failed)
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return null;
      }
      throw err;
    }
  }

  /* ---- ASSIGN DRIVER ---- O(1) */

  async assignDriver(rideId: string, driverId: string): Promise<Ride | null> {
    return this.updateStatus(rideId, "REQUESTED", "ACCEPTED", {
      driverId,
      acceptedAt: new Date(),
    });
  }

  /* ---- CREATE RATING ---- O(1), unique constraint = idempotent */

  async createRating(data: Prisma.RatingUncheckedCreateInput): Promise<Rating> {
    return prisma.rating.create({ data });
  }

  /* ---- FIND RATING BY RIDE ---- O(1) unique index */

  async findRatingByRideId(rideId: string): Promise<Rating | null> {
    return prisma.rating.findUnique({ where: { rideId } });
  }
}

export default new RideModel();
