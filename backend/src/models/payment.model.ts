import prisma from "../config/prisma";
import { Prisma, Payment, PaymentStatus } from "@prisma/client";

/* ======================================================
   PAYMENT MODEL
   Pure data-access layer. O(1) or O(log N) operations.
   No business logic — that lives in payment.service.ts.
====================================================== */

class PaymentModel {

  /* ---- CREATE ---- O(1) */

  async create(data: Prisma.PaymentUncheckedCreateInput): Promise<Payment> {
    return prisma.payment.create({ data });
  }

  /* ---- FIND BY ID ---- O(1) PK lookup */

  async findById(id: string): Promise<Payment | null> {
    return prisma.payment.findUnique({ where: { id } });
  }

  /* ---- FIND BY RIDE ID ---- O(1) unique index */

  async findByRideId(rideId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({ where: { rideId } });
  }

  /* ---- FIND BY GATEWAY TRANSACTION ID ---- O(1) unique index */

  async findByGatewayTransactionId(gatewayTransactionId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({ where: { gatewayTransactionId } });
  }

  /* ---- UPDATE STATUS (atomic with WHERE guard) ---- O(1) */

  async updateStatus(
    paymentId: string,
    fromStatus: PaymentStatus | PaymentStatus[],
    toStatus: PaymentStatus,
    extra?: Partial<Prisma.PaymentUncheckedUpdateInput>
  ): Promise<Payment | null> {
    try {
      return await prisma.payment.update({
        where: {
          id: paymentId,
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

  /* ---- UPDATE BY RIDE ID (atomic) ---- O(1) */

  async updateByRideId(
    rideId: string,
    fromStatus: PaymentStatus,
    toStatus: PaymentStatus,
    extra?: Partial<Prisma.PaymentUncheckedUpdateInput>
  ): Promise<Payment | null> {
    try {
      return await prisma.payment.update({
        where: {
          rideId,
          status: fromStatus,
        },
        data: {
          status: toStatus,
          ...extra,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return null;
      }
      throw err;
    }
  }

  /* ---- PAYMENT HISTORY (cursor-based pagination) ----
   * O(log N) — uses composite index [userId, createdAt].
   */
  async findByUserId(
    userId: string,
    limit: number = 10,
    cursor?: string
  ): Promise<Payment[]> {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });
  }
}

export default new PaymentModel();
